import { IEventEmitter } from "../../interface"
import { EventEmitter } from "events";

export class NodeEventEmitter implements IEventEmitter {
    private target: EventEmitter;
    constructor(target?: EventEmitter) {
      this.target = target ?? new EventEmitter();
    }
    dispatch<D>(eventName: string, data: D) {
      this.target.emit(eventName, data);
    }
    addListener(eventName: string, callback: (...args: any[]) => any) {
      this.target.addListener(eventName, callback);
    }
    removeListener(eventName: string, callback: (...args: any[]) => any) {
      this.target.removeListener(eventName, callback);
    }
}