import webpack from "webpack";
import path from "node:path";

const config: webpack.Configuration = {
  mode: "production",
  entry: "./src/index.ts",
  target: "node22",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "lib"),
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
    ],
  },
  watchOptions: {
    ignored: ["node_modules", "lib"],
  },
};

export default config;
