import * as pug from "pug";
import * as path from "path";
import { readConfig } from "./config";

export function createPage(configFilePath: string): string {
  const pageConfig = readConfig(configFilePath);
  const pugFilePath = path.join(__dirname, path.normalize(pageConfig.page.template));
  const compileTemplate = pug.compileFile(pugFilePath, { pretty: true });
  return compileTemplate(pageConfig) + "\n";
}
