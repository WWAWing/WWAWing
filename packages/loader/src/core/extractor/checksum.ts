import { signedByte } from "../../infra/util";
import { BytePosition } from "./constants";

function calculateCorrectCheckSum(mapData: Uint8Array): number {
  return mapData[BytePosition.CHECK] + mapData[BytePosition.CHECK + 1] * 0x100;
}

function calculateByteSum(mapData: Uint8Array, dataLength: number): number {
  let sum: number = 0;
  if (mapData[BytePosition.VERSION] >= 29) {
    for (let i = 2; i < dataLength; i++) {
      sum += signedByte(mapData[i]) * (i % 8 + 1);
    }
    sum = (sum % 0x10000) & 0xffff;
  }
  return sum;
}

export function checkMapDataBroken(mapData: Uint8Array, dataLength: number): void {
  const correctCheckSum = calculateCorrectCheckSum(mapData);
  const sum = calculateByteSum(mapData, dataLength);
  if (correctCheckSum !== sum) {
    throw new Error(
      "マップデータが壊れているようです。\n チェックサムの値は" +
      correctCheckSum +
      "ですが、" +
      "実際の和は" +
      sum +
      "でした。"
    );
  }
}
