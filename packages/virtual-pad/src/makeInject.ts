export default function makeInject() {
  return `
    <div id="wwa-virtualpad-left">
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button__surface" id="wwa-up-button"></button>
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button__surface" id="wwa-left-button"></button>
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button__surface" id="wwa-right-button"></button>
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button__surface" id="wwa-down-button"></button>
      <div class="wwa-virtualpad__hole"></div>
    </div>
    <div id="wwa-virtualpad-right">
      <button class="wwa-virtualpad__button wwa-virtualpad-button" id="wwa-slow-button">
        <span class="wwa-virtualpad-button__surface">I</span>
      </button>
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button__surface" id="wwa-fast-button">
        <span class="wwa-virtualpad-button__surface">P</span>
      </button>
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button--action" id="wwa-enter-button">
        <span class="wwa-virtualpad-button__surface">Y</span>
      </button>
      <button class="wwa-virtualpad__button wwa-virtualpad-button wwa-virtualpad-button--action" id="wwa-esc-button">
        <span class="wwa-virtualpad-button__surface">N</span>
      </button>
    </div>`;
}
