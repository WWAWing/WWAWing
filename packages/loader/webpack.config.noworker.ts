import config from "./webpack.config";
import * as webpack from "webpack";

export default {
    ...config,
    plugins: [
        ...config.plugins,
        new webpack.DefinePlugin({
            IS_WEB_WORKER_MODE: JSON.stringify(false)
        })
    ],
    output: {
        ...config.output,
        filename: "wwaload.long.noworker.js"
    }
} as webpack.Configuration;
