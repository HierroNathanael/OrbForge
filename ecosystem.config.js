// Optional PM2 process-manager config: `pm2 start ecosystem.config.js`.
// Not required to run the bot (`npm start` works standalone) — this just
// adds auto-restart-on-crash and log management for production hosting.
export default {
  apps: [
    {
      name: 'orbforge',
      script: 'index.js',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000
    }
  ]
};
