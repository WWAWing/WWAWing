const config = require("./webpack.config.js");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

config.output.pathinfo = false;
config.plugins.push(new UglifyJsPlugin({
    uglifyOptions:{
        keep_fnames: false,
        compress: {
            warnings: false
        }
    },
    extractComments: false
}));
config.output.filename = "wwaload.js";

module.exports = config;
