import fs from "fs";
import { BaseMapDataClient, MapDataClientCallback } from "./BaseMapDataClient";
/**
* Node.js で動作しているローカルのファイルのマップデータを取得するクライアント
*/
export class NodeLocalMapDataClient extends BaseMapDataClient {
  constructor(private fileName: string) {
    super();
  }
  public request(callback: MapDataClientCallback): void {
    fs.readFile(this.fileName, (error, data) => {
      if (error) {
          callback(error);
          return;
      }
      callback(undefined, data.buffer);
    });
  }
}
