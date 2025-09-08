import { isPrimitive } from "@wwawing/util";
import { Coord, UserVar, UserVarMap } from "./wwa_data";

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
 * string 型の場合にダブルクォートでくくったものを返します。boolean, number型の場合はそのまま値を文字列化したものを返します。
 * trimming = true にした場合は 11コードポイント以上の文字列は10文字までに省略されます。
 * 無限再帰防止のため、深さ3以上は省略されます。
 */
export function formatUserVarForDisplay(value: UserVar, trimming?: boolean, depth = 0): string {
  if (depth >= 3) {
    return "...";
  } else if(typeof value === "number" || typeof value === "boolean" || value === undefined || value === null) {
    return String(value);
  } else if (typeof value === "string") {
    // 文字列かつ10文字以上の場合に省略表記にしたい
    // 基本的な絵文字はこれで文字数カウントできるが、Zero Width Joiner があるとうまく分割できない
    // しかし、それをうまくカウントしようとすると 正規表現をがんばるか、Intl.Segmenter などを使う必要が出てくる
    // Intl.Segmenter を使うのもよさそうだが、ロケールを ja で固定していいのかという問題と、Firefoxで使うのに Polyfill が
    // 必要になることなどをふまえ、ここではそこまで真面目に対応しない。
    const arrayValue = [...value];
    if (trimming && arrayValue.length > 10) {
        return `"${arrayValue.slice(0, 10).join("")}…`;
    }
    return `"${value}"`;
  } else if (Array.isArray(value)) {
    return `[${value.map((x) => formatUserVarForDisplay(x, true, depth + 1)).join(",")}]`;
  } else if (value instanceof Map) {
    const pairs = [...value];
    return `{${pairs.map(([key, value]) => `${key}:${formatUserVarForDisplay(value, true, depth + 1)}`).join(",")}}`
  } else {
    throw new TypeError("この値はフォーマットできません", value)
  }
}

export function getItem(x: unknown, key: unknown) {
  if (Array.isArray(x)) {
    if (typeof key !== "number") {
      throw new TypeError("配列に対して、数字以外をindexにできません");
    }
    if (key < 0 || key >= x.length) {
      console.warn(`配列のインデックス ${key} は範囲外です`);
      return undefined;
    }
    return x[key];
  } else if (x instanceof Map) {
    // JavaScript のオブジェクトに準拠し、文字列でないキーが与えられた場合は文字列にする
    if (!isPrimitive(key)) {
      throw new TypeError(
        "オブジェクトのキーはプリミティブ値でなければなりません。: " + key
      );
    }
    return x.get(String(key));
  } else if (typeof x === "string") {
    if (typeof key !== "number") {
      throw new TypeError(`文字列 "${x}" に対して、数字以外をindexにできません`);
    }
    if (key < 0 || key >= x.length) {
      console.warn(`文字列 "${x}" のインデックス ${key} は範囲外です`);
      return undefined;
    }
    return x[key]; // 文字列中の文字を取得する場合
  } else if (isPrimitive(x)) {
    throw new TypeError(`プリミティブ値 ${String(x)} は添字参照できません`);
  } else {
    throw new TypeError(String(x) + "は添字参照できません");
  }
}
export function setItem(
  x: unknown,
  key: unknown,
  value: UserVar
) {
  if (Array.isArray(x)) {
    if (typeof key !== "number") {
      throw new TypeError("数字以外をindexにできません");
    }
    x[key] = value;
  } else if (x instanceof Map) {
    // JavaScript のオブジェクトに準拠し、文字列でないキーが与えられた場合は文字列にする
    if (!isPrimitive(key)) {
      throw new TypeError(
        "オブジェクトのキーはプリミティブ値でなければなりません。: " + key
      );
    }
    x.set(String(key), value);
  } else if (typeof x === "string") {
    throw new TypeError(`文字列 "${x}" の特定の文字を直接書き換えることはできません`);
  } else if (isPrimitive(x)) {
    throw new TypeError(`プリミティブ値 ${String(x)} は添字参照できません`);
  } else {
    throw new TypeError(String(x) + "は添字参照できません");
  }
}


export const assignmentBlockProperties = [
    "__proto__",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
    "constructor",
    "prototype"
];
