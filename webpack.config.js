const webpack = require("webpack");
const path = require("path");

module.exports = {
    mode: "development",
    entry: "./src/wwa_main.ts",
    output: {
        filename: "wwa.long.js",
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
    plugins: []
};