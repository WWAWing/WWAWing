import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";

const wwawingDistDirName = "wwawing-dist";
const wwawingUpdateDirName = "wwawing-update";

const srcBasePath = path.join(".", "node_modules", "@wwawing");
const destBasePath = path.join(".", "output", wwawingDistDirName);
const destUpdateBasePath = path.join(".", "output", wwawingUpdateDirName);

/**
 * fatal を設定しないとshelljsの cp などが例外を吐かない
 * @see https://github.com/shelljs/shelljs#configfatal
 */
shell.config.fatal = true;


Promise.all([
    // 完全版配布物を生成
    makeDistribution(false, true),
    // 更新版配布物を生成
    makeDistribution(true, true)
]).catch(e => {
    console.error(e);
    process.exit(1);
});

async function makeDistribution(
    isUpdate: boolean,
    isConvertLfToCrlf: boolean = false
): Promise<void> {
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
            copy("assets", path.join("style", "*.css"))
        ];
    } else {
        tasks = [
            copy("engine", path.join("LICENSE")),
            copy("assets", path.join("html", "manual.html")),
            copy("engine", path.join("lib", "wwa.js"), "mapdata"),
            copy("loader", path.join("lib", "wwaload.js"), "mapdata"),
            copy("assets", path.join("style", "*.css"), "mapdata"),
            copy("assets", path.join("wwamk310", "WinWwamk.exe")),
            copy("assets", path.join("wwamk310", "wwamk_manual.html")),
            copy("assets", path.join("audio", "*"), path.join("mapdata", "audio")),
            copy("assets", path.join("mapdata", "{caves01,caves02,island02,wwamap}.dat"), "mapdata"),
            copy("assets", path.join("images", "*.gif"), "mapdata"),
            copy("assets", path.join("images", "wwawing-disp.png"), "mapdata"),
            copy("assets", path.join("html", "dist", "*.html"), "mapdata"),
            copy("debug-server", path.join("bin", "wwa-server.exe"), "mapdata")
        ];
    }
    await Promise.all(tasks);
    if(isConvertLfToCrlf) {
        await convertLfToCrlfAll(isUpdate ? destUpdateBasePath : destBasePath)
    }
    console.log((isUpdate ? "update" : "full") + " version done.");

    async function copy(
        srcPackage: string,
        src: string,
        dest: string = ""
    ): Promise<void> {
        const srcFull = path.join(srcBasePath, srcPackage, src);
        const destFull = path.join(
            isUpdate ? destUpdateBasePath : destBasePath,
            dest
        );
        console.log("copy " + src + " to " + destFull);
        shell.cp(srcFull, destFull);
    }

    async function convertLfToCrlfAll(baseDir: string) {
        await Promise.all<{ target: string, content: string }>(
            shell
                .find(baseDir)
                .filter(target => {
                    const match = target.match(/\.(.+)$/);
                    return (
                        (!match && target.endsWith("LICENSE")) ||
                        (match &&
                            (match[1] === "html" ||
                                match[1] === "js" ||
                                match[1] === "css" ||
                                match[1] === "txt" ||
                                match[1] === "ini"
                            ))
                    );
                })
                .map(
                    target =>
                        new Promise((resolve, reject) => {
                            fs.readFile(target, (err, data) => {
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                    return;
                                }
                                resolve({
                                    target,
                                    content: convertLfToCrlf(data.toString("utf8"))
                                });
                            })
                        })
                )
        ).then(contents =>
            contents.map(
                prop =>
                    new Promise((resolve, reject) =>
                        fs.writeFile(prop.target, prop.content, err => {
                            if (err) {
                                console.error(err);
                                reject(err);
                                return;
                            }
                            resolve();
                        })
                    )
            )
        );

    }
    /**
     * 文字列中の改行コードをLF(\n)からCRLF(\r\n)に変換する。
     * 文字列中に1つでもCRLFがある場合は変換を行わない。
     * (ので、Windows環境などのため改行コードをCRLFにしてリポジトリをクローンしてきた場合でもCRLFが出力される)
     * Gitの改行コードの設定次第ではこのコードが動かなくなる可能性があるため、CI以外からの実行は推奨しない。
     * @param srcText 変換前の文字列
     * @returns 変換後の文字列
     */
    function convertLfToCrlf(srcText: string): string {
        return srcText.indexOf("\r\n") === -1 ? srcText.replace(/\n/g, "\r\n") : srcText;
    }
}
