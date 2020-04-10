import { util } from "../loader_util";

// TODO: extractor と共通化, data が妥当？
const POS_CHECK = 0x00; //  0
const POS_VERSION = 0x02; //  2

export function checkCompletelyDecoded(mapData: Uint8Array, dataLength: number): void {
    var i: number;
    var checkSum: number =
      mapData[POS_CHECK] +
      mapData[POS_CHECK + 1] * 0x100;
    var sum: number = 0;
    if (mapData[POS_VERSION] >= 29) {
      for (i = 2; i < dataLength; i++) {
        sum += util.signedByte(mapData[i]) * (i % 8 + 1);
      }
      sum = (sum % 0x10000) & 0xffff;
      if (checkSum !== sum) {
        throw new Error(
          "マップデータが壊れているようです。\n チェックサムの値は" +
          checkSum +
          "ですが、" +
          "実際の和は" +
          sum +
          "でした。"
        );
      }
    }
  }
