import { WWAData } from "./wwa_data";
// MEMO: psave は Phase4でなくなるので、コードの変更は最小限に進める
import { WWASaveData, MessageWindow } from "./wwa_message";
import { WWA } from "./wwa_main";

var SAVE_COMPRESS_ID = {
    MAP: "map",
    MAP_OBJECT: "mapObject",
    SYSTEM_MESSAGE: "systemMessage"
};

var NOT_COMPRESS_ID = {
    "mapAttribute": true,
    "objectAttribute": true,
    "message": true,
};

export class WWACompress {
    private static MIN_LOOP_COUNT = 3;
    public static _restartData: WWAData;
    public static compress(wwaData: WWAData): object {
        var saveObject: object = {};
        var key: string, value;
        for (key in wwaData) {
            if (NOT_COMPRESS_ID[key]) {
                continue;
            }
            value = wwaData[key];
            switch (typeof value) {
                case "number":
                case "string":
                case "boolean":
                    if (this._restartData[key] === value) {
                        continue;
                    }
                    break;
                case "object":
                    if (value === null) {
                        if (this._restartData[key] === value) {
                            continue;
                        }
                    } else {
                        value = this.compressObject(key, value, this._restartData[key]);
                        if (value === undefined) {
                            continue;
                        }
                    }
                    break;
                case "undefined":
                    break;
                case "function":
                    continue;
            }
            saveObject[key] = value;
        }

        return saveObject;
    }
    private static compressObject(key: string, wwaObject: object, restartObject: object): object {
        var saveObject: object, mapY: object, restartMapY: object, writeMapY: object;
        switch (key) {
            case SAVE_COMPRESS_ID.MAP:
            case SAVE_COMPRESS_ID.MAP_OBJECT:
                var newValue: number, oldValue: number, addValue: number, x: string, y: string, x_number: number, id: number, allIdTableX: object, allIdTableY: object, idTableX: number[][], idTableY: number[][], idText: string, xList: number[], yList: number[];
                saveObject = {};
                allIdTableY = {};
                allIdTableX = {};
                for (y in wwaObject) {
                    mapY = wwaObject[y];
                    restartMapY = restartObject[y];
                    writeMapY = {};
                    oldValue = -1;
                    //物体・背景IDごとにテーブルを作り、そこに座標情報を保存する。
                    //Y座標を添え字にしてX座標を配列に格納。同じY座標に存在するX座標を抽出。
                    for (x in mapY) {
                        id = mapY[x];
                        if (id !== restartMapY[x]) {
                            writeMapY[x] = id;
                            if (allIdTableY[id] === undefined) {
                                allIdTableY[id] = {};
                            }
                            idTableY = allIdTableY[id];
                            if (idTableY[y] === undefined) {
                                idTableY[y] = [];
                            }

                            xList = idTableY[y];
                            xList.push(Number(x));
                        }
                    }
                }
                //Y座標情報の整理
                for (idText in allIdTableY) {
                    idTableY = allIdTableY[idText];
                    if (allIdTableX[idText] === undefined) {
                        allIdTableX[idText] = {};
                    }
                    idTableX = allIdTableX[idText];
                    if (saveObject[idText] === undefined) {
                        saveObject[idText] = [];
                    }
                    oldValue = -1;
                    for (y in idTableY) {

                        xList = idTableY[y];
                        if ((xList.length === 1)) {
                            //Y座標に対し、X座標が一つしか存在しないため、
                            //X座標を添え字にしてY座標を配列に格納。同じX座標に存在するY座標を抽出。
                            x_number = xList[0];
                            if (idTableX[x_number] === undefined) {
                                idTableX[x_number] = [];
                            }

                            yList = idTableX[x_number];
                            yList.push(Number(y));
                        } else {
                            //Y座標に存在する座標が複数あったため、データの格納を行う

                            //一つ前のY座標と比較し、Y座標の相対数値を抽出
                            newValue = Number(y);
                            addValue = newValue - oldValue - 1;//変動値に0は使われないため、1で減算して無駄を削除
                            oldValue = newValue;

                            //X座標の配列を相対座標の配列に変換して格納
                            saveObject[idText].push(this.getCompressArray(xList), addValue);
                        }
                    }
                }
                //X座標情報の整理
                for (idText in allIdTableX) {
                    id = Number(idText);
                    idTableX = allIdTableX[idText];

                    oldValue = -1;
                    for (x in idTableX) {
                        yList = idTableX[x];

                        //一つ前のX座標と比較し、X座標の相対数値を抽出
                        newValue = Number(x);
                        addValue = newValue - oldValue - 1;//変動値に0は使われないため、1で減算して無駄を削除
                        oldValue = newValue;
                        if ((yList.length === 1)) {
                            //X座標とY座標それぞれ独立していて重複なし。
                            saveObject[idText].push(addValue, yList[0]);
                        } else {
                            //Y座標に存在する座標が複数あったため、データの格納を行う
                            //Y座標の配列を相対座標の配列に変換して格納
                            saveObject[idText].push(addValue, this.getCompressArray(yList));
                        }
                    }
                }
                var saveList = [];
                oldValue = -1;

                //テーブル情報を配列情報に変換
                for (idText in saveObject) {
                    newValue = Number(idText);
                    addValue = newValue - oldValue - 1;
                    oldValue = newValue;
                    saveList.push(addValue, saveObject[idText]);
                }
                return saveList;
            case SAVE_COMPRESS_ID.SYSTEM_MESSAGE:
                saveObject = {};
                var key: string, value;
                for (key in wwaObject) {
                    value = wwaObject[key];
                    if (restartObject[key] === value) {
                        continue;
                    }
                    saveObject[key] = value;
                }
                break;
            default:
                return wwaObject;
        }
        if (Object.keys(saveObject).length === 0) {
            return undefined;
        }
        return saveObject;
    }
    /**
     * 絶対数値を示した配列を、相対数値を示した配列に変換する
     * @param list
     */
    private static getCompressArray(list: number[]): number[] {
        var newList: number[] = [];
        var oldValue: number, addValue: number, newValue: number, i: number, len: number;
        var k: number, loopCount: number, n: number;
        //0は連続値のフラグとして使用するため、初期値を-1にして
        //0座標のaddValueを1になるようにする
        oldValue = -1;
        len = list.length;
        for (k=0,i = 0; i < len; i++) {
            newValue = list[i];
            addValue = newValue - oldValue;
            loopCount = 0;
            n = i;
            while ((n < len - 1) && (list[n] + 1 === list[n + 1])) {
                //連続して値が1ずつ増えている数を取得
                n++;
                loopCount++;
            }
            if (loopCount < this.MIN_LOOP_COUNT) {
                //連続して値が1ずつ増えている回数が最低ループ回数以下の場合、
                //1変数で保持した方が軽いため1つづつ格納
                newList[k++] = addValue;
            } else {
                i = n;
                newValue += loopCount;
                //最初の数値をフラグ判定用に0にして、ループ回数を格納。
                //ループ回数は3回未満にならないため、値から最低ループ回数を引く
                newList[k++] = 0;
                newList[k++] = addValue;
                newList[k++] = loopCount - this.MIN_LOOP_COUNT;
            }
            oldValue = newValue;
        }
        return newList;
    }
    /**
     * 相対数値を示した配列を、絶対数値を示した配列に変換する
     * @param list
     */
    private static getDecompressArray(list: number[]): number[] {
        var newList: number[] = [];
        var oldValue: number, addValue: number, newValue: number, i: number, len: number;
        var lastValue:number,k:number;
        oldValue = -1;//初期値を-1にすることで、0座標でも値が0にならないようにする
        len = list.length;
        for (i = 0,k=0; i < len; i++) {
            addValue = list[i];
            if (addValue === 0) {
                //連続して1ずつ増える配列が存在
                addValue = list[++i];
                newValue = oldValue + addValue;//増加数値から絶対数値を算出
                lastValue = newValue + list[++i] + this.MIN_LOOP_COUNT;//変数から最低ループ回数を加算し、ループ回数を算出
                for (; newValue <= lastValue; newValue++) {
                    newList[k++] = newValue;
                }
                oldValue = lastValue;
            } else {
                //その数値を格納
                newValue = oldValue + addValue;//増加数値から絶対数値を算出
                newList[k++] = newValue;
                oldValue = newValue;
            }
        }
        return newList;
    }
    public static decompress(saveObject: object): WWAData {
        var newData: WWAData;

        newData = <WWAData>JSON.parse(JSON.stringify(this._restartData));

        var key: string, value;
        for (key in saveObject) {
            value = saveObject[key];
            switch (typeof value) {
                case "number":
                case "string":
                case "boolean":
                    break;
                case "object":
                    if (value !== null) {
                        value = this.decompressObject(key, value, newData[key]);
                    }
                    break;
                case "undefined":
                    break;
                case "function":
                    continue;
            }
            newData[key] = value;
        }
        return newData;
    }
    private static decompressObject(key: string, loadObject: object, newObject: object): object {
        var saveObject: object, mapY: object, restartMapY: object, writeMapY: object;
        var key: string;
        switch (key) {
            case SAVE_COMPRESS_ID.MAP:
            case SAVE_COMPRESS_ID.MAP_OBJECT:
                var newValue: number, oldValue: number, addValue: number, x: string, y: string, x_number: number, y_number: number, id: number, allIdTableX: object, allIdTableY: object, idText: string, xList: number[], yList: number[];

                saveObject = {};

                oldValue = -1;
                var i, len;
                var loadArray: object[] = <object[]>loadObject;
                len = loadArray.length;
                //配列から物体ID・背景IDテーブルに変換
                for (i = 0; i < len;i+=2) {
                    addValue = Number(loadArray[i]);
                    newValue = oldValue + addValue + 1;//変動値に0は使われないため、1で加算して無駄を削除
                    oldValue = newValue;

                    id = newValue;

                    saveObject[newValue] = loadArray[i + 1];
                }
                var idTableX, idTableY;
                for (idText in saveObject) {
                    id = Number(idText);

                    loadArray = <object[]>saveObject[idText];
                    len = loadArray.length;
                    idTableX = [];
                    idTableY = [];
                    
                    //配列からX、Y配列を抽出
                    for (i = 0; i < len; i += 2) {

                        var xData = loadArray[i];
                        var yData = loadArray[i + 1];
                        var newData;
                        if (xData instanceof Array) {
                            //X座標配列の場合、配列を相対配列から絶対配列に変換
                            xData = this.getDecompressArray(xData);
                        }
                        if (yData instanceof Array) {
                            //X座標配列の場合、配列を絶対配列から相対配列に変換
                            yData = this.getDecompressArray(yData);
                        }
                        if (typeof xData === "object") {
                            //X配列として処理
                            idTableX.push({ x: xData, y: yData });
                        } else {
                            //Y配列として処理
                            idTableY.push({ x: xData, y: yData });
                        }
                    }

                    var code: string;

                    //X座標情報をベースとした配列を探索
                    oldValue = -1;
                    for (code in idTableX) {
                        //相対数値から絶対数値のY座標に変換
                        addValue = Number(idTableX[code].y);
                        newValue = oldValue + addValue + 1;//変動値に0は使われないため、1で加算して無駄を削除
                        oldValue = newValue;
                        xData = idTableX[code].x;
                        y = String(newValue);

                        if (xData instanceof Array) {
                            //X座標情報が配列
                            loadArray = <object[]>xData;
                            len = loadArray.length;
                            for (i = 0; i < len; i++) {
                                x = String(loadArray[i]);
                                newObject[y][x] = id;
                            }
                        } else {
                            //X座標情報が数値
                            //※本来この処理は実行されないが念のために記述
                            x = String(xData);
                            newObject[y][x] = id;
                        }
                    }

                    //Y座標情報をベースとした配列を探索
                    oldValue = -1;
                    for (code in idTableY) {
                        //相対数値から絶対数値のX座標に変換
                        addValue = Number(idTableY[code].x);
                        newValue = oldValue + addValue + 1;//変動値に0は使われないため、1で加算して無駄を削除
                        oldValue = newValue;
                        yData = idTableY[code].y;
                        x = String(newValue);

                        if (yData instanceof Array) {
                            //Y座標情報が配列
                            loadArray = <object[]>yData;
                            len = loadArray.length;
                            for (i = 0; i < len; i++) {
                                y = String(loadArray[i]);
                                newObject[y][x] = id;
                            }
                        } else {
                            //Y座標情報が数値
                            y = String(yData);
                            newObject[y][x] = id;
                        }
                    }
                }


                return newObject;
            case SAVE_COMPRESS_ID.SYSTEM_MESSAGE:
            default:
                if (newObject) {
                } else {
                    if (loadObject) {
                        if (newObject instanceof Array) {
                            newObject = [];
                        } else {
                            newObject = {};
                        }
                    } else {
                        return undefined;
                    }
                }
                for (key in loadObject) {
                    newObject[key] = loadObject[key];
                }
                return newObject;
        }
    } 
    
