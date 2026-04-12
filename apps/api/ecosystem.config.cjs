// PM2 ecosystem config (CommonJS — required even for ESM apps)
// Usage:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 reload theprimeway-api --update-env
//   pm2 save && pm2 startup

'use strict'

module.exports = {
  apps: [
    {
      name: 'theprimeway-api',

      // Entry point — must be the compiled ESM output, not the TypeScript source.
      // Node 22 runs ESM natively; no --experimental flags needed.
      script: 'dist/index.js',

      // Absolute path to the deployed bundle (matches rsync destination)
      cwd: '/var/www/theprimeway/api',

      // Fork mode: single process.
      // Switch to exec_mode: 'cluster' + instances: 'max' only when you need
      // horizontal CPU scaling — cluster mode with ESM requires Node >= 22.
      exec_mode: 'fork',
      instances: 1,

      // Interpreter args — pass --enable-source-maps for better stack traces
      // from the tsup-compiled output (tsup emits source maps by default).
      node_args: '--enable-source-maps',

      // Restart policy
      autorestart: true,
      max_memory_restart: '512M',
      restart_delay: 3000,         // wait 3 s before each restart
      max_restarts: 10,            // give up after 10 rapid restarts
      min_uptime: '10s',           // process must stay up 10 s to count as "started"

      // Log file paths
      error_file: '/var/log/pm2/theprimeway-api-error.log',
      out_file:   '/var/log/pm2/theprimeway-api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Do NOT watch the filesystem — deploys restart PM2 explicitly
      watch: false,

      // Environment for `pm2 start ... --env production`
      env_production: {
        NODE_ENV: 'production',
        PORT: '3001',
        // All other secrets are loaded from the .env file written by CI.
        // dotenv/config is imported at the top of dist/index.js so it runs
        // before any other module reads process.env.
      },
    },
  ],
}
