const webpack = require("webpack");
const path = require("path");
const package = require("./package.json");

const cryptoJsLicenseComment = `crypto-js\
 (c) Jeff Mott / Evan Vosberg /\
 MIT License https://github.com/brix/crypto-js/blob/develop/LICENSE`;

const wwaWingEngineLicenseComment = `WWA Wing Engine\
 (c) NAO / WWA Wing Team /\
 MIT License https://github.com/WWAWing/WWAWing/blob/develop/packages/engine/LICENSE`;

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
            banner: `@license ${wwaWingEngineLicenseComment}\n@license ${cryptoJsLicenseComment}`
        })
    ],
    watchOptions: {
        ignored: ["node_modules", 'lib/**/*.js']
    },
};