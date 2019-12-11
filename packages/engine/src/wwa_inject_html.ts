import { WWAConsts } from "./wwa_data";
import * as util from "./wwa_util";
import { makeInject as makeInjectVirtualPad } from "@wwawing/virtual-pad";

// FIXME: innerHTML使う実装、あんまりよくないけど、許して。
// 入力値を扱う時はセキュリティに気をつける!!
function makeInjectHtml(hasTitleImg: boolean): string {
    const coverHtml = hasTitleImg ? `
        <div id="wwa-cover">
            <div id="version"></div>
            <div id="progress-message-container">開始しています...</div>
            <div id="progress-bar-bg"></div>
            <div id="progress-bar" class="progress-bar"></div>
            <div id="progress-bar-audio" class="progress-bar"></div>
            <div id="progress-disp">---</div>
        </div>
    ` : `
        <div id="wwa-cover">
            <canvas id="progress-panel" width="${WWAConsts.SCREEN_WIDTH}" height="${WWAConsts.SCREEN_HEIGHT}"></canvas>
        </div>`;

    const virtualPadHtml = checkTouchDevice() ? makeInjectVirtualPad() : "";

    return `
        <canvas id="wwa-map" class="wwa-canvas" width="440" height="440">
            このブラウザは、Canvas要素をサポートしていません。
        </canvas>
        <canvas id="wwa-map-sub" class="wwa-canvas" width="440" height="440"></canvas>
        <div id="wwa-sidebar">
            <div class="wide-cell-row" id="disp-energy"><div class="status-icon"></div><div class="status-value-box">0</div></div>
            <div class="wide-cell-row" id="disp-strength"><div class="status-icon"></div><div class="status-value-box"> 0 </div></div>
            <div class="wide-cell-row" id="disp-defence"><div class="status-icon"></div><div class="status-value-box">0</div></div>
            <div class="wide-cell-row" id="disp-gold"><div class="status-icon"></div><div class="status-value-box">0</div></div>
            <div class="item-cell" id="item0"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item1"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item2"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item3"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item4"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item5"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item6"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item7"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item8"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item9"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item10"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="item-cell" id="item11"><div class="item-click-border"></div><div class="item-disp"></div></div>
            <div class="wide-cell-row" id="cell-load">Password</div><div class="wide-button" id="button-load"></div>
            <div class="wide-cell-row" id="cell-save">Quick Save</div><div class="wide-button" id="button-save"></div>
            <div class="wide-cell-row" id="cell-restart">Restart Game</div><div class="wide-button" id="button-restart"></div>
            <div class="wide-cell-row" id="cell-gotowwa">Goto WWA</div><div class="wide-button" id="button-gotowwa"></div>
        </div>
        <div id="wwa-controller"></div>
        <div id="wwa-fader"></div>
${coverHtml}
        <div id="wwa-audio-wrapper"></div>
${virtualPadHtml}
`;
}

/**
 * タッチできるデバイスかどうかを判別します。
 * @returns {boolean}
 */
export function checkTouchDevice(): boolean {
    return ("ontouchstart" in window) && ("ontouchend" in window) && ("ontouchmove" in window);
}

export function inject(parent: HTMLDivElement, titleImgName: string): void {
    var style = document.createElement("style");
    style.type = "text/css";
    style.setAttribute("id", WWAConsts.WWA_STYLE_TAG_ID);
    util.$tag("head")[0].appendChild(style);

    parent.innerHTML = makeInjectHtml(titleImgName !== null);
    if (titleImgName !== null) {
        util.$id("wwa-cover").style.backgroundImage = `url(${titleImgName})`;
        util.$id("wwa-cover").style.backgroundRepeat = "no-repeat";
        util.$id("wwa-cover").style.backgroundPosition = "0 0";
    }
}
