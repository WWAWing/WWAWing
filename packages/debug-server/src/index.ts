import express from "express";
import http from "http";

const baseDir = process.argv.length < 3 ? "." : process.argv[2];

const app = express();
const SERVER_PORT = 3000;
app.use("/", express.static<http.ServerResponse>(baseDir));
app.listen(SERVER_PORT, () =>  {
    console.log("Welcome to WWA Server!");
    console.log(`http://localhost:${SERVER_PORT} でローカルでマップの仕上がりを確認できます。`);
    console.log(`例: http://localhost:${SERVER_PORT}/wwamap.html`);
    console.log("Ctrl+C もしくはこの画面を閉じると終了します。");
});
