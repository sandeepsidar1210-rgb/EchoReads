class ApiConfig {
  /// Base URL for the EchoReads backend.
  ///
  /// Auto-updated by start-echoreads.ps1 on each launch.
  /// Current LAN IP: 10.157.111.119
  ///
  /// If you change WiFi networks, restart PC or re-run start-echoreads.ps1
  /// then rebuild the Flutter app: flutter run
  static const String baseUrl = 'http://10.157.111.119:3000/api';
}
