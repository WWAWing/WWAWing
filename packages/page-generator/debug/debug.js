const fs = require("fs");
const path = require("path");
const htmlGenerator = require("../lib");

// 暫定CLI. CLIを別パッケージに分割したら消す
const fileName = process.argv.length < 3 ? "../config/default.yml" : process.argv[2];
const html = htmlGenerator.generateWWAPatgeFromConfigFile(fileName);
fs.writeFileSync(
  path.join(__dirname, "..", "output", "wwa.html"),
  html
);
