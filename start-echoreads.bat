@echo off
:: ============================================================
::  EchoReads Startup Script
::  Run this script once to:
::   1. Detect your current WiFi LAN IP
::   2. Update Flutter api_config.dart automatically
::   3. Start the backend via PM2 (persistent, auto-restarts)
::   4. Open Windows Firewall for port 3000
:: ============================================================

setlocal enabledelayedexpansion

set "PROJECT_DIR=c:\Users\sande\Academics\web page\EchoReads"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FLUTTER_CONFIG=%PROJECT_DIR%\echoreads_mobile\lib\config\api_config.dart"
set "LOGS_DIR=%PROJECT_DIR%\logs"

echo.
echo  ==========================================
echo   EchoReads Backend Launcher
echo  ==========================================
echo.

:: --- Create logs directory if missing ---
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

:: --- Detect current WiFi LAN IP ---
set "LAN_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
    set "RAW=%%a"
    set "RAW=!RAW: =!"
    if not defined LAN_IP set "LAN_IP=!RAW!"
)

if not defined LAN_IP (
    echo  [!] Could not detect LAN IP. Using localhost as fallback.
    set "LAN_IP=localhost"
) else (
    echo  [OK] Detected LAN IP: %LAN_IP%
)

:: --- Update Flutter api_config.dart ---
echo  [..] Updating Flutter api_config.dart...

(
echo class ApiConfig {
echo   /// Base URL for the EchoReads backend.
echo   ///
echo   /// Auto-updated by start-echoreads.bat on each launch.
echo   /// Current LAN IP: %LAN_IP%
echo   ///
echo   /// If you change WiFi networks, run start-echoreads.bat again
echo   /// then rebuild the Flutter app: flutter run
echo   static const String baseUrl = 'http://%LAN_IP%:3000/api';
echo }
) > "%FLUTTER_CONFIG%"

echo  [OK] Flutter config updated -^> http://%LAN_IP%:3000/api
echo.

:: --- Open Windows Firewall for port 3000 (requires admin) ---
netsh advfirewall firewall show rule name="EchoReads Backend" > nul 2>&1
if %errorlevel% neq 0 (
    echo  [..] Adding Windows Firewall rule for port 3000...
    netsh advfirewall firewall add rule name="EchoReads Backend" dir=in action=allow protocol=TCP localport=3000 > nul 2>&1
    if %errorlevel%==0 (
        echo  [OK] Firewall rule added for port 3000
    ) else (
        echo  [!] Could not add firewall rule ^(run script as Admin to fix^)
    )
) else (
    echo  [OK] Firewall rule already exists for port 3000
)
echo.

:: --- Start / Restart backend with PM2 ---
echo  [..] Starting EchoReads backend with PM2...
cd /d "%PROJECT_DIR%"

:: Check if PM2 process already exists
pm2 describe echoreads-backend > nul 2>&1
if %errorlevel%==0 (
    echo  [..] PM2 process found. Restarting...
    pm2 restart echoreads-backend
) else (
    echo  [..] Starting fresh PM2 process...
    pm2 start ecosystem.config.js
)

echo.
echo  [OK] Backend is now running as a PM2 service
echo  [OK] It will auto-restart if it crashes
echo.

:: --- Save PM2 process list so it survives reboots ---
pm2 save
echo  [OK] PM2 process list saved

echo.
echo  ==========================================
echo   EchoReads is READY
echo  ==========================================
echo.
echo   Web App:  http://localhost:3000
echo   Mobile:   http://%LAN_IP%:3000/api
echo.
echo   To view logs:      pm2 logs echoreads-backend
echo   To stop backend:   pm2 stop echoreads-backend
echo   To restart:        pm2 restart echoreads-backend
echo   To view status:    pm2 status
echo.
echo   REMEMBER: If your WiFi IP changes (new network), run this
echo   script again and rebuild the Flutter app (flutter run).
echo.
pause
