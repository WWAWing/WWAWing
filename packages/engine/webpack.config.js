const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const package = require("./package.json");

const mitLicenseDelimiter = "Permission is hereby granted";
const cryptoJsLicenseComment = fs
    .readFileSync("./node_modules/crypto-js/LICENSE")
    .toString()
    .split(mitLicenseDelimiter)[0]
    .trimRight();
const wwaWingEngineLicenseComment = fs
    .readFileSync("./LICENSE")
    .toString()
    .split(mitLicenseDelimiter)[0]
    .trim();

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
        }),
        new webpack.BannerPlugin({
            banner: `WWA Wing\n${wwaWingEngineLicenseComment}\n\ncrypro-js\n${cryptoJsLicenseComment}`
        })
    ],
    watchOptions: {
        ignored: ["node_modules", 'lib/**/*.js']
    }
};