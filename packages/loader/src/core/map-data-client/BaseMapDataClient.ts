export type MapDataClientCallback = (error?: any, data?: any) => any;

export abstract class BaseMapDataClient {
  constructor() {}

  public abstract request(callback: MapDataClientCallback): void;
}
