import { generateWWAPageFromConfig, WWAPageConfig, getDefaultCopyrights } from "@wwawing/html-generator";
import * as fs from "fs";
import * as path from "path";

// マップデータのファイル名から .dat を取り除いたもの
const mapNamesDev = ["caves01", "caves02", "island02", "wwamap", "test", "g002-302", "g002-310"];
const mapNamesDist = ["caves01", "caves02", "island02", "wwamap"];

const allPromises: Promise<void>[] = [];
if (process.argv.length < 3 || process.argv[2] === "dist" || process.argv[2] === "all") {
    allPromises.concat(createDistPagePromises());
}
if (process.argv[2] === "dev" || process.argv[2] === "all") {
    allPromises.concat(createDevPagePromises());
}
Promise.all(allPromises)
    .catch(error => {
        console.error("error", error);
        process.exit(1);
    });

function createDistPagePromises(): Promise<void>[] {
    return createHTMLFilePromises(mapNamesDist);
}

function createDevPagePromises(): Promise<void>[] {
    return createHTMLFilePromises(mapNamesDev, true);
}

function createHTMLFilePromises(mapNames: string[], isDevMode = false): Promise<void>[] {
    return mapNames
        .map(mapName => ({
            mapName,
            html: generateWWAPageFromConfig(createConfig(mapName, isDevMode))
        }))
        .map(params => createWriteFilePromise(
            isDevMode ?
                path.join(__dirname, "..", "..", "debug", `${params.mapName}.html`) :
                path.join(__dirname, "..", "..", "dist_html", `${params.mapName}.html`),
            params.html
        ));
}

function createConfig(mapName: string, isDevMode: boolean): WWAPageConfig {
    return {
        page: {
            additionalCssFiles: ["style.css"],
            isDevMode,
            wwa: {
                resources: {
                    mapdata: mapName,
                    titleImg: "cover.gif"
                },
                urlgateEnable: true
            },
            copyrights: getDefaultCopyrights()
        }
    };
}

function createWriteFilePromise(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) =>
        fs.writeFile(filePath, content, (err) => err ? reject(err) : resolve()));
}
