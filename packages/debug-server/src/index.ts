import express from "express";

const baseDir = process.argv.length < 3 ? "." : process.argv[2];

const DEFAULT_PORT = 3000;

function parseServerPort(port: unknown): number {
    if (Number.isNaN(port) || typeof port !== 'number') {
      return DEFAULT_PORT;
    }
    return port;
}

const app = express();
const SERVER_PORT = parseServerPort(process.env.WWA_SERVER_PORT);
app.use("/", express.static(baseDir));
app.listen(SERVER_PORT, () =>  {
    console.log("Welcome to WWA Server!");
    console.log(`http://localhost:${SERVER_PORT} でローカルでマップの仕上がりを確認できます。`);
    console.log(`例: http://localhost:${SERVER_PORT}/wwamap.html`);
    console.log("Ctrl+C もしくはこの画面を閉じると終了します。");
});
