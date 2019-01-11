const config = require("./webpack.config.js");
const webpack = require("webpack");

config.plugins = [new webpack.DefinePlugin({
    IS_WEB_WORKER_MODE: JSON.stringify(false)
})];

config.output.filename = "wwaload.long.noworker.js";
module.exports = config;
