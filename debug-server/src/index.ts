import * as express from "express";

const app = express();
const SERVER_PORT = 3000;
app.use("/", express.static("debug"));
app.listen(SERVER_PORT, () => console.log("wwa debug listening on port 3000!"));
