import * as path from "path";
import * as shell from "shelljs";

const wwawingDistDirName = "wwawing-dist";
const wwawingUpdateDirName = "wwawing-update";

const srcBasePath = path.join(".", "node_modules", "@wwawing");
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
            copy("engine", path.join("LICENSE")),
            copy("assets", path.join("html", "manual.html")),
            copy("engine", path.join("lib", "wwa.js")),
            copy("loader", path.join("lib", "wwaload.js")),
            copy("assets", path.join("style", "*.css")),
        ];
    } else {
        tasks = [
            copy("engine", path.join("LICENSE")),
            copy("assets", path.join("html", "manual.html")),
            copy("engine", path.join("lib", "wwa.js"), "mapdata"),
            copy("loader", path.join("lib", "wwaload.js"), "mapdata"),
            copy("assets", path.join("style", "*.css"), "mapdata"),
            copy("assets", path.join("wwamk310", "WinWwamk.exe")),
            copy("assets", path.join("audio", "*"), path.join("mapdata", "audio")),
            copy("assets", path.join("mapdata", "*.dat"), "mapdata"),
            copy("assets", path.join("images", "*.gif"), "mapdata"),
            copy("assets", path.join("images", "wwawing-disp.png"), "mapdata"),
            copy("assets", path.join("html", "dist", "*.html"), "mapdata"),
            copy("debug-server", path.join("bin", "wwa-server.exe"), "mapdata")
        ];
    }
    await Promise.all(tasks);
    console.log((isUpdate ? "update" : "full") + " version done.");

    async function copy(srcPackage: string, src: string, dest: string = ""): Promise<void> {
        const srcFull = path.join(srcBasePath, srcPackage, src);
        const destFull = path.join(
            (isUpdate ? destUpdateBasePath : destBasePath),
            dest
        );
        console.log("copy " + src + " to " + destFull);
        shell.cp(srcFull, destFull);
    }
}
