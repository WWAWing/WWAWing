import * as fs from "fs";
import * as pug from "pug";
import * as path from "path";
import { readConfig } from "./config";

const pugFileNameWithoutExtention = "wwa";
const pageConfig = readConfig();
const pugFilePath = path.join(
  __dirname,
  "..",
  "template",
  `${pugFileNameWithoutExtention}.pug`
);
const compileTemplate = pug.compileFile(pugFilePath, { pretty: true });
const html = compileTemplate(pageConfig);
fs.writeFileSync(
  path.join(__dirname, "..", "output", `${pugFileNameWithoutExtention}.html`),
  html
);
