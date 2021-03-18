import { MD5, AES, enc } from "crypto-js";

// WWA Wing v3.5.6 以前で使用していた暗号化キー
function generateKeyV0(worldPassNumber: number, checkOriginalMapString: string): string {
  return `^ /${worldPassNumber * 231 + 8310 + checkOriginalMapString}P+>A[]`;
}

// 現状で使用している暗号化キー
function generateKeyV1(worldPassNumber: number): string {
  return `^ /${worldPassNumber * 231 + 8310}P+>A[]`;
}

// 新規の暗号化は現行バージョンの暗号化キーのみしか使わないのでキーV0を使った暗号化の提供はありません
export function encodeSaveData(saveData: string, worldPassNumber: number): string {
  console.warn(enc.Utf8.parse(saveData));
  return AES.encrypt(enc.Utf8.parse(saveData), generateKeyV1(worldPassNumber)).toString();
}

export function decodeSaveDataV0(password: string, worldPassNumber: number, checkOriginalMapString: string): string {
  return AES.decrypt(password, generateKeyV0(worldPassNumber, checkOriginalMapString)).toString(enc.Utf8);
}

export function decodeSaveDataV1(password: string, worldPassNumber: number): string {
  return AES.decrypt(password, generateKeyV1(worldPassNumber)).toString(enc.Utf8);
}

export function generateMD5(text: string): string{
  return MD5(text).toString();
}
