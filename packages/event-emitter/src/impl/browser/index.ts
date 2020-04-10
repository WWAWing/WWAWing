import { IEventEmitter } from "../../interface"

export class BrowserEventEmitter implements IEventEmitter {
  private target: HTMLElement;
  constructor(target?: HTMLElement) {
    this.target = target ?? document.createElement("div");
  }
  dispatch<D>(eventName: string, data: D) {
   let customEvent: CustomEvent;
    if (typeof window["CustomEvent"] === "function") {
      customEvent = new CustomEvent(eventName, { detail: data });
    } else {
      // IE11 対応
      customEvent = document.createEvent('CustomEvent');
      customEvent.initCustomEvent(eventName, false, false, data);
    }
    this.target.dispatchEvent(customEvent);
  }
  addListener(eventName: string, callback: (...args: any[]) => any) {
    const wrappedFunction = (event: any) => callback(event.detail);
    this.target.addEventListener(eventName, wrappedFunction);
    return wrappedFunction;
  }
  removeListener(eventName: string, callback: (...args: any[]) => any) {
    this.target.removeEventListener(eventName, callback);
  }
}
