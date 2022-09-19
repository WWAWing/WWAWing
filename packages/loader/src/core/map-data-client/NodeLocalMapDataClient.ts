import fs from "fs";
import { BaseMapDataClient } from "./BaseMapDataClient";
/**
* Node.js で動作しているローカルのファイルのマップデータを取得するクライアント
*/
export class NodeLocalMapDataClient extends BaseMapDataClient {
  constructor(private fileName: string) {
    super();
  }
  public async request(): Promise<ArrayBufferLike> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.fileName, (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data.buffer);
      });
    });
  };
}
