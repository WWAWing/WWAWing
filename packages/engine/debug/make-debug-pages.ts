import { render, InputConfig } from "@wwawing/page-generator";
import * as fs from "fs";
import * as pug from "pug";
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

const indexPageTemplageFile = path.join(__dirname, "index.pug");
const compileIndexPage = pug.compileFile(indexPageTemplageFile, { pretty: true });
const outputDirectory = path.join(__dirname, "..", "lib");

Promise.all([
    ...createPlayPagePromises(maps),
    createIndexPage({ page: { maps, thisYear: new Date().getFullYear() } })
])
    .catch(error => {
        console.error("error", error);
        process.exit(1);
    });

function createIndexPage(option: IndexPageOption): Promise<void> {
    return createWriteFilePromise(
        path.join(outputDirectory, "index.html"), `${compileIndexPage(option)}\n`);
}

function createPlayPagePromises(maps: Maps): Promise<void>[] {
    return maps
        .map(map => ({
            mapName: map.fileName,
            outputPageName: map.outputPageName || map.fileName,
            html: render(createPlayPageConfig(`${map.fileName}.dat`, map.cssName, map.isClassicMode))
        }))
        .map(params => createWriteFilePromise(
            path.join(outputDirectory, `${params.outputPageName}.html`), params.html));
}

function createPlayPageConfig(mapData: string, cssName?: string, isClassicMode?: true): InputConfig {
    return {
        page: {
            additionalCssFiles: ["style.css"],
        },
        wwa: {
            gameOption: {
                isClassicMode,
                autoSave: {
                    intervalSteps: 200
                }
            },
            resources: {
                mapData,
                wwaJs: isDev ? "wwa.long.js" : "wwa.js",
                wwaCss: cssName,
                titleImage: "cover.gif",
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
