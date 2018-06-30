import { generateWWAPageFromMapdataName } from "@wwawing/html-generator";
import * as fs from "fs";
import * as path from "path";

// マップデータのファイル名から .dat を取り除いたもの
const mapNames = ["caves01", "caves02", "island02", "wwamap", "test"];


Promise.all(createHTMLFilePromises().concat(createHTMLFilePromises(true)))
    .then(() => console.log("done."))
    .catch(error => {
        console.error("error", error);
        process.exit(1);
    });

function createHTMLFilePromises(isDevMode = false): Promise<void>[] {
    return mapNames
        .map(mapName => ({
            mapName,
            html: generateWWAPageFromMapdataName(`${mapName}.dat`, isDevMode, true)
        }))
        .map(params => createWriteFilePromise(
            path.join(__dirname, "out", `${params.mapName}${isDevMode?"-dev":""}.html`), params.html));
}

function createWriteFilePromise(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) =>
        fs.writeFile(filePath, content, (err) => err ? reject(err) : resolve()));
}
