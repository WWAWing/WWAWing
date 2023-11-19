import { Coord } from "./wwa_data";

export var $id = (id: string): HTMLElement => {
    return document.getElementById(id);
};
export var $class = (className: string) => {
    return document.getElementsByClassName(className);
};
export var $tag = (tagName: string) => {
    return document.getElementsByTagName(tagName);
};
export var $qs = (selector: string): Element => {
    return document.querySelector(selector);
};
export var $qsh = (selector: string): HTMLElement => {
    return <HTMLElement>document.querySelector(selector);
};
export var $qsAll = (selector: string): NodeList => {
    return document.querySelectorAll(selector);
};
export var $localPos = (mouseX: number, mouseY: number): Coord => {
    var cx: number, cy: number;
    var sx =
        window.pageXOffset ||
        document.body.scrollLeft ||
        document.documentElement.scrollLeft;
    var sy =
        window.pageYOffset ||
        document.body.scrollTop ||
        document.documentElement.scrollTop;

    cx = mouseX - $id("wwa-wrapper").offsetLeft + sx;
    cy = mouseY - $id("wwa-wrapper").offsetTop + sy;

    return new Coord(cx, cy);
};

// FIXME: この実装、大丈夫？
export var $escapedURI = (uri: string): string => {
    if (uri.match(/^https?:\/\//) || uri.match(/^\.\.\//)) {
        return uri;
    } else {
        return (location.href = "./" + uri);
    }
};

export var arr2str4save = (x: any): string => {
    var txt = "";
    if (x instanceof Array) {
        for (var i = 0; i < x.length; i++) {
            txt += arr2str4save(x[i]) + "/";
        }
        return txt;
    } else {
        return x + "";
    }
}

// 文字列を逆転
export const reverse = (str: string) => str.split("").reverse().join("");


export function assertNumber(value: unknown, varName: string): value is number {
    if (typeof value !== "number") {
        throw new TypeError(`${varName} が数値ではありません。`);
    }
    return true;
}

export function assertString(value: unknown, varName: string): value is string {
    if (typeof value !== "string") {
        throw new TypeError(`${varName} が文字列ではありません。`);
    }
    return true;
}

/**
 * ユーザ変数などで使われる値をデバッグ系ツールに出力するためのフォーマット関数
 * string 型の場合にダブルクォートでくくったものを返します。それ以外の場合はそのまま値を文字列化したものを返します。
 */
export function formatUserVarForDisplay(value: number | string | boolean): string {
  if (typeof value === "string") {
    // 文字列かつ10文字以上の場合に省略表記にしたい
    // しかしサロゲートペアを考慮してスプレッド記法を使おうとするとtsconfigのtargetを上げる必要があるため2023-11-19時点では断念。
    // target を上げても問題ないとは思うが、ブラウザの対応状況を慎重に見極めたい。
    /*
    const arrayValue = [...value];
    if (arrayValue.length > 10) {
      return `"${arrayValue.slice(0, 10).join("")}...`;
    }
    */
    return `"${value}"`;
  }
  return String(value);
}


