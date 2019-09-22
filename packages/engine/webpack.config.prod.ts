import * as webpack from "webpack";
import config from "./webpack.config";
import UglifyJsPlugin from "uglifyjs-webpack-plugin";

export default {
    ...config,
    output: {
        ...config.output,
        pathinfo: false,
        filename: "wwa.js"
    },
    plugins: [
        ...config.plugins,
        new UglifyJsPlugin({
            uglifyOptions:{
                keep_fnames: false,
                compress: {
                    warnings: false
                }
            },
            extractComments: false
        })
    ],
} as webpack.Configuration;
