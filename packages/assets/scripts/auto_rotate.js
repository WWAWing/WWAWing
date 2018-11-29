function wwa_auto_rotate() {
    const WWA_WIDTH = 560;

    let viewportElement = document.querySelector("meta[name='viewport']");
    let viewportValue = "";

    // TODO: 下記の仕様だと、Firefox for Android では回転した際にレイアウトが崩れる。
    if (window.screen.width > window.screen.height) {
        viewportValue = `height=${WWA_WIDTH}`;
    } else if (window.screen.width <= window.screen.height) {
        viewportValue = `width=${WWA_WIDTH}`;
    }
    viewportElement.setAttribute("content", `${viewportValue},user-scalable=no`);
}

window.addEventListener("load", wwa_auto_rotate);
window.addEventListener("orientationchange", wwa_auto_rotate);
