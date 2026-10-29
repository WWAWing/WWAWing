import { WWAData } from "../../wwa_data";

/**
 * セーブデータの過去バージョン互換のためのマイグレータです。
 * isGameOverDisabled の真偽値を gameOverPolicy に変換します。
 * 引数の oldWWAData は破壊せず、新しいオブジェクトを返します。
 * また、 except-macro だった gameOverPolicy は except-assignment に変換します。
 */
export const migrateGameOverPolicy = (oldWWAData: WWAData): WWAData => {
  if ((oldWWAData.gameOverPolicy as string) === "except-macro") {
    return {
      ...oldWWAData,
      gameOverPolicy: "except-assignment",
    }
  }
  if (typeof oldWWAData.isGameOverDisabled !== "boolean") {
    return oldWWAData;
  }
  if (oldWWAData.isGameOverDisabled === true) {
    return {
      ...oldWWAData,
      isGameOverDisabled: undefined,
      gameOverPolicy: "never"
    };
  }
  if (oldWWAData.isGameOverDisabled === false) {
    return {
      ...oldWWAData,
      isGameOverDisabled: undefined,
      gameOverPolicy: "default"
    };
  }
  // 到達しないはずですが念のため
  return oldWWAData;
}
