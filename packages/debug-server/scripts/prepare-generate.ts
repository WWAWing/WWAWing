import fs from "node:fs";
import path from "node:path";
import shelljs from "shelljs";
import resolvePkg from "resolve-pkg";

const serveIndexDir = resolvePkg("@wwawing/serve-index");

const baseDir = path.join(__dirname, "..");
const tmpDir = path.join(baseDir, "tmp");
const binDir = path.join(baseDir, "bin");
const nodeExePath = path.join(resolvePkg("@wwawing/assets")!, "exe", "node.exe");

if (!fs.existsSync(nodeExePath)) {
    throw new Error("node.exe がありません。Git LFS をインストール後、 git lfs install を実行してください。");
}

shelljs.mkdir(binDir);
shelljs.cp(
  path.join(nodeExePath),
  path.join(binDir, "wwa-server.exe")
);

shelljs.mkdir(tmpDir);
shelljs.cp(
  "-R",
  path.join(serveIndexDir!, "public"),
  path.join(tmpDir, "public")
);

fs.writeFileSync(
  path.join(tmpDir, "sea-config.json"),
  // debug-server の root 基準
  JSON.stringify({
    main: "./lib/index.js",
    output: "./tmp/sea-prep.blob",
    assets: {
      "directory.html": "./tmp/public/directory.html",
      "style.css": "./tmp/public/style.css",
      // UNDONE: アイコンを加える
    },
  })
);
