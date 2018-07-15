/*
 * assumed call by npm scripts. 
 */

const path = require("path");
const shell = require("shelljs");

const wwawingDistDirName = "wwawing-dist";
const wwawingUpdateDirName = "wwawing-update";

// fs.mkdir 用 パス区切りが / でない環境も考慮する
const srcBasePath = path.join("..");
const destBasePath = path.join(".", wwawingDistDirName);
const destUpdateBasePath = path.join(".", wwawingUpdateDirName);

// fatal を設定しないとshelljsの cp などが例外を吐かない
// @see https://github.com/shelljs/shelljs#configfatal
shell.config.fatal = true;

Promise.all([
    // 完全版配布物を生成
    makeDistribution(false),
    // 更新版配布物を生成
    makeDistribution(true)
]).catch(e => {
    console.error(e);
    process.exit(1);
})

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
                copy(path.join("engine", "LICENSE")),
                copy("manual.html"),
                copy(path.join("engine", "lib", "wwa.js"), "wwa.js"),
                copy(path.join("assets", "scripts", "wwaload.js")),
                copy(path.join("assets", "style", "*.css"))
            ];
        } else {
            tasks = [
                // debugger は廃止のためコピーなし
                copy(path.join("engine","LICENSE")),
                copy("manual.html"),
                copy(path.join("engine", "lib", "wwa.js"), "mapdata"),
                copy(path.join("assets", "scripts", "wwaload.js"), "mapdata"), // npm 移行後変更予定
                copy(path.join("assets", "style", "*.css"), "mapdata"),
                copy(path.join("assets", "wwamk310", "WinWwamk.exe")),
                copy(path.join("assets", "audio", "*"), path.join("mapdata", "audio")),
                copy(path.join("assets", "mapdata", "*.dat"), "mapdata"),
                copy(path.join("assets", "images", "*.gif"), "mapdata"),
                copy(path.join("assets", "images", "wwawing-disp.png"), "mapdata"),
                copy(path.join("assets", "html", "dist", "*.html"), "mapdata")
            ];
        }
        Promise.all(tasks)
            .then(() => {
                console.log((isUpdate ? "update" : "full") + " version done.");
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
    });

    function copy(src, dest) {
        return new Promise((resolve, reject) => {
            const srcFull = path.join(srcBasePath, src);
            const destFull = path.join(
                (isUpdate ? destUpdateBasePath : destBasePath),
                (dest ? dest : "")
            );
            console.log("copy " + src + " to " + destFull);
            try {
                shell.cp(srcFull, destFull);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }
}
