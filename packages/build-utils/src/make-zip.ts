import * as JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

const baseDir = "./output";

makeZip("wwawing-dist");
makeZip("wwawing-update");

function makeZip(target: string): void {
    const zip = new JSZip();
    glob(`${target}/**/*.*`, {cwd: baseDir}, (_error, matches) => {
        Promise.all(matches.map(itemPath => new Promise((resolve, reject) => {
            const itemPathFs = path.normalize(itemPath);
            const itemPathFsWithBase = path.join(baseDir, itemPathFs);
            fs.readFile(itemPathFsWithBase, (err, itemData) => {
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
                const dest = path.join(baseDir, `${target}.zip`);
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
