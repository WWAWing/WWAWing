import { generateWWAPageFromConfig, WWAPageConfig, getDefaultCopyrights } from "@wwawing/html-generator";
import * as fs from "fs";
import * as pug from "pug";
import * as path from "path";
import maps from "./maps-config";

interface IndexPageOption {
    page: {
        maps: {
            fileName: string;
            title: string;
        }[];
        thisYear: number;
    }
}

const indexPageTemplageFile = path.join(__dirname, "index.pug");
const compileIndexPage = pug.compileFile(indexPageTemplageFile, { pretty: true });
const outputDirectory = path.join(__dirname, "..", "lib");

Promise.all([
    ...createHTMLFilePromises(maps.map(map => map.fileName)),
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

function createHTMLFilePromises(mapNames: string[]): Promise<void>[] {
    return mapNames
        .map(mapName => ({
            mapName,
            html: generateWWAPageFromConfig(createConfig(`${mapName}.dat`))
        }))
        .map(params => createWriteFilePromise(
            path.join(outputDirectory, `${params.mapName}.html`), params.html));
}

function createConfig(mapdata: string): WWAPageConfig {
    return {
        page: {
            additionalCssFiles: ["style.css"],
            wwa: {
                resources: {
                    mapdata,
                    wwaJs: "wwa.long.js",
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
