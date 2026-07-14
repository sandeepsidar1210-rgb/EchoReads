// PM2 Ecosystem Config for EchoReads
// Run: pm2 start ecosystem.config.js
// Then: pm2 save  (to persist across reboots)
// Then: pm2 startup  (to auto-start on Windows boot)

module.exports = {
  apps: [
    {
      name: 'echoreads-backend',
      script: 'server.js',
      cwd: './backend',
      
      // Auto-restart settings
      watch: false,           // Don't watch files (use 'npm run dev' for dev)
      autorestart: true,      // Restart on crash
      restart_delay: 3000,    // Wait 3 seconds before restarting
      max_restarts: 10,       // Max restart attempts before giving up
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
