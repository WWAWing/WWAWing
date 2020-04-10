import { WWAData } from "@wwawing/common-interface";
import { WWADataExtractor } from "./loader_extractor";
import { WWALoaderEventEmitter } from "./wwa_data";
import { decodeMapData } from "./decoder";
import { TextLoader } from "./text-loader";
import { MapdataClient } from "./mapdata-client";

export class WWALoader {
  public constructor(
    private fileName: string,
    private eventEmitter: WWALoaderEventEmitter
  ) { }

  public requestAndLoadMapData() {
    const client = new MapdataClient(this.fileName);
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
      const decodedResult = decodeMapData(compressedByteMapData);
      const wwaData = new WWADataExtractor(decodedResult.byteMapData, this.eventEmitter).extractAllData();
      return new TextLoader(wwaData, compressedByteMapData, decodedResult.endPosition, this.eventEmitter).load();
    } catch (e) {
      throw e;
    }
  }
}
