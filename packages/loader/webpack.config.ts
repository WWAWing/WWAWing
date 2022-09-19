import * as webpack from "webpack";
import * as path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

/**
 * 注:  resources/index.html を開いて使うためのデバッグ用です。
 */
const config: webpack.Configuration = {
    mode: "development",
    entry: ["./src/index.ts", "./src/___debug-resources___/demo-browser.ts", "./src/___debug-resources___/index.html"],
    target: "browserslist:last 2 versions or IE 11",
    output: {
        filename: "wwaload-debug.js",
        path: path.resolve(__dirname, "debug", "browser")
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            "fs": false
        }
    },
    module: {
        rules: [
            {
                test: /\.ts/,
                use: [{
                    loader: "ts-loader",
                    options: { configFile: "tsconfig.webpack.json" }
                }],

                exclude: /node_modules/
            },
            {
                test: /\.html?/,
                use: [{ loader: "html-loader" }]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./src/___debug-resources___/index.html",
            js: "wwaload-debug.js"
        })
    ]
};

export default config;
