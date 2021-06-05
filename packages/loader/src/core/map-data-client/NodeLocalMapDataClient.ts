import fs from "fs";
import { BaseMapDataClient } from "./BaseMapDataClient";
/**
* Node.js で動作しているローカルのファイルのマップデータを取得するクライアント
*/
export class NodeLocalMapDataClient extends BaseMapDataClient {
  constructor(fileName: string) {
    super(fileName);
  }
  public request(callback: (error?: any, data?: any) => any): void {
    fs.readFile(this.fileName, (error, data) => {
      if (error) {
          callback(error);
          return;
      }
      callback(undefined, data.buffer);
    });
  }
}
