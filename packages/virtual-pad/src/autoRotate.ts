/**
 * 自動回転制御の初期化を行うメソッドです。
 */
export function initializeRotate() {
    const headElement = document.getElementsByTagName('head')[0];
    let viewportElement = document.createElement('meta');

    viewportElement.setAttribute('name', 'viewport');
    headElement.appendChild(viewportElement);
    autoRotate();
}

/**
 * 回転の自動制御メソッドです。 "resize" イベントと併せてご利用ください。
 * @example window.addEventListener("resize", autoRotate);
 */
export default function autoRotate() {
    const WWA_WIDTH = 560;
    const WWA_HEIGHT = 440;

    const viewportElement = document.querySelector("meta[name='viewport']");
    const browserWidth = window.innerWidth;
    const browserHeight = window.innerHeight;
    /**
     * autoRotate を有効化すると、誤動作を防ぐため、拡大操作が無効になります。
     *     Webページの中に設置する場合は、特にご注意ください。
     */
    let viewportValue = "inital-scale=1.0,user-scalable=no";

    if (browserWidth > browserHeight) {
        const width = (browserWidth / browserHeight) * WWA_HEIGHT;
        viewportValue = `width=${width},${viewportValue}`;
    } else if (browserWidth <= browserHeight) {
        viewportValue = `width=${WWA_WIDTH},${viewportValue}`;
    }
    viewportElement.setAttribute("content", `${viewportValue}`);
}
