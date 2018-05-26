/*
 * assumed call by npm scripts. 
 */

const fs = require("fs");
const path = require("path");
const Promise = require("es6-promise");
const shell = require("shelljs");

const wwawingDistDirName = "wwawing-dist";
const wwawingUpdateDirName = "wwawing-update";

// fs.mkdir 用 パス区切りが / でない環境も考慮する
const destBasePath = path.join(".", wwawingDistDirName);
const destUpdateBasePath = path.join(".", wwawingUpdateDirName);

// 完全版配布物を生成
makeDistribution(false);

// 更新版配布物を生成
makeDistribution(true);

function makeDistribution(isUpdate) {
    shell.mkdir("-p", isUpdate ? destUpdateBasePath : destBasePath);
    if (!isUpdate) {
        shell.mkdir("-p", path.join(destBasePath, "mapdata"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "audio"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "backup"));
    }
    return new Promise((resolve, reject) => {
        let tasks = [];

        if (isUpdate) {
            tasks = [
                copy("LICENSE"),
                copy("manual.html"),
                copy("wwa.js"),
                copy("wwaload.js"),
                copy("*.css"),
            ];
        } else {
            tasks = [
                // debugger は廃止のためコピーなし
                copy("LICENSE"),
                copy("manual.html"),
                copy("./lib/wwa.js", "mapdata"),
                copy("wwaload.js", "mapdata"), // npm 移行後変更予定
                copy("*.css", "mapdata"),
                copy("wwamk310/WinWwamk.exe"),
                copy("wwawing-disp.png", "mapdata"),
                copy("audio/*.*", "mapdata/audio"),
                copy("*.dat", "mapdata"),
                copy("*.gif", "mapdata"),
                copy("dist_html/*.html", "mapdata"),
            ];
        }
        Promise.all(tasks)
            .then(() => {
                console.log((isUpdate ? "update" : "full") + " version done.");
                resolve();
            })
            .catch((error) => {
                console.error("error", error);
                reject(error);
            });
    });

    function copy(src, dest) {
        return new Promise((resolve, reject) => {
            const destFull = path.join(
                (isUpdate ? destUpdateBasePath : destBasePath),
                (dest ? dest : "")
            );
            console.log("copy " + src + " to " + destFull);
            try {
                shell.cp(src, destFull);
                resolve();
            } catch(e) {
                reject(e);
            }
       });
    }

    function mkdir(dest) {
        return new Promise((resolve, reject) => {
            const destFull = path.join(
                (isUpdate ? destUpdateBasePath : destBasePath),
                dest
            );

            if (fs.existsSync(destFull)) {
                resolve();
            } else {
                fs.mkdir(destFull, function (error) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            }
        });
    }
}
