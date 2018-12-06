function wwa_auto_rotate() {
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
    viewportElement.setAttribute("content", `${viewportValue}, viewport-fit=cover`);
}

function wwa_create_viewport() {
    const headElement = document.getElementsByTagName('head')[0];
    let viewportElement = document.createElement('meta');

    viewportElement.setAttribute('name', 'viewport');
    headElement.appendChild(viewportElement);
    wwa_auto_rotate();
}

window.addEventListener("load", wwa_create_viewport);
window.addEventListener("resize", wwa_auto_rotate);
