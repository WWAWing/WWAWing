import {
    WWASaveConsts,
    WWAData
} from "../wwa_data";
import WWACompress from "./WWACompress"; 
import WWASave from "./WWASave";
import WWASaveDataDB from "./WWASaveDataDB";
import WWASaveDataList from "./WWASaveDataList";
import { LoadErrorCode, OnCheckLoadingSaveDataFunction, OnCompleteLoadingSaveDataFunction } from "./common";
import { applyAllMigrators } from "./migrators";

type WWASaveDataItem = {
    url?: string,
    id: number,
    hash: string,
    image: string,
    data: object, // TODO: object だけではよくわからないのでちゃんとした型を指定する
    date: Date,
    worldName: string | undefined, // v3.5.6 以下でセーブされたデータの場合 undefined
    mapDataRevisionKey: string | undefined, // v3.5.6 以下でセーブされたデータの場合 undefined
};

type FailedLoadingSaveDataInformation = {
    id: number,
    cause: LoadErrorCode
};

export default class WWASaveDataDBList extends WWASaveDataList {
    private selectDatas: object[];
    private IDBTransaction: object = {
        READ_ONLY: "readonly",
        READ_WRITE: "readwrite",
        VERSION_CHANGE: "versionchangetransaction"
    };
    /**
     * @see WWASave
     */
    private onCheckLoadingSaveData: OnCheckLoadingSaveDataFunction;
    private onCompleteLoadingSaveData: OnCompleteLoadingSaveDataFunction;
    /**
     * 何もしません。主に IndexedDB のイベントに割り当てる際に使用します。
     */
    private static doNotAnything = () => {};
    /**
     * データベース作成時に指定する keyPath です。
     * TypeScript には IDBKeyPath という専用の型が付与されていますが、 string 型しか受け付けておりません。
     * 代わりに独自の型を定義しています。
     */
    protected keyPath: string | string[] = ["id", "url"];

    constructor(
        onCheckLoadingSaveData: OnCheckLoadingSaveDataFunction,
        onCompleteLoadingSaveData: OnCompleteLoadingSaveDataFunction,
        prototype: WWASaveDataDBList = WWASaveDataDBList.prototype
    ) {
        super();
        Object.setPrototypeOf(this, Object.create(prototype));
        for (var i = 0; i < WWASaveConsts.QUICK_SAVE_MAX; i++) {
            this[i] = new WWASaveDataDB(i, this);
        }
        this.onCheckLoadingSaveData = onCheckLoadingSaveData;
        this.onCompleteLoadingSaveData = onCompleteLoadingSaveData;
        this.createDataBase();
        this.selectSaveData();
    }

