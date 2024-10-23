//Used to switch the environments
module.exports = {
  apps: [
    {
      name: "EcommerceTemplate",
      script: "./server.js",
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