    public static setRestartData(restartData: WWAData) {
        this._restartData = restartData;
    }

    public static getStartWWAData(resumeSaveTextData: string) {
        if (!resumeSaveTextData) {
            return this._restartData;
        }
        try {
            var resumeSaveData = JSON.parse(resumeSaveTextData);
        } catch (e) {
            return this._restartData;
        }
        if (resumeSaveData) {
            var wwaData: WWAData;
            try {
                wwaData = this.decompress(resumeSaveData);
                if (wwaData) {
                    return wwaData;
                }
            } catch (e) {

            }
        }
        return this._restartData;
    }
};

export class WWASaveDB {
    private static _messageWindow: MessageWindow;
    private static selectDatas: object[];
    private static selectLoad:boolean = false;
    private static INDEXEDDB_DB_NAME = "WWA_WING_DB";
    private static INDEXEDDB_TABLE_NAME = "SAVE_TABLE";
    private static indexedDB = window["indexedDB"] || window["webkitIndexedDB"] || window["mozIndexedDB"];
    private static _checkOriginalMapString: string;
    private static IDBTransaction: object = {
        READ_ONLY: "readonly",
        READ_WRITE: "readwrite",
        VERSION_CHANGE : "versionchangetransaction"
    };
    private static indexDBOpen() {
        return this.indexedDB.open(this.INDEXEDDB_DB_NAME, 201205201);
    }
    public static init(_messageWindow: MessageWindow, wwa: WWA) {
        this._messageWindow = _messageWindow;
        this._checkOriginalMapString = wwa._checkOriginalMapString;
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
    private static createDataBase() {
        try {
            var reqOpen = this.indexDBOpen();
            reqOpen.onupgradeneeded = (e) => {
                var indexedDBSystem = reqOpen.result;
                var oDBOptions = { keyPath: ["id", "url"]};
                if (!indexedDBSystem.objectStoreNames.contains(this.INDEXEDDB_TABLE_NAME)) {
                    var objectStore = indexedDBSystem.createObjectStore(this.INDEXEDDB_TABLE_NAME, oDBOptions);
                    objectStore.createIndex("url", "url", { unique: false });
                }
            };
            reqOpen.onsuccess = (e) =>{
            };
            reqOpen.onerror = (err) =>{
            };
            reqOpen.onblocked = (err) => {
                this.indexedDB = null;
            };
        } catch (error) {
        }
    }
    public static dbUpdateSaveData(saveID: number, gameCvs: HTMLCanvasElement, quickSaveData: object, date: Date) {
        if (!this.indexedDB) {
            return;
        }
        var reqOpen = this.indexDBOpen();
        reqOpen.onupgradeneeded = (e) => {
        };
        reqOpen.onsuccess = (e) => {
            var indexedDBSystem = reqOpen.result;
            try {
                var transaction = indexedDBSystem.transaction(this.INDEXEDDB_TABLE_NAME, this.IDBTransaction["READ_WRITE"]);
                var store = transaction.objectStore(this.INDEXEDDB_TABLE_NAME);
            } catch (error) {
                return;
            }
            var addData = {
                "url": location.href,
                "id": saveID,
                "hash": this._checkOriginalMapString,
                "image": gameCvs.toDataURL(),
                "data": quickSaveData,
                "date": date
            };
            var reqAdd = store.put(addData);
            //reqAdd.callbackLog = callback;
            reqAdd.onsuccess = (e) => {
                this.selectDatas[saveID] = addData;
            };
            reqAdd.onerror = (e) => {
            };
        };
        reqOpen.onerror = (e) => {
        };
        reqOpen.onblocked = (e) => {
        };
    }
    private static selectSaveData() {
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
                transaction = indexedDBSystem.transaction(this.INDEXEDDB_TABLE_NAME, this.IDBTransaction["READ_ONLY"]);
                store = transaction.objectStore(this.INDEXEDDB_TABLE_NAME);
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
                var i, len, loadend, onsuccess, onerror;
                loadend = 0;
                var result = e.target.result;
                len = result.length;
                for (i = 0; i < len; i++) {
                    var saveData = result[i];
                    if (this._checkOriginalMapString !== saveData.hash) {
                        continue;
                    }
                    this.selectDatas[saveData.id] = saveData;
                }
                this._messageWindow.dbSaveDataLoad(this.selectDatas);
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
