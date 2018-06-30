import * as fs from "fs";
import * as pug from "pug";
import * as path from "path";
import { readConfig } from "./config";

export function createPage(configFilePath: string): string {
  const pageConfig = readConfig(configFilePath);
  const pugFilePath = path.join(__dirname, path.normalize(pageConfig.page.template));
  const compileTemplate = pug.compileFile(pugFilePath, { pretty: true });
  return compileTemplate(pageConfig);
}

// 暫定CLI. CLIを別パッケージに分割したら消す
const fileName = process.argv.length < 3 ? "../config/default.yml" : process.argv[2];
const html = createPage(fileName) + "\n";
fs.writeFileSync(
  path.join(__dirname, "..", "output", "wwa.html"),
  html
);
