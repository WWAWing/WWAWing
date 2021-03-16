import {
    WWASaveConsts,
    WWAData
} from "../wwa_data";
import WWACompress from "./WWACompress"; 
import WWASave from "./WWASave";
import WWASaveDataDB from "./WWASaveDataDB";
import WWASaveDataList from "./WWASaveDataList";
import { LoadErrorCode, OnCheckLoadingSaveDataFunction, OnCompleteLoadingSaveDataFunction } from "./common";

type WWASaveDataItem = {
    url?: string,
    id: number,
    hash: string,
    image: string,
    data: object, // TODO: object だけではよくわからないのでちゃんとした型を指定する
    date: Date,
    worldName: string,
    majorRevision: string,
};

type FailedLoadingSaveDataInformation = {
    id: number,
    cause: LoadErrorCode
};

export default class WWASaveDataDBList extends WWASaveDataList {
    private selectDatas: object[];
    private selectLoad: boolean = false;
    private indexedDB: IDBFactory = window["indexedDB"] || window["webkitIndexedDB"] || window["mozIndexedDB"];
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

    constructor(onCheckLoadingSaveData: OnCheckLoadingSaveDataFunction, onCompleteLoadingSaveData: OnCompleteLoadingSaveDataFunction) {
        super();
        Object.setPrototypeOf(this, Object.create(WWASaveDataDBList.prototype));
        for (var i = 0; i < WWASaveConsts.QUICK_SAVE_MAX; i++) {
            this[i] = new WWASaveDataDB(i, this);
        }
        if (this.indexedDB) {
            try {
                if (this.indexedDB.open) {
                } else {
                    this.indexedDB = null;
                }
            } catch (e) {
                this.indexedDB = null;
            }
        }

        try {
            var databaselog = this.indexedDB.open('test');
            if (databaselog.error) {
                this.indexedDB = null;
            }
        } catch (e) {
        }
        if (!this.indexedDB) {
            return;
        }
        this.onCheckLoadingSaveData = onCheckLoadingSaveData;
        this.onCompleteLoadingSaveData = onCompleteLoadingSaveData;
        this.createDataBase();
        this.selectSaveData();
    }
    /**
     *  IE/EDGEでgetAll関数が存在しなく、ロード失敗するため挙動をエミュレートする
     */
    private getAlEmulate() {
        var getAll = function (query) {
            var queryResult = this.openCursor(query);
            var dataList = [];
            var callBackResult = { onsuccess: null, onerror: null };

            queryResult.onsuccess = (e) => {
                var cursor = e.target.result;
                if (cursor === null) {
                    var callBackEvent = {
                        target: {
                            result: dataList
                        }
                    };
                    if (typeof callBackResult.onsuccess === "function") {
                        callBackResult.onsuccess(callBackEvent);
                    }
                } else {
                    dataList.push(e.target.result.value);
                    cursor.continue();
                }
            };
            queryResult.onerror = (e) => {
                if (typeof callBackResult.onerror === "function") {
                    callBackResult.onerror(e);
                }
            };
            return callBackResult;
        };
        if (window.IDBIndex.prototype.getAll === undefined) {
            // @ts-ignore
            window.IDBIndex.prototype.getAll = getAll;
        }
        if (window.IDBObjectStore.prototype.getAll === undefined) {
            // @ts-ignore
            window.IDBObjectStore.prototype.getAll = getAll;
        }
    }
    private indexDBOpen(): IDBOpenDBRequest {
        this.getAlEmulate();
        return this.indexedDB.open(WWASaveConsts.INDEXEDDB_DB_NAME, 201205201);
    }
    private createDataBase(): void {
        try {
            var reqOpen = this.indexDBOpen();
            reqOpen.onupgradeneeded = (e) => {
                var indexedDBSystem = reqOpen.result;
                var oDBOptions = { keyPath: ["id", "url"] };
                if (!indexedDBSystem.objectStoreNames.contains(WWASaveConsts.INDEXEDDB_TABLE_NAME)) {
                    var objectStore = indexedDBSystem.createObjectStore(WWASaveConsts.INDEXEDDB_TABLE_NAME, oDBOptions);
                    objectStore.createIndex("url", "url", { unique: false });
                }
            };
            reqOpen.onsuccess = WWASaveDataDBList.doNotAnything;
            reqOpen.onerror = WWASaveDataDBList.doNotAnything;
            reqOpen.onblocked = (err) => {
                this.indexedDB = null;
            };
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
    public dbUpdateSaveData(saveID: number, gameCvs: HTMLCanvasElement, _quickSaveData: WWAData, date: Date): void {
        if (!this.indexedDB) {
            return;
        }
        var reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = WWASaveDataDBList.doNotAnything;
        reqOpen.onsuccess = (e) => {
            const store = this.getObjectStore(reqOpen.result);
            var compressData: object = WWACompress.compress(_quickSaveData);

            var addData: WWASaveDataItem = {
                "url": location.href,
                "id": saveID,
                "hash": WWASave.checkOriginalMapString,
                "image": gameCvs.toDataURL(),
                "data": compressData,
                "date": date,
                "worldName": WWASave.worldName,
                "majorRevision": WWASave.majorRevision
            };
            this.selectDatas[saveID] = addData;

            try {
                var reqAdd = store.put(addData);
                //reqAdd.callbackLog = callback;
            } catch (error) {
                // EDGEでエラー？
                return;
            }
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
        if (!this.indexedDB) {
            return;
        }
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
        if (!this.indexedDB) {
            return;
        }
        var reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = WWASaveDataDBList.doNotAnything;
        reqOpen.onsuccess = () => {
            const store = this.getObjectStore(reqOpen.result);
            //var range = IDBKeyRange.bound(10);
            this.selectDatas = [];
            this.selectLoad = false;

            var index = store.index("url");
            var range = IDBKeyRange.only(location.href);
            var saveDataResult = index.getAll(range);

            /**
             * @todo e には Event が充てられていますが、 e.target.result が存在しません。
             *       saveDataResult.result でもクエリの結果が取得できますが、 IE11 では取得できません。
             */
            saveDataResult.onsuccess = (e: any) => {
                var i: number, len: number, saveData: WWASaveDataItem;
                var result = e.target.result;
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
                            worldName: resultData.worldName,
                            majorRevision: resultData.majorRevision // v3.5.6 以下でセーブされたデータの場合 undefined
                        };
                    } catch (error) {
                        continue;
                    }
                    const failedCause = this.onCheckLoadingSaveData(saveData.worldName, saveData.hash, saveData.majorRevision);
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
                    const [quickSaveData] = WWACompress.decompress(saveData.data);
                    this[saveData.id].saveDataSet(saveData.image, quickSaveData, saveData.date);
                }

                if (failedLoadingSaveData.length > 0) {
                    this.dbDeleteSaveData(failedLoadingSaveData.map(data => data.id));
                }

                this.selectLoad = true;
                const failedLoadingCauses = failedLoadingSaveData.map(data => data.cause).filter((cause, index, self) => {
                    // 重複したロード失敗要因を削除
                    return self.indexOf(cause) === index;
                });
                this.onCompleteLoadingSaveData(failedLoadingCauses);
            };
            saveDataResult.onerror = (e) => {
                this.indexedDB = null;
            };

        };
        reqOpen.onerror = WWASaveDataDBList.doNotAnything;
        reqOpen.onblocked = WWASaveDataDBList.doNotAnything;
    }

}
