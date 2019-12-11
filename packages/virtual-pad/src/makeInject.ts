export default function makeInject() {
  return `
    <div id="wwa-virtualpad-left">
      <button class="wwa-virtualpad__button" id="wwa-up-button">△</button>
      <button class="wwa-virtualpad__button" id="wwa-left-button">◁</button>
      <button class="wwa-virtualpad__button" id="wwa-right-button">▷</button>
      <button class="wwa-virtualpad__button" id="wwa-down-button">▽</button>
    </div>
    <div id="wwa-virtualpad-right">
      <button class="wwa-virtualpad__button" id="wwa-slow-button">I</button>
      <button class="wwa-virtualpad__button" id="wwa-fast-button">P</button>
      <button class="wwa-virtualpad__button" id="wwa-enter-button">Y</button>
      <button class="wwa-virtualpad__button" id="wwa-esc-button">N</button>
      <button class="wwa-virtualpad__button" id="wwa-estimate-button">M</button>
    </div>`;
}
