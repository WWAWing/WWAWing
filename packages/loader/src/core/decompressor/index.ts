export interface DecompressResult {
  byteMapData: Uint8Array;
  byteMapLength: number;
  compressedEndPosition: number;
}
const MEM_BLOCK = 65000;
const EXT_LAST_PADDING = 3;

export function decompressMapData(srcData: Uint8Array): DecompressResult {
  let destData: Uint8Array = new Uint8Array(srcData.length);
  let srcCounter: number, destCounter: number;

  for (
    srcCounter = 0, destCounter = 0;
    srcCounter < srcData.length;
    srcCounter++
  ) {
    if (
      srcData[srcCounter] === 0 &&
      srcData[srcCounter + 1] === 0 &&
      srcData[srcCounter + 2] === 0
    ) {
      break;
    }

    destData[destCounter++] = srcData[srcCounter];

    // 数字が連続していれば解凍処理
    if (srcData[srcCounter] === srcData[srcCounter + 1]) {
      const maxim = srcData[srcCounter + 2];
      for (let i = 0; i < maxim; i++) {
        destData[destCounter++] = srcData[srcCounter];
      }
      srcCounter += 2;
    }

    // マップサイズとパーツ数のデータから必要領域取得
    // 最大サイズを超えそうなときは領域拡張して続行
    if (destCounter + 255 >= destData.length) {
      var newDestData: Uint8Array = new Uint8Array(
        destData.length + MEM_BLOCK
      );

      newDestData.set(destData);
      destData = newDestData;
    }
  }

  console.log("EXTRACT DATA = " + destCounter + " " + srcCounter);

  return { byteMapData: destData, byteMapLength: destCounter, compressedEndPosition: srcCounter + EXT_LAST_PADDING };
}
