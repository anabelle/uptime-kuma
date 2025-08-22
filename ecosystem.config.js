module.exports = {
    apps: [
        {
            name: "uptime-kuma-backend",
            script: "./server/server.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: "uptime-kuma-frontend",
            script: 'vite',
            args: '--host --config ./config/vite.config.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            }
        }
    ]
};
