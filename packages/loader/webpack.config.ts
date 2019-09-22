import * as webpack from "webpack";
import * as path from "path";

const config: webpack.Configuration =  {
    mode: "development",
    entry: "./src/index.ts",
    output: {
        filename: "wwaload.long.js",
        path: path.resolve(__dirname, "lib")
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.ts/,
                use: [{ loader: "ts-loader" }],
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            IS_WEB_WORKER_MODE: JSON.stringify(true)
        })
    ]
};

export default config;
