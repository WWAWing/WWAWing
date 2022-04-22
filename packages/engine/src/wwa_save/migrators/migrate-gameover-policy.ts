import { WWAData } from "../../wwa_data";

/**
 * v3.7.1 以前のセーブデータを v3.7.2 以降に変換
 * isGameOverDisabled の真偽値を gameOverPolicy に変換します。
 * 引数の oldWWAData は破壊せず、新しいオブジェクトを返します。
 */
export const migrateGameOverPolicy = (oldWWAData: WWAData): WWAData => {
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
