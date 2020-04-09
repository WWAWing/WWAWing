export interface IEventEmitter {
  dispatch<D>(eventName: string, data: D): void;
  addListener<N extends string, A extends Array<any>, R>(eventName: N, callback: (...args: A) => R): ((...args: any[]) => any);
  removeListener<N extends string, A extends Array<any>, R>(eventName: N, callback: (...args: A) => R): void;
}
