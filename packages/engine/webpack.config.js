const webpack = require("webpack");
const path = require("path");
const package = require("./package.json");

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
    plugins: [
        new webpack.DefinePlugin({
            VERSION_WWAJS: JSON.stringify(package.version)
        })
    ],
    watchOptions: {
        ignored: ["node_modules", 'lib/**/*.js']
    }
};