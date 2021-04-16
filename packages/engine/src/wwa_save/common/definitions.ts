import { WWAData } from "../../wwa_data";

/**
 * ロード失敗時のエラーコード
 */
export enum LoadErrorCode {
    /**
     * ワールド名（ゲームタイトル）の不一致
     */
    UNMATCHED_WORLD_NAME = "UNMATCHED_WORLD_NAME",
    /**
     * 暗証番号の不一致
     */
    UNMATCHED_WORLD_PASS_NUMBER = "UNMATCHED_WORLD_PASS_NUMBER",
    /**
     * 古い版のワールドのセーブデータのロードが禁止されている
     */
    DISALLOW_OLD_REVISION_WORLD_SAVE_DATA = "DISALLOW_OLD_REVISION_WORLD_SAVE_DATA"
}

export type OnCompleteLoadingSaveDataFunction = (hasFailedLoadingSaveData: LoadErrorCode[]) => void;
export type OnCheckLoadingSaveDataFunction = (saveDataWorldName: string, saveDataHash: string, mapDataRevisionKey: string | undefined) => LoadErrorCode | null;

/**
 * WWAData と、ワールド名の読み込み結果を表すオブジェクトのペアです。
 * 主に、パスワードセーブなどに使われる容量が削減されたセーブデータにワールド名が含まれるかどうかの判定で使います。
 */
export type WWADataWithWorldNameStatus = [WWAData, { isWorldNameEmpty: boolean }];
