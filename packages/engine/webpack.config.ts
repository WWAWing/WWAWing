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
    target: "browserslist:last 2 versions or IE 11",
    output: {
        filename: "wwa.long.js",
        path: path.resolve(__dirname, "lib")
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            // CryptoJS 内で node コアモジュールの crypto を require する問題 (nodeでの実行時に使用される) の対応
            // webpack した後の生成物はブラウザでしか実行されないので、ポリフィルは含めずに空のモジュールをバンドルする。
            crypto: false,
            // WWA Loader の node 実装で使っている fs を落とす
            fs: false,
        }
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
    },
    devtool: "source-map"
};

export default config;
