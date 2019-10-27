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
    let viewportValue = "";

    if (browserWidth > browserHeight) {
        const width = (browserWidth / browserHeight) * WWA_HEIGHT;
        viewportValue = `width=${width}`;
    } else if (browserWidth <= browserHeight) {
        viewportValue = `width=${WWA_WIDTH}`;
    }
    viewportElement.setAttribute("content", `${viewportValue}`);
}
