import * as webpack from "webpack";
import * as path from "path";
import * as packageJson from "./package.json";

const cryptoJsLicenseComment = `crypto-js\
 (c) Jeff Mott / Evan Vosberg /\
 MIT License https://github.com/brix/crypto-js/blob/develop/LICENSE`;

const wwaWingEngineLicenseComment = `WWA Wing Engine\
 (c) NAO / WWA Wing Team /\
 MIT License https://github.com/WWAWing/WWAWing/blob/develop/packages/engine/LICENSE`;

const config: webpack.Configuration = {
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
                use: [{
                    loader: "ts-loader",
                    options: { configFile: "tsconfig.webpack.json" },
                }],
                exclude: /node_modules/,
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            VERSION_WWAJS: JSON.stringify(packageJson.version)
        }),
        new webpack.BannerPlugin({
            banner: `@license ${wwaWingEngineLicenseComment}\n@license ${cryptoJsLicenseComment}`
        })
    ],
    watchOptions: {
        ignored: ["node_modules", 'lib/**/*.js']
    }
};

export default config;