    private indexDBOpen(): IDBOpenDBRequest {
        return indexedDB.open(WWASaveConsts.INDEXEDDB_DB_NAME, 201205201);
    }
    private createDataBase(): void {
        try {
            var reqOpen = this.indexDBOpen();
            reqOpen.onupgradeneeded = (e) => {
                var indexedDBSystem = reqOpen.result;
                var oDBOptions = { keyPath: this.keyPath };
                if (!indexedDBSystem.objectStoreNames.contains(WWASaveConsts.INDEXEDDB_TABLE_NAME)) {
                    var objectStore = indexedDBSystem.createObjectStore(WWASaveConsts.INDEXEDDB_TABLE_NAME, oDBOptions);
                    objectStore.createIndex("url", "url", { unique: false });
                }
            };
            reqOpen.onsuccess = WWASaveDataDBList.doNotAnything;
            reqOpen.onerror = WWASaveDataDBList.doNotAnything;
            reqOpen.onblocked = WWASaveDataDBList.doNotAnything;
        } catch (error) {
        }
    }
    /**
     * IndexedDB のストアを取得します。
     * @todo IndexedDB の型定義を追加する
     */
    private getObjectStore(requestResult: IDBDatabase): IDBObjectStore {
        const indexedDBSystem = requestResult;
        try {
            var transaction = indexedDBSystem.transaction(WWASaveConsts.INDEXEDDB_TABLE_NAME, this.IDBTransaction["READ_WRITE"]);
            var store = transaction.objectStore(WWASaveConsts.INDEXEDDB_TABLE_NAME);
        } catch (error) {
            return;
        }
        return store;
    }
    /**
     * セーブデータの1項目を作成します。
     * @param saveID ID
     * @param gameCvs ゲーム画面の Canvas 要素
     * @param compressedData 圧縮済みの WWA セーブデータ
     * @param date 日付
     * @returns 作成したセーブデータの1項目
     */
    protected makeSaveDataItem(saveID: number, gameCvs: HTMLCanvasElement, compressedData: object, date: Date): WWASaveDataItem {
        return {
            "url": location.href,
            "id": saveID,
            "hash": WWASave.checkOriginalMapString,
            "image": gameCvs.toDataURL(),
            "data": compressedData,
            "date": date,
            "worldName": WWASave.worldName,
            "mapDataRevisionKey": WWASave.mapDataRevisionKey
        };
    }
    /**
     * 現在プレイしている WWA のセーブデータを取り出します。
     */
    protected getSaveDataResult(store: IDBObjectStore, onsuccess: (result: WWASaveDataItem[]) => void) {
        const index = store.index("url");
        const range = IDBKeyRange.only(location.href);
        const result = index.getAll(range);

        result.onsuccess = () => {
            onsuccess(result.result);
        };
    }
    public dbUpdateSaveData(saveID: number, gameCvs: HTMLCanvasElement, _quickSaveData: WWAData, date: Date): void {
        const reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = WWASaveDataDBList.doNotAnything;
        reqOpen.onsuccess = () => {
            const store = this.getObjectStore(reqOpen.result);
            const compressData = WWACompress.compress(_quickSaveData);
            const addData = this.makeSaveDataItem(
                saveID,
                gameCvs,
                compressData,
                date
            );
            this.selectDatas[saveID] = addData;

            const reqAdd = store.put(addData);
            reqAdd.onsuccess = WWASaveDataDBList.doNotAnything;
            reqAdd.onerror = WWASaveDataDBList.doNotAnything;
        };
        reqOpen.onerror = WWASaveDataDBList.doNotAnything;
        reqOpen.onblocked = WWASaveDataDBList.doNotAnything;
    }
    /**
     * 指定したIDのセーブデータを削除します。
     * @param saveIDs 削除したいセーブデータのID (複数指定)
     */
    public dbDeleteSaveData(saveIDs: number[]): void {
        const reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = WWASaveDataDBList.doNotAnything;
        reqOpen.onsuccess = () => {
            const store = this.getObjectStore(reqOpen.result);
            saveIDs.forEach(saveId => {
                store.delete([saveId, location.href]);
            });
        };
        reqOpen.onerror = WWASaveDataDBList.doNotAnything;
        reqOpen.onblocked = WWASaveDataDBList.doNotAnything;
    }
    private selectSaveData(): void {
        const reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = WWASaveDataDBList.doNotAnything;
        reqOpen.onsuccess = () => {
            const store = this.getObjectStore(reqOpen.result);
            this.selectDatas = [];

            const onsuccess = (result: WWASaveDataItem[]) => {
                var i: number, len: number, saveData: WWASaveDataItem;
                let failedLoadingSaveData: FailedLoadingSaveDataInformation[] = [];

                len = result.length;
                for (i = 0; i < len; i++) {
                    var resultData: WWASaveDataItem = result[i];
                    try {
                        saveData = {
                            id: resultData.id,
                            hash: resultData.hash,
                            data: resultData.data,
                            date: resultData.date,
                            image: resultData.image,
                            worldName: resultData.worldName, // v3.5.6 以下でセーブされたデータの場合 undefined
                            mapDataRevisionKey: resultData.mapDataRevisionKey // v3.5.6 以下でセーブされたデータの場合 undefined
                        };
                    } catch (error) {
                        continue;
                    }
                    const failedCause = this.onCheckLoadingSaveData(saveData.worldName, saveData.hash, saveData.mapDataRevisionKey);
                    if (failedCause !== null) {
                        failedLoadingSaveData.push({
                            id: saveData.id,
                            cause: failedCause
                        });
                        continue;
                    }
                    if (!this[saveData.id]) {
                        continue;
                    }
                    const quickSaveData = applyAllMigrators(WWACompress.decompress(saveData.data)[0]);
                    this[saveData.id].saveDataSet(saveData.image, quickSaveData, saveData.date);
                }

                if (failedLoadingSaveData.length > 0) {
                    this.dbDeleteSaveData(failedLoadingSaveData.map(data => data.id));
                }

                const failedLoadingCauses = failedLoadingSaveData.map(data => data.cause).filter((cause, index, self) => {
                    // 重複したロード失敗要因を削除
                    return self.indexOf(cause) === index;
                });
                this.onCompleteLoadingSaveData(failedLoadingCauses);
            };
            this.getSaveDataResult(store, onsuccess);

        };
        reqOpen.onerror = WWASaveDataDBList.doNotAnything;
        reqOpen.onblocked = WWASaveDataDBList.doNotAnything;
    }

}
