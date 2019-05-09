import { Coord } from "./wwa_data";
import { UAParser } from "ua-parser-js";

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

export function getEnvironment() {
  const ua: string = window.navigator.userAgent;
  const env = { os: "", browser: new UAParser(ua).getBrowser().name };
  // TODO(@matsuyuki-a): OS判定もUAParserに任せるようにする
  env.os = ua.match(/windows/i) ? "Windows" : "";
  env.os = env.os || (ua.match(/macintosh/i) ? "Macintosh" : "");
  env.os = env.os || (ua.match(/iphone|ipad|ipod/i) ? "iOS" : "");
  env.os = env.os || (ua.match(/oculus/i) ? "Oculus" : "");
  env.os = env.os || (ua.match(/android/i) ? "Android" : "");
  env.os = env.os || (ua.match(/nintendo/i) ? "Nintendo" : "");
  env.os = env.os || (ua.match(/playstation/i) ? "PlayStation" : "");
  env.os = env.os || (ua.match(/linux/i) ? "Linux" : "");
  return env;
}
