import * as path from "path";
import * as shell from "shelljs";

const wwawingDistDirName = "wwawing-dist";
const wwawingUpdateDirName = "wwawing-update";

// fs.mkdir 用 パス区切りが / でない環境も考慮する
const srcBasePath = path.join("..");
const destBasePath = path.join(".", "output", wwawingDistDirName);
const destUpdateBasePath = path.join(".", "output", wwawingUpdateDirName);

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

async function makeDistribution(isUpdate: boolean): Promise<void> {
    shell.mkdir("-p", isUpdate ? destUpdateBasePath : destBasePath);
    if (!isUpdate) {
        shell.mkdir("-p", path.join(destBasePath, "mapdata"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "audio"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "backup"));
    }
    let tasks = [];

    if (isUpdate) {
        tasks = [
            copy(path.join("engine", "LICENSE")),
            copy(path.join("assets", "html", "manual.html")),
            copy(path.join("engine", "lib", "wwa.js")),
            copy(path.join("loader", "lib", "wwaload.js")),
            copy(path.join("assets", "style", "*.css")),
        ];
    } else {
        tasks = [
            // debugger は廃止のためコピーなし
            copy(path.join("engine", "LICENSE")),
            copy(path.join("assets", "html", "manual.html")),
            copy(path.join("engine", "lib", "wwa.js"), "mapdata"),
            copy(path.join("loader", "lib", "wwaload.js"), "mapdata"),
            copy(path.join("assets", "style", "*.css"), "mapdata"),
            copy(path.join("assets", "wwamk310", "WinWwamk.exe")),
            copy(path.join("assets", "audio", "*"), path.join("mapdata", "audio")),
            copy(path.join("assets", "mapdata", "*.dat"), "mapdata"),
            copy(path.join("assets", "images", "*.gif"), "mapdata"),
            copy(path.join("assets", "images", "wwawing-disp.png"), "mapdata"),
            copy(path.join("assets", "html", "dist", "*.html"), "mapdata"),
            copy(path.join("debug-server", "bin", "wwa-server.exe"), "mapdata")
        ];
    }
    await Promise.all(tasks);
    console.log((isUpdate ? "update" : "full") + " version done.");

    async function copy(src: string, dest: string = ""): Promise<void> {
        const srcFull = path.join(srcBasePath, src);
        const destFull = path.join(
            (isUpdate ? destUpdateBasePath : destBasePath),
            dest
        );
        console.log("copy " + src + " to " + destFull);
        shell.cp(srcFull, destFull);
    }
}
