function wwa_auto_rotate() {
    const WWA_WIDTH = 560;
    const BUTTON_WIDTH = 100;

    let viewportElement = document.querySelector("meta[name='viewport']");
    let viewportWidth = "";

    if (window.screen.width > window.screen.height) {
        viewportWidth = WWA_WIDTH + (BUTTON_WIDTH * 4);
    } else if (window.screen.width <= window.screen.height) {
        viewportWidth = WWA_WIDTH;
    }
    viewportElement.setAttribute("content", `width=${viewportWidth},user-scalable=no`);
}

window.addEventListener("load", wwa_auto_rotate);
window.addEventListener("resize", wwa_auto_rotate);
