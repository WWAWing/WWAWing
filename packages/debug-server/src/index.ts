import express from "express";
import serveIndex from "serve-index";

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
app.use("/",
    express.static(baseDir),
    serveIndex(baseDir, { icons: true })
);
app.listen(SERVER_PORT, () =>  {
    console.log("Welcome to WWA Server!");
    console.log(`http://localhost:${SERVER_PORT} でローカルでマップの仕上がりを確認できます。`);
    console.log(`例: http://localhost:${SERVER_PORT}/wwamap.html`);
    console.log("Ctrl+C もしくはこの画面を閉じると終了します。");
});
