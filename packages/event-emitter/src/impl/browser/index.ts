import { IEventEmitter } from "../../interface"

export class BrowserEventEmitter implements IEventEmitter {
  private target: HTMLElement;
  constructor(target?: HTMLElement) {
    this.target = target ?? document.createElement("div");
  }
  dispatch<D>(eventName: string, data: D) {
    const customEvent = new CustomEvent(eventName, { detail: data });
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
