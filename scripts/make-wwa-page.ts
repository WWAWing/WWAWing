import { generateWWAPageFromConfig, WWAPageConfig, getDefaultCopyrights } from "@wwawing/html-generator";
import * as fs from "fs";
import * as path from "path";

// マップデータのファイル名から .dat を取り除いたもの
const mapNamesDev = ["caves01", "caves02", "island02", "wwamap", "test", "g002-302", "g002-310"];
const mapNamesDist = ["caves01", "caves02", "island02", "wwamap"];

const distPromises = (process.argv.length < 3 || process.argv[2] === "dist" || process.argv[2] === "all") ?
    createDistPagePromises() : [];

const devPromises = (process.argv[2] === "dev" || process.argv[2] === "all") ? createDevPagePromises() : [];

Promise.all(distPromises.concat(devPromises))
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
            html: generateWWAPageFromConfig(createConfig(`${mapName}.dat`, isDevMode))
        }))
        .map(params => createWriteFilePromise(
            isDevMode ?
                path.join(__dirname, "..", "packages", "assets", "html", "dev", `${params.mapName}.html`) :
                path.join(__dirname, "..", "packages", "assets", "html", "dist", `${params.mapName}.html`),
            params.html
        ));
}

function createConfig(mapdata: string, isDevMode: boolean): WWAPageConfig {
    return {
        page: {
            additionalCssFiles: ["style.css"],
            wwa: {
                resources: {
                    mapdata,
                    wwaJs: isDevMode ? "wwa.long.js" : "wwa.js",
                    titleImg: "cover.gif",
                },
                urlgateEnable: true
            },
            copyrights: getDefaultCopyrights()
        }
    };
}

function createWriteFilePromise(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) =>
        fs.writeFile(
            filePath,
            content,
            err => (err ? reject(err) : resolve())
        )
    );
}
