import * as JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

const baseDir = ".";

makeZip("wwawing-dist");
makeZip("wwawing-update");

function joinPathArray(prev: string, cur: string): string {
    return path.join(prev, cur);
}

function makeZip(target: string): void {
    const zip = new JSZip();
    glob(baseDir + "/" + target + "/**/*.*", (_error, matches) => {
        Promise.all(matches.map(itemPath => new Promise((resolve, reject) => {
            // Windows のエクスプローラでもzipが開けるように
            // globから出てくるパスセパレータ( / )を
            // 動作環境におけるパスセパレータに変換する.
            const itemPathArray = itemPath.split("/");
            const itemPathFs = itemPathArray.reduce(joinPathArray, "");

            fs.readFile(itemPathFs, (err, itemData) => {
                console.log(`including ${itemPath}`);
                if (err) {
                    reject(err);
                    return;
                }
                zip.file(itemPathFs, itemData);
                resolve();
            });
        })))
            .then(() => new Promise((resolve, reject) => {
                const dest = `${target}.zip`;
                zip
                    .generateAsync({ type: "nodebuffer" })
                    .then(content => {
                        fs.writeFile(dest, content, err => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(dest);
                        });
                    })
                    .catch(err => reject(err));
            }))
            .then(dest => console.log(`${dest} was written.`))
            .catch(e => console.error(e));
    });
}
