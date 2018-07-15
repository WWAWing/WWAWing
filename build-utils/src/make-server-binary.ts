import { compile } from "nexe";

compile({
    input: "../debug-server/package.json", // 暫定
    targets: [
        "windows-x64-9.5.0"
    ],
    output: "wwa-server"
}).then(() => console.log("compile server to binary done."));
