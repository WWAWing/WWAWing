import * as pug from "pug";
import * as path from "path";

const pugFile = path.join(__dirname, "..", "template", "wwa.pug");

const fn = pug.compileFile(pugFile, {
    pretty: true
});

console.log(fn());
