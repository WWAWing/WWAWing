import * as webpack from "webpack";
import config from "./webpack.config";
import TerserPlugin from "terser-webpack-plugin";

export default {
    ...config,
    mode: "production",
    output: {
        ...config.output,
        pathinfo: false,
        filename: "wwa.js"
    },
    optimization: {
        ...config.optimization,
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                output: { comments: /(@license|@preserve)/i, },
            },
            extractComments: false
        })]

    }
} as webpack.Configuration;
