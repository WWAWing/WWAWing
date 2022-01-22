import * as sass from "sass";
import * as path from "path";
import * as fs from "fs";

const extendThemeNames = ["classic"];
const SOURCE_DIRECTORY_NAME = "src";
const OUTPUT_DIRECTORY_NAME = "output";
const SOURCE_CORE_DIRECTORY_NAME = "core";
const SOURCE_EXTENDS_DIRECOTRY_NAME = "extends";
const INDEX_FILE_NAME = "index";

const basePromise = createWWABaseCSSFilePromise();
const extendPromises = createWWAExtendCSSFilePromises();

Promise.all([basePromise].concat(extendPromises))
    .catch(error => {
        console.error("error", error);
        process.exit(1);
    });

function createWWABaseCSSFilePromise(): Promise<void> {
    return createWWACSSFilePromise(
        path.join(__dirname, "..", SOURCE_DIRECTORY_NAME, SOURCE_CORE_DIRECTORY_NAME, `${INDEX_FILE_NAME}.scss`),
        path.join(__dirname, "..", OUTPUT_DIRECTORY_NAME, "wwa.css")
    );
}

function createWWAExtendCSSFilePromises(): Promise<void>[] {
    return extendThemeNames
        .map(extendThemeName => createWWACSSFilePromise(
            path.join(__dirname, "..", SOURCE_DIRECTORY_NAME, SOURCE_EXTENDS_DIRECOTRY_NAME, extendThemeName, `${INDEX_FILE_NAME}.scss`),
            path.join(__dirname, "..", OUTPUT_DIRECTORY_NAME, `wwa_${extendThemeName}.css`)
        ));
}

function createWWACSSFilePromise(filePath: string, outputFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => 
        // TODO: render は非推奨なので compile に乗り換える
        sass.render({
            file: filePath,
            outFile: outputFilePath,
            linefeed: "lf",
            indentWidth: 4,
            outputStyle: "expanded"
        }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                fs.writeFile(
                    outputFilePath,
                    result.css,
                    err => (err ? reject(err) : resolve())
                );
            }
        })
    );
}
