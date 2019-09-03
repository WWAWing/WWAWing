import {
    WWASaveConsts,
    WWAData
} from "../wwa_data";
import WWACompress from "./WWACompress"; 
import WWASave from "./WWASave";
import WWASaveData from "./WWASaveData";
import WWASaveDataDB from "./WWASaveDataDB";
import WWASaveDataList from "./WWASaveDataList";

export default class WWASaveDataDBList extends WWASaveDataList {
    private selectDatas: object[];
    private selectLoad: boolean = false;
    private indexedDB = window["indexedDB"] || window["webkitIndexedDB"] || window["mozIndexedDB"];
    private IDBTransaction: object = {
        READ_ONLY: "readonly",
        READ_WRITE: "readwrite",
        VERSION_CHANGE: "versionchangetransaction"
    };
    constructor() {
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
        this.createDataBase();
        this.selectSaveData();
    }
    /**
     * IE/EDGEでgetAll関数が存在しなく、ロード失敗するため挙動をエミュレートする
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
        if (window["IDBIndex"].prototype.getAll === undefined) {
            window["IDBIndex"].prototype.getAll = getAll;
        }
        if (window["IDBObjectStore"].prototype.getAll === undefined) {
            window["IDBObjectStore"].prototype.getAll = getAll;
        }
    }
    private indexDBOpen() {
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
            reqOpen.onsuccess = (e) => {
            };
            reqOpen.onerror = (err) => {
            };
            reqOpen.onblocked = (err) => {
                this.indexedDB = null;
            };
        } catch (error) {
        }
    }
    public dbUpdateSaveData(saveID: number, gameCvs: HTMLCanvasElement, _quickSaveData: WWAData, date: Date): void {
        if (!this.indexedDB) {
            return;
        }
        var reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = (e) => {
        };
        reqOpen.onsuccess = (e) => {
            var indexedDBSystem = reqOpen.result;
            try {
                var transaction = indexedDBSystem.transaction(WWASaveConsts.INDEXEDDB_TABLE_NAME, this.IDBTransaction["READ_WRITE"]);
                var store = transaction.objectStore(WWASaveConsts.INDEXEDDB_TABLE_NAME);
            } catch (error) {
                return;
            }
            var compressData: object = WWACompress.compress(_quickSaveData);

            var addData = {
                "url": location.href,
                "id": saveID,
                "hash": WWASave.checkOriginalMapString,
                "image": gameCvs.toDataURL(),
                "data": compressData,
                "date": date
            };
            this.selectDatas[saveID] = addData;

            var reqAdd = store.put(addData);
            //reqAdd.callbackLog = callback;
            reqAdd.onsuccess = (e) => {
            };
            reqAdd.onerror = (e) => {
            };
        };
        reqOpen.onerror = (e) => {
        };
        reqOpen.onblocked = (e) => {
        };
    }
    private selectSaveData(): void {
        if (!this.indexedDB) {
            return;
        }
        var reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = function (e) {
        };
        reqOpen.onsuccess = (e) => {
            var indexedDBSystem = reqOpen.result;
            var transaction, store;
            try {
                transaction = indexedDBSystem.transaction(WWASaveConsts.INDEXEDDB_TABLE_NAME, this.IDBTransaction["READ_ONLY"]);
                store = transaction.objectStore(WWASaveConsts.INDEXEDDB_TABLE_NAME);
            } catch (error) {
                return;
            }
            //var range = IDBKeyRange.bound(10);
            this.selectDatas = [];
            this.selectLoad = false;

            var index = store.index("url");
            var range = IDBKeyRange.only(location.href);
            var saveDataResult = index.getAll(range);

            saveDataResult.onsuccess = (e) => {
                var i, len, loadend, onsuccess, onerror, saveData;
                loadend = 0;
                var result = e.target.result;
                len = result.length;
                for (i = 0; i < len; i++) {
                    var resultData = result[i];
                    try {
                        saveData = {
                            id: resultData.id,
                            hash: resultData.hash,
                            data: resultData.data,
                            date: resultData.date,
                            image: resultData.image
                        };
                    } catch (error) {
                        continue;
                    }
                    if (WWASave.checkOriginalMapString !== saveData.hash) {
                        continue;
                    }
                    var quickSaveData = WWACompress.decompress(saveData.data);
                    this[i].saveDataSet(saveData.image, quickSaveData, saveData.date);
                }
                this.selectLoad = true;
            };
            saveDataResult.onerror = (e) => {
                this.indexedDB = null;
            };

        };
        reqOpen.onerror = (e) => {
        };
        reqOpen.onblocked = (e) => {
        };
    }

}