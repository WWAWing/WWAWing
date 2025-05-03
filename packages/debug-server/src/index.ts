import fs from "node:fs";
import path from "node:path";
import sea from "node:sea";
import express from "express";
import serveIndex from "@wwawing/serve-index";

/*!
 * @wwawing/debug-server
 * Copyright (c) 2018-2025 WWA Wing Team
 * MIT Licensed
 */

const baseDir = process.argv.length < 3 ? "." : process.argv[2];

const DEFAULT_PORT = 3000;

function parseServerPort(port: string | undefined): number {
  if (!port) {
    return DEFAULT_PORT;
  }
  const parsedPort = parseInt(port, 10);
  if (Number.isNaN(parsedPort)) {
    return DEFAULT_PORT;
  }
  return parsedPort;
}

const app = express();
const SERVER_PORT = parseServerPort(process.env.WWA_SERVER_PORT);
const decoder = new TextDecoder("utf-8");

app.use(
  "/",
  express.static(baseDir),
  serveIndex(baseDir, {
    icons: true,
    ...(sea.isSea() ? {
    templateParseMode: "fileContent",
      template: decoder.decode(sea.getAsset("directory.html")),
      stylesheet: decoder.decode(sea.getAsset("style.css")),
      iconLoadCallback: (fileName) =>
        Buffer.from(sea.getAsset(`___ICON___${fileName}`)).toString("base64"),
    } : {
      templateParseMode: "fileName",
      // __dirname は webpack された結果の index.js 起点であることに注意せよ
      template: path.join(__dirname, require("@wwawing/serve-index/public/directory.html")),
      stylesheet: path.join(__dirname, require("@wwawing/serve-index/public/style.css")),
      iconLoadCallback: (fileName) => {
        if (fileName.includes("/") || fileName.includes("\\")) {
          throw TypeError("ファイル名に使用できない文字が含まれています。");
        }
        // 以下の処理は serve-index を模倣
        return fs.readFileSync(
          path.join(__dirname, require(`@wwawing/serve-index/public/icons/${fileName}`)),
          "base64"
        );
      }
    }),
  })
);

app.listen(SERVER_PORT, () => {
  console.log("Welcome to WWA Server!");
  console.log(
    `http://localhost:${SERVER_PORT} でローカルでマップの仕上がりを確認できます。`
  );
  console.log(`例: http://localhost:${SERVER_PORT}/wwamap.html`);
  console.log("Ctrl+C もしくはこの画面を閉じると終了します。");
});
