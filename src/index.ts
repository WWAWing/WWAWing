import * as pug from "pug";
import * as path from "path";
import { WWAPageConfig, fillDefaultConfig } from "./config";

const customPageConfig: WWAPageConfig = {
    wwa: {
        mapdata: "island02.dat"
    }
};

const pageConfig = fillDefaultConfig(customPageConfig);
const pugFile = path.join(__dirname, "..", "template", "wwa.pug");
const compileTemplate = pug.compileFile(pugFile, { pretty: true });
console.log(compileTemplate(pageConfig));
