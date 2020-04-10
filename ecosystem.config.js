module.exports = {
    apps : [{
        name: "goblitz-server",
        script: "node ./bin/www",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
};
