import { WWAData } from "@wwawing/common-interface";
import { WWADataExtractor } from "./extractor/index.js";
import { WWALoaderEventEmitter } from "../infra/index.js";
import { decompressMapData } from "./decompressor/index.js";
import { TextLoader } from "./text-loader/index.js";
import { MapDataClient } from "./map-data-client/index.js";

export class WWALoader {
  public constructor(
    private fileName: string,
    private eventEmitter: WWALoaderEventEmitter
  ) { }

  public requestAndLoadMapData() {
    const client = new MapDataClient(this.fileName);
    client.request((error, data) => {
      if (error) {
        const name = error.name || "";
        const message = error.message || "";
        this.eventEmitter.dispatch("error", { name, message});
      } else if (!data) {
        this.eventEmitter.dispatch("error", { name: "マップデータ取得に失敗しました", message: "mapdata is empty" });
      } else {
        const wwaData = this.loadMapData(data);
        this.eventEmitter.dispatch("mapData", wwaData);
      }
    });
  }

  private loadMapData(data: any): WWAData {
    try {
      const compressedByteMapData = new Uint8Array(data);
      const { byteMapData, byteMapLength, compressedEndPosition} = decompressMapData(compressedByteMapData);
      const wwaData = new WWADataExtractor(byteMapData, byteMapLength, this.eventEmitter).extractAllData();
      return new TextLoader(wwaData, compressedByteMapData, compressedEndPosition, this.eventEmitter).load();
    } catch (e) {
      throw e;
    }
  }
}
