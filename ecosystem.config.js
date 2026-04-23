// [[ARABIC_HEADER]] هذا الملف (ecosystem.config.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

module.exports = {
  apps: [
    {
      name: 'car-auction',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],
  deploy: {
    production: {
      user: 'YOUR_SERVER_USER',
      host: ['YOUR_SERVER_IP'],
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO_URL',
      path: '/var/www/car-auction',
      'post-deploy': 'npm ci --production && npm run optimize:db && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/car-auction',
      ssh_options: 'StrictHostKeyChecking=no',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      }
    },
    staging: {
      user: 'YOUR_STAGING_USER',
      host: ['YOUR_STAGING_IP'],
      ref: 'origin/develop',
      repo: 'YOUR_GIT_REPO_URL',
      path: '/var/www/car-auction-staging',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 4001
      }
    }
  }
};
