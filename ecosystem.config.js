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
            script: 'npx',
            args: 'serve -s dist -l 3000',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
