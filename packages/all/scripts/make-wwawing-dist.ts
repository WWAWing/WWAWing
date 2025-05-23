import * as fs from "fs";
import * as path from "path";
import * as shell from "shelljs";
import { render, InputConfig } from "@wwawing/page-generator";

const wwawingDistDirName = "wwawing-dist";
const wwawingUpdateDirName = "wwawing-update";

const srcBasePath = path.join("..", "..", "node_modules", "@wwawing");
const destBasePath = path.join(".", "dist", wwawingDistDirName);
const destUpdateBasePath = path.join(".", "dist", wwawingUpdateDirName);

/**
 * fatal を設定しないとshelljsの cp などが例外を吐かない
 * @see https://github.com/shelljs/shelljs#configfatal
 */
shell.config.fatal = true;

export default async function makeDistribution(
    isUpdate: boolean,
    isConvertLfToCrlf: boolean = false
): Promise<void> {
    shell.mkdir("-p", isUpdate ? destUpdateBasePath : destBasePath);
    if (!isUpdate) {
        shell.mkdir("-p", path.join(destBasePath, "mapdata"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "audio"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "script"));
        shell.mkdir("-p", path.join(destBasePath, "mapdata", "backup"));
    }
    let tasks = [];

    if (isUpdate) {
        tasks = [
            copy("engine", path.join("LICENSE")),
            copy("assets", path.join("html", "manual.html")),
            copy("engine", path.join("lib", "wwa.js")),
            copy("assets", path.join("style", "*.css")),
            copy("styles", path.join("output", "*.css"))
        ];
    } else {
        tasks = [
            ...createHTMLFilePromises(["caves01", "caves02", "island02", "wwamap"]),
            copy("engine", path.join("LICENSE")),
            copy("assets", path.join("html", "manual.html")),
            copy("assets", path.join("text", "*.txt")),
            copy("engine", path.join("lib", "wwa.js"), "mapdata"),
            copy("assets", path.join("style", "*.css"), "mapdata"),
            copy("assets", path.join("wwamk310", "WinWwamk.exe")),
            copy("assets", path.join("wwamk310", "wwamk_manual.html")),
            copy("assets", path.join("audio", "*"), path.join("mapdata", "audio")),
            copy("assets", path.join("mapdata", "{caves01,caves02,island02,wwamap}.dat"), "mapdata"),
            copy("assets", path.join("images", "*.gif"), "mapdata"),
            copy("assets", path.join("images", "wwawing-disp.png"), "mapdata"),
            copy("debug-server", path.join("bin", "wwa-server.exe"), "mapdata"),
            copy("debug-server", path.join("bin", "LICENSE"), "mapdata"),
            copy("styles", path.join("output", "*.css"), "mapdata"),
            copy("assets", path.join("vars", "*.json"), "mapdata"),
            copy("assets", path.join("script", "script_file_list.json"), path.join("mapdata", "script")),
            copy("assets", path.join("script", "*.js"), path.join("mapdata", "script")),
        ];
    }
    await Promise.all(tasks);
    if (isConvertLfToCrlf) {
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
                                    content: target.endsWith("wwa.js") ?
                                        // wwa.js は minify されているため、バイト数を少しでも減らすため改行コードLFを維持する
                                        data.toString("utf8"):
                                        // それ以外のファイルは Windows のメモ帳(の古い版)で開かれることを想定し改行コードをCRLFとする
                                        convertLfToCrlf(data.toString("utf8"))
                                });
                            })
                        })
                )
        ).then(contents =>
            contents.map(
                prop =>
                    new Promise<void>((resolve, reject) =>
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

    function createHTMLFilePromises(mapNames: string[]): Promise<void>[] {
        return mapNames
            .map(mapName => ({
                mapName,
                html: render(createConfig(mapName))
            }))
            .map(params => createWriteFilePromise(
                path.join(__dirname, "..", "dist", "wwawing-dist", "mapdata", `${params.mapName}.html`),
                params.html
            ));
    }

    function createConfig(mapDataName: string): InputConfig {
        const canIncludeUserVarOptions = (mapDataName === "wwamap");
        return {
            page: {
                additionalCssFiles: ["style.css"]
            },
            wwa: {
                gameOption: {
                    autoSave: {
                        intervalSteps: 200,
                    },
                    virtualPad: {
                        enable: false,
                    },
                    debugConsole: {
                        
                    },
                    ...(canIncludeUserVarOptions ? {
                        userVars: {
                            dumpElementId: "vardump",
                            canDisplay: true
                        },
                    } : {})
                },
                resources: {
                    mapData: `${mapDataName}.dat`,
                    wwaJs: "wwa.js",
                    titleImage: "cover.gif",
                    ...(canIncludeUserVarOptions ? {
                        userVarNamesFile: `${mapDataName}-vars.json`
                    } : {})
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
