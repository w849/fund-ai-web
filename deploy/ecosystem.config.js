module.exports = {
  apps: [
    {
      name: 'fund-ai-server',
      script: './server/src/app.js',
      cwd: '/var/www/fund-ai-web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
