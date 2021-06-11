import WWASaveDataDBList from "./WWASaveDataDBList";
import { WWASave, OnCompleteLoadingSaveDataFunction, OnCheckLoadingSaveDataFunction } from ".";
import { WWASaveConsts } from "../wwa_data";

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
    mapDataRevisionKey: string
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
            "urlWithId": location.href + " " + saveID,
            "mapDataRevisionKey": WWASave.mapDataRevisionKey
        };
    }
    // FIXME: オーバーライドできてない
    protected getSaveDataResult(store: IDBObjectStore, onsuccess: (result: WWASaveDataItem[]) => void) {
        let results: WWASaveDataItem[] = [];
        let gotItemCount = 0;

        for (let index = 0; index < WWASaveConsts.QUICK_SAVE_MAX; index++) {
            const saveItem: IDBRequest<WWASaveDataItem> = store.get(location.href + " " + index);

            saveItem.onsuccess = function() {
                results.push(saveItem.result);
                gotItemCount++;
                if (gotItemCount >= WWASaveConsts.QUICK_SAVE_MAX) {
                    onsuccess(results);
                }
            };
            saveItem.onerror = function() {
                results.push(null);
                gotItemCount++;
                if (gotItemCount >= WWASaveConsts.QUICK_SAVE_MAX) {
                    onsuccess(results);
                }
            };

        }
    }
}
