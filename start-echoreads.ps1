# EchoReads Backend Startup Script (PowerShell)
# This script is designed to be run by Windows Task Scheduler at login.
# It starts the Node.js backend and keeps it running forever.

$ProjectDir = "c:\Users\sande\Academics\web page\EchoReads"
$BackendDir  = "$ProjectDir\backend"
$LogFile     = "$ProjectDir\logs\backend.log"
$FlutterConf = "$ProjectDir\echoreads_mobile\lib\config\api_config.dart"

# Ensure logs directory exists
if (-not (Test-Path "$ProjectDir\logs")) {
    New-Item -ItemType Directory -Path "$ProjectDir\logs" | Out-Null
}

# ---------- Detect LAN IP ----------
function Get-LanIp {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
           Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
           Select-Object -First 1).IPAddress
    if ($ip) { return $ip } else { return "localhost" }
}

$LanIp = Get-LanIp
"[$(Get-Date)] EchoReads backend starting. LAN IP: $LanIp" | Out-File $LogFile -Encoding UTF8

# ---------- Update Flutter api_config.dart ----------
$dartContent = @"
class ApiConfig {
  /// Base URL for the EchoReads backend.
  ///
  /// Auto-updated by start-echoreads.ps1 on each launch.
  /// Current LAN IP: $LanIp
  ///
  /// If you change WiFi networks, restart PC or re-run start-echoreads.ps1
  /// then rebuild the Flutter app: flutter run
  static const String baseUrl = 'http://${LanIp}:3000/api';
}
"@
Set-Content -Path $FlutterConf -Value $dartContent -Encoding UTF8
"[$(Get-Date)] Updated Flutter config -> http://${LanIp}:3000/api" | Out-File $LogFile -Append -Encoding UTF8

# ---------- Open Firewall for port 3000 ----------
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    try {
        $rule = Get-NetFirewallRule -DisplayName "EchoReads Backend" -ErrorAction SilentlyContinue
        if (-not $rule) {
            New-NetFirewallRule -DisplayName "EchoReads Backend" `
                -Direction Inbound -Protocol TCP -LocalPort 3000 `
                -Action Allow -ErrorAction SilentlyContinue | Out-Null
            "[$(Get-Date)] Firewall rule added for port 3000" | Out-File $LogFile -Append -Encoding UTF8
        }
    } catch {
        "[$(Get-Date)] Firewall rule check/add failed: $_" | Out-File $LogFile -Append -Encoding UTF8
    }
} else {
    "[$(Get-Date)] Running without Administrator privileges. Skipping firewall configuration." | Out-File $LogFile -Append -Encoding UTF8
}

# ---------- Auto-restart loop ----------
"[$(Get-Date)] Starting auto-restart loop..." | Out-File $LogFile -Append -Encoding UTF8

$restartCount = 0
while ($true) {
    $restartCount++
    "[$(Get-Date)] [Attempt $restartCount] Starting Node.js server..." | Out-File $LogFile -Append -Encoding UTF8
    
    try {
        Push-Location $BackendDir
        
        # Run node server.js synchronously via cmd.exe to prevent PowerShell NativeCommandError crashes
        cmd.exe /c "node server.js > `"$ProjectDir\logs\server-out.log`" 2> `"$ProjectDir\logs\server-err.log`""
        
        Pop-Location
        "[$(Get-Date)] Server stopped. Restarting in 5 seconds..." | Out-File $LogFile -Append -Encoding UTF8
    } catch {
        "[$(Get-Date)] Error running server: $_" | Out-File $LogFile -Append -Encoding UTF8
        try { Pop-Location } catch {}
    }
    
    Start-Sleep -Seconds 5
}
