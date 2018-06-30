import * as pug from "pug";
import * as path from "path";
import { getConfigFromFile, WWAPageConfig, WWAPageConfigForRendering, fillDefaultsAndUtil } from "./config";

export { WWAPageConfig };

export function generateWWAPatgeFromConfigFile(configFilePath: string, overwriteDefaultCopyrights: boolean = false): string {
  const pageConfig = getConfigFromFile(configFilePath, overwriteDefaultCopyrights);
  return generateWWAPageByConfigForRendering(pageConfig);
}

export function generateWWAPageFromConfig(inputConfig: WWAPageConfig, overwriteDefaultCopyrights: boolean = false): string {
  const pageConfig = fillDefaultsAndUtil(inputConfig, overwriteDefaultCopyrights);
  return generateWWAPageByConfigForRendering(pageConfig);
}

export function generateWWAPageFromMapdataName(mapDataName: string, isDevMode = false, overwriteDefaultCopyrights = false): string {
  return generateWWAPageFromConfig({ page: { wwa: { resources: { mapdata: mapDataName } }, isDevMode } }, overwriteDefaultCopyrights);
}

function generateWWAPageByConfigForRendering(pageConfig: WWAPageConfigForRendering): string {
  const pugFilePath = path.join(__dirname, path.normalize(pageConfig.page.template));
  const compileTemplate = pug.compileFile(pugFilePath, { pretty: true });
  return compileTemplate(pageConfig) + "\n";
}
