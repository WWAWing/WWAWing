import { IEventEmitter } from "../../interface"

export class BrowserEventEmitter implements IEventEmitter {
  private target: HTMLElement;
  constructor(target?: HTMLElement) {
    this.target = target ?? document.createElement("div");
  }
  dispatch<D>(eventName: string, data: D) {
   let customEvent: CustomEvent;
    if (window["CustomEvent"]) {
      customEvent = new CustomEvent(eventName, data);
    } else {
      // IE11 対応
      customEvent = document.createEvent('CustomEvent');
      customEvent.initCustomEvent('eventName', false, false, data);
    }
    this.target.dispatchEvent(customEvent);
  }
  addListener(eventName: string, callback: (...args: any[]) => any) {
    this.target.addEventListener(eventName, callback);
  }
  removeListener(eventName: string, callback: (...args: any[]) => any) {
    this.target.removeEventListener(eventName, callback);
  }
}
