import * as webpack from "webpack";
import * as path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

/**
 * 注:  resources/index.html を開いて使うためのデバッグ用です。
 */
const config: webpack.Configuration = {
    mode: "development",
    entry: ["./src/index.ts", "./src/debug-resources/test.ts", "./src/debug-resources/index.html" ],
    output: {
        filename: "wwaload-debug.js",
        path: path.resolve(__dirname, "debug")
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
            },
            {
                test: /\.html?/,
                use: [{loader: "html-loader"}]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./src/debug-resources/index.html",
            js: "wwaload-debug.js"
        })
    ]
};

export default config;
