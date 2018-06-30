import * as pug from "pug";
import * as path from "path";
import { getConfigFromFile, WWAPageConfig, WWAPageConfigForRendering, fillDefaultsAndUtil } from "./config";

export { WWAPageConfig };

export function generateWWAPatgeFromConfigFile(configFilePath: string): string {
  const pageConfig = getConfigFromFile(configFilePath);
  return generateWWAPageByConfigForRendering(pageConfig);
}

export function generateWWAPageFromConfig(inputConfig: WWAPageConfig): string {
  const pageConfig = fillDefaultsAndUtil(inputConfig);
  return generateWWAPageByConfigForRendering(pageConfig);
}

export function generateWWAPageFromMapdataName(mapDataName: string): string {
  return generateWWAPageFromConfig({ page: { wwa: { resources: { mapdata: mapDataName } } } });
}

function generateWWAPageByConfigForRendering(pageConfig: WWAPageConfigForRendering): string {
  const pugFilePath = path.join(__dirname, path.normalize(pageConfig.page.template));
  const compileTemplate = pug.compileFile(pugFilePath, { pretty: true });
  return compileTemplate(pageConfig) + "\n";
}
