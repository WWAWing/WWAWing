import * as express from "express";

const baseDir = process.argv.length < 3 ? "." : process.argv[2];

const app = express();
const SERVER_PORT = 3000;
app.use("/", express.static(baseDir));
app.listen(SERVER_PORT, () => console.log("wwa debug listening on port 3000!"));
