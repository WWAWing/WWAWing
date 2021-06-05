export abstract class BaseMapDataClient {
  constructor(protected fileName: string) {}

  public abstract request(callback: (error?: any, data?: any) => any): void;
}
