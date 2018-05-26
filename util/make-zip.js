/*
 * assumed call by npm scripts. 
 */

const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const Promise = require("es6-promise");
const baseDir = ".";

makeZip("wwawing-dist");
makeZip("wwawing-update");

function joinPathArray(prev, cur) {
    return path.join(prev, cur);
}

function makeZip(target) {
    const zip = new JSZip();
    glob(baseDir + "/" + target + "/**/*.*", (error, matches) => {
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
