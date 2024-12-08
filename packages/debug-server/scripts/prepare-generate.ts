import fs from "node:fs";
import path from "node:path";
import shelljs from "shelljs";
import resolvePkg from "resolve-pkg";

const assetsDir = resolvePkg("@wwawing/assets");
if (!assetsDir) {
  throw new Error("@wwawing/assets がありません。");
}
const serveIndexDir = resolvePkg("@wwawing/serve-index");
if (!serveIndexDir) {
  throw new Error("@wwawing/serve-index がありません。");
}
const nodeExePath = path.join(assetsDir, "exe", "node.exe");
if (!fs.existsSync(nodeExePath)) {
  throw new Error("node.exe がありません。");
}

// node.exe は Git LFS で管理している。中身が 「version」から始まっている場合、Git LFSのポインタファイルと判断し、エラーメッセージを表示し終了。
// node.exe 全体を readFileSync で読むと大変なことになるので、先頭だけ読んで中身を判定する。
const TEST_TEXT = "version";
fs.createReadStream(nodeExePath, { end: TEST_TEXT.length - 1 })
  .on("data", (chunk) => {
    const isLfsPointer = [...chunk].reduce(
      (isLfsPointer, currentByte, index) =>
        isLfsPointer && currentByte === TEST_TEXT.charCodeAt(index),
      true
    );
    if (isLfsPointer) {
      console.error(
        "Git LFS をインストールしてください。\nnode.exe がGit LFSのポインタファイルになっています。"
      );
      process.exit(1);
    }
    main(serveIndexDir);
  })
  .on("error", (error) => {
    console.error("node.exe の読み取り中にエラーが発生しました。");
    console.error(error);
    process.exit(1);
  });

function main(serveIndexDir: string) {
  const baseDir = path.join(__dirname, "..");
  const tmpDir = path.join(baseDir, "tmp");
  const binDir = path.join(baseDir, "bin");

  shelljs.mkdir(binDir);
  shelljs.cp(path.join(nodeExePath), path.join(binDir, "wwa-server.exe"));

  shelljs.mkdir(tmpDir);
  shelljs.cp(
    "-R",
    path.join(serveIndexDir, "public"),
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
}
