import { render, InputConfig } from "@wwawing/page-generator";
import * as fs from "fs";
import * as pug from "pug";
import * as path from "path";
import maps from "./maps-config";

const isDev = process.argv.length >= 3 && process.argv[2] === "dev";

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
            html: render(createConfig(`${mapName}.dat`))
        }))
        .map(params => createWriteFilePromise(
            path.join(outputDirectory, `${params.mapName}.html`), params.html));
}

function createConfig(mapData: string): InputConfig {
    return {
        page: {
            additionalCssFiles: ["style.css"],
        },
        wwa: {
            resources: {
                mapData,
                wwaJs: isDev ? "wwa.long.js" : "wwa.js",
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
