import { render, InputConfig } from "@wwawing/page-generator";
import * as fs from "fs";
import * as path from "path";
import maps from "./maps-config";

const isDev = process.argv.length >= 3 && process.argv[2] === "dev";

type Maps = typeof maps;
interface IndexPageOption {
    page: {
        maps: Maps;
        thisYear: number;
    }
}

const outputDirectory = path.join(__dirname, "..", "lib");

Promise.all(createPlayPagePromises(maps))
    .catch(error => {
        console.error("error", error);
        process.exit(1);
    });

function createPlayPagePromises(maps: Maps): Promise<void>[] {
    return maps
        .map(map => ({
            mapName: map.fileName,
            outputPageName: map.outputPageName || map.fileName,
            html: render(createPlayPageConfig(map.fileName, map.cssName, map.isClassicMode))
        }))
        .map(params => createWriteFilePromise(
            path.join(outputDirectory, `${params.outputPageName}.html`), params.html));
}

function createPlayPageConfig(mapDataName: string, cssName?: string, isClassicMode?: true): InputConfig {
    return {
        page: {
            additionalCssFiles: ["style.css"],
        },
        wwa: {
            gameOption: {
                isClassicMode,
                autoSave: {
                    intervalSteps: 200
                },
                userVars: {
                    dumpElementId: "vardump",
                    canDisplay: true
                },
                virtualPad: {
                    enable: true,
                    viewportFitEnable: true,
                    controllerId: "virtualpad-controller"
                }
            },
            resources: {
                mapData: `${mapDataName}.dat`,
                wwaJs: isDev ? "wwa.long.js" : "wwa.js",
                wwaCss: cssName,
                titleImage: "cover.gif",
                userVarNamesFile: `${mapDataName}-vars.json`
            },
        },
        copyrights: "official-and-wing"
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
