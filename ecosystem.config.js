// ecosystem.config.js
// ใช้กับ PM2: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "steam-boost",
      script: "index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
