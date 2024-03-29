/**
 * ビューポート制御の初期化を行うメソッドです。
 */
export function initializeViewport() {
    const headElement = document.getElementsByTagName('head')[0];
    let viewportElement = document.createElement('meta');

    viewportElement.setAttribute('name', 'viewport');
    headElement.appendChild(viewportElement);
    viewportFit();
}

/**
 * 画面の向きやサイズに合わせて自動的に画面のビューポートを調整する機能のメソッドです。 "resize" イベントと併せてご利用ください。
 * @example window.addEventListener("resize", viewportFit);
 */
export default function viewportFit() {
    const WWA_WIDTH = 560;
    const WWA_HEIGHT = 440;
    // ブラウザーCSSをここから取得することはできないようなのでここで仮の値を設定しておく
    const BROWSER_MARGIN = 8;

    const viewportElement = document.querySelector("meta[name='viewport']");
    const browserWidth = window.innerWidth;
    const browserHeight = window.innerHeight;
    /**
     * viewportFit を有効化すると、誤動作を防ぐため、拡大操作が無効になります。
     *     Webページの中に設置する場合は、特にご注意ください。
     */
    let viewportValue = "user-scalable=no";

    if (browserWidth > browserHeight) {
        const width = Math.floor((browserWidth / browserHeight) * (WWA_HEIGHT + (BROWSER_MARGIN) * 2));
        viewportValue = `width=${width},${viewportValue}`;
    } else if (browserWidth <= browserHeight) {
        viewportValue = `width=${WWA_WIDTH + (BROWSER_MARGIN * 2)},${viewportValue}`;
    }
    viewportElement?.setAttribute("content", `${viewportValue}`);
}
