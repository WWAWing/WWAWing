/// <reference path="./wwa_main.ts" />

module wwa_util {
    export var $id = (id: string): HTMLElement => {
        return document.getElementById(id);
    };
    export var $class = (className: string): NodeList => {
        return document.getElementsByClassName(className);
    };
    export var $tag = (tagName: string): NodeList => {
        return document.getElementsByTagName(tagName);
    };
    export var $qs = (selector: string): Element => {
        return document.querySelector(selector);
    };
    export var $qsh = (selector: string): HTMLElement => {
        return <HTMLElement>document.querySelector(selector);
    };
    export var $qsAll = (selector: string): NodeList=> {
        return document.querySelectorAll(selector);
    };
    export var $localPos = (mouseX: number, mouseY: number): wwa_data.Coord => {
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

        return new wwa_data.Coord(cx,  cy);
    }


    // FIXME: この実装、大丈夫？
    export var $escapedURI = (uri: string): string => {
        if (uri.match(/^https?:\/\//) || uri.match(/^\.\.\//)) {
            return uri;
        } else {
            return location.href = "./" + uri;
        }
    }

    export var arr2str4save = ( x: any): string => {
        var txt = "";
        if( x instanceof Array ) {
            for (var i = 0; i < x.length; i++ ) {
                txt += (arr2str4save( x[ i  ] ) + "/");
            }
            return txt;
        } else {
            return x + "";
        }
    }
}