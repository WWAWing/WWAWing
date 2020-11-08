import WWASaveDataDBList from "./WWASaveDataDBList";
import { WWASave } from ".";

/**
 * WWASaveDataDBList.WWASaveDataItem とは別です。
 */
type WWASaveDataItem = {
    url?: string,
    id: number,
    hash: string,
    image: string,
    data: object,
    date: Date,
    worldName: string,
    urlWithId: string, // URL と ID を組み合わせた値
};

/**
 * WWASaveDataDBList の IE 専用版です。
 */
export default class WWASaveDataDBListForIE extends WWASaveDataDBList {
    /**
     * IE では keyPath を配列で指定することができません。
     * 代わりにセーブデータにURLとセーブデータ番号を付与した文字列を keyPath に指定します。
     */
    protected keyPath = "urlWithId";

    protected makeSaveDataItem(saveID: number, gameCvs: HTMLCanvasElement, compressedData: object, date: Date): WWASaveDataItem {
        return {
            "url": location.href,
            "id": saveID,
            "hash": WWASave.checkOriginalMapString,
            "image": gameCvs.toDataURL(),
            "data": compressedData,
            "date": date,
            "worldName": WWASave.worldName,
            "urlWithId": location.href + " " + saveID
        };
    }
    /**
     * @todo 実装する
     */
    protected getSaveDataResult(store: IDBObjectStore): IDBRequest<WWASaveDataItem[]> {
        return null;
    }
}
