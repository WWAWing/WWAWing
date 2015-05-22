/// <reference path="./wwa_util.ts" />
/// <reference path="./wwa_main.ts" />

// FIXME: innerHTML使う実装、あんまりよくないけど、許して。
// 入力値を扱う時はセキュリティに気をつける!!
module wwa_inject_html {
    var inject_html = "            <canvas id=\"wwa-map\" class=\"wwa-canvas\" width=\"440\" height=\"440\">                このブラウザは、Canvas要素をサポートしていません。            </canvas>            <canvas id=\"wwa-map-sub\" class=\"wwa-canvas\" width=\"440\" height=\"440\"></canvas>            <div id=\"wwa-sidebar\">                <div class=\"wide-cell-row\" id=\"disp-energy\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"wide-cell-row\" id=\"disp-strength\"><div class=\"status-icon\"></div><div class=\"status-value-box\"> 0 </div></div>                <div class=\"wide-cell-row\" id=\"disp-defence\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"wide-cell-row\" id=\"disp-gold\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"item-cell\" id=\"item0\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item1\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item2\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item3\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item4\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item5\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item6\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item7\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item8\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item9\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item10\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item11\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"wide-cell-row\" id=\"cell-load\">Password</div><div class=\"wide-button\" id=\"button-load\"></div>                <div class=\"wide-cell-row\" id=\"cell-save\">Quick Save</div><div class=\"wide-button\" id=\"button-save\"></div>                <div class=\"wide-cell-row\" id=\"cell-restart\">Restart Game</div><div class=\"wide-button\" id=\"button-restart\"></div>                <div class=\"wide-cell-row\" id=\"cell-gotowwa\">Go to WWA</div><div class=\"wide-button\" id=\"button-gotowwa\"></div>            </div>            <div id=\"wwa-controller\"></div>            <div id=\"wwa-fader\"></div>            <div id=\"wwa-cover\">                 <div id=\"version\"></div>                 <div id=\"progress-message-container\">開始しています...</div>                 <div id=\"progress-bar-bg\"></div>                 <div id=\"progress-bar\" class=\"progress-bar\"></div>                 <div id=\"progress-bar-audio\" class=\"progress-bar\"></div>                 <div id=\"progress-disp\">---</div>            </div>            <div id=\"wwa-audio-wrapper\"></div>    ";
    /*
    var inject_html = "\
            <canvas id=\"wwa-map\" class=\"wwa-canvas\" width=\"440\" height=\"440\">\
                このブラウザは、Canvas要素をサポートしていません。\
            </canvas>\
            <canvas id=\"wwa-map-sub\" class=\"wwa-canvas\" width=\"440\" height=\"440\"></canvas>\
            <div id=\"wwa-sidebar\">\
                <div class=\"wide-cell-row\" id=\"disp-energy\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>\
                <div class=\"wide-cell-row\" id=\"disp-strength\"><div class=\"status-icon\"></div><div class=\"status-value-box\"> 0 </div></div>\
                <div class=\"wide-cell-row\" id=\"disp-defence\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>\
                <div class=\"wide-cell-row\" id=\"disp-gold\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>\
                <div class=\"item-cell\" id=\"item0\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item1\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item2\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item3\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item4\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item5\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item6\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item7\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item8\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item9\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item10\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item11\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"wide-cell-row\" id=\"cell-load\">Password</div><div class=\"wide-button\" id=\"button-load\"></div>\
                <div class=\"wide-cell-row\" id=\"cell-save\">Quick Save</div><div class=\"wide-button\" id=\"button-save\"></div>\
                <div class=\"wide-cell-row\" id=\"cell-restart\">Restart Game</div><div class=\"wide-button\" id=\"button-restart\"></div>\
                <div class=\"wide-cell-row\" id=\"cell-gotowwa\">Go to WWA</div><div class=\"wide-button\" id=\"button-gotowwa\"></div>\
            </div>\
            <div id=\"wwa-controller\"></div>\
            <div id=\"wwa-fader\"></div>\
            <div id=\"wwa-cover\">\
                 <div id=\"version\"></div>\
                 <div id=\"progress-message-container\">開始しています...</div>\
                 <div id=\"progress-bar-bg\"></div>\
                 <div id=\"progress-bar\" class=\"progress-bar\"></div>\
                 <div id=\"progress-bar-audio\" class=\"progress-bar\"></div>\
                 <div id=\"progress-disp\">---</div>\
            </div>\
            <div id=\"wwa-audio-wrapper\"></div>\"\
    ";
    */
    export function inject(parent: HTMLDivElement, titleImgName: string): void {
        var style = document.createElement("style");
        style.type = "text/css";
        style.setAttribute("id", wwa_data.WWAConsts.WWA_STYLE_TAG_ID);
        wwa_util.$tag("head")[0].appendChild(style);
        parent.innerHTML = inject_html;

        var img = document.createElement("img");
        img.src = titleImgName;
        wwa_util.$id("wwa-cover").appendChild(img);
    }
}