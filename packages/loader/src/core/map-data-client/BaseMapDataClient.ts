export abstract class BaseMapDataClient {
  constructor() {}

  public abstract request(): Promise<ArrayBufferLike>;
}
