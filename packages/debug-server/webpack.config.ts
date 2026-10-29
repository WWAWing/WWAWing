import webpack from "webpack";
import path from "node:path";

// debug-server は 当面の間引き続き webpack を利用します。
// rollup を使った場合はアセットの解決を手動でやる必要があるので、webpack で事足りる内は webpack を使い続けようと思います。
const config: webpack.Configuration = {
  mode: "production",
  entry: "./src/index.ts",
  target: "node24",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "lib"),
    assetModuleFilename: (pathData) => {
      if (pathData.filename?.endsWith("png")) {
        return "icons/[name].[hash][ext][query]";
      }
      return "[name].[hash][ext][query]";
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      fs: "fs",
      path: "path",
      url: "url",
      stream: "stream",
      util: "util",
      emitter: "events",
    },
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        use: [
          {
            loader: "ts-loader",
            options: { configFile: path.resolve(__dirname, "tsconfig.json") },
          },
        ],
      },
      { test: /\.(html|css|png)$/, type: "asset/resource" },
    ],
  },
  watchOptions: {
    ignored: ["node_modules", "lib"],
  },
};

export default config;
