import * as fs from "fs";
import * as pug from "pug";
import * as path from "path";
import { WWAPageConfig, fillDefaultConfig } from "./config";

const customPageConfig: WWAPageConfig = {
  wwa: {
    mapdata: "island02.dat"
  }
};

const pugFileNameWithoutExtention = "wwa";
const pageConfig = fillDefaultConfig(customPageConfig);
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
