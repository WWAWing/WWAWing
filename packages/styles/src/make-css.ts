import * as sass from "node-sass";

export function generateWWACSSFile() {
    sass.render({
        file: "core/core.scss"
    }, function (err, result) {
        // TODO: 作る
    });
}
