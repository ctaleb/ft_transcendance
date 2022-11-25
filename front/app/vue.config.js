const { defineConfig } = require("@vue/cli-service");
const Dotenv = require("dotenv-webpack");
module.exports = defineConfig({
  configureWebpack: {},
  transpileDependencies: true,
  lintOnSave: false,
});
