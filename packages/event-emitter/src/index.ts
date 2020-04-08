import { EventEmitter } from "events";

export class CustomEventEmitter {
  private target: HTMLElement | EventEmitter;

  constructor(target?: HTMLElement | EventEmitter) {
    if(target) {
      this.target = target;
    } else if (EventEmitter) {
      this.target = new EventEmitter();
    } else {
      this.target = document.createElement("div");
    }
  }

  dispatch<D>(eventName: string, data: D) {
    if (this.target instanceof EventEmitter) {
      this.target.emit(eventName, data);
      return;
    }
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
    if (this.target instanceof EventEmitter) {
      this.target.addListener(eventName, callback);
      return;
    }
    this.target.addEventListener(eventName, callback);
  }

  removeListener(eventName: string, callback: (...args: any[]) => any) {
    if (this.target instanceof EventEmitter) {
      this.target.removeListener(eventName, callback);
      return;
    }
    this.target.removeEventListener(eventName, callback);
  }

}
