import { WWAData } from "@wwawing/common-interface";
import { WWADataExtractor } from "./extractor";
import { WWALoaderEventEmitter } from "../infra";
import { decompressMapData } from "./decompressor";
import { TextLoader } from "./text-loader";
import { BaseMapDataClient, BrowserMapDataClient, NodeLocalMapDataClient } from "./map-data-client";

const createMapDataClient = (fileName: string): BaseMapDataClient => {
  if (typeof window !== "undefined") {
    return new BrowserMapDataClient(fileName);
  } else {
    return new NodeLocalMapDataClient(fileName);
  }
}

export class WWALoader {
  public constructor(
    private fileName: string,
    private eventEmitter: WWALoaderEventEmitter
  ) { }

  public async requestAndLoadMapData() {
    const client: BaseMapDataClient = createMapDataClient(this.fileName);
    try {
      const responseBuffer = await client.request();
      if(!responseBuffer) {
        this.eventEmitter.dispatch("error", { name: "マップデータ取得に失敗しました", message: "mapdata is empty" });
        return;
      }
      const wwaData = this.loadMapData(responseBuffer);
      this.eventEmitter.dispatch("mapData", wwaData);
    } catch(error) {
        const name = error.name || "";
        const message = error.message || "";
        this.eventEmitter.dispatch("error", { name, message });
    }
  }

  private loadMapData(data: any): WWAData {
    try {
      const compressedByteMapData = new Uint8Array(data);
      const { byteMapData, byteMapLength, compressedEndPosition } = decompressMapData(compressedByteMapData);
      const wwaData = new WWADataExtractor(byteMapData, byteMapLength, this.eventEmitter).extractAllData();
      return new TextLoader(wwaData, compressedByteMapData, compressedEndPosition, this.eventEmitter).load();
    } catch (e) {
      throw e;
    }
  }
}
