import {
    WWAData
} from "../wwa_data";

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

export class FirstChangedMapUint8Table {
    public map: Uint8Array;
    public mapObject: Uint8Array;
}

export default class WWACompress {
    private static _usingByteFlag = false;
    private static MIN_LOOP_COUNT = 3;
    private static _restartData: WWAData = void 0;
    private static _mapByteLength: number = 0;
    private static _firstRandomMapObjectUtf8Table: FirstChangedMapUint8Table = new FirstChangedMapUint8Table();
    /**
     * セーブデータを圧縮し、圧縮後のオブジェクトデータを返します。
     * @param wwaData
     * @todo 圧縮データの型情報を作成する
     */
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
                    // 通常、初期データと変化のない値は保存対象外だが、ワールド名はロード可能判定に使うので保存対象
                    if (this._restartData[key] === value && key !== "worldName") {
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
        var saveObject: object, mapY: number[], restartMapY: number[], writeMapY: object;
        switch (key) {
            // マップ (2次元配列)
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
                    // 物体・背景IDごとにテーブルを作り、そこに座標情報を保存する。
                    // Y座標を添え字にしてX座標を配列に格納。同じY座標に存在するX座標を抽出。
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
                // Y座標情報の整理
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
                            // Y座標に対し、X座標が一つしか存在しないため、
                            // X座標を添え字にしてY座標を配列に格納。同じX座標に存在するY座標を抽出。
                            x_number = xList[0];
                            if (idTableX[x_number] === undefined) {
                                idTableX[x_number] = [];
                            }

                            yList = idTableX[x_number];
                            yList.push(Number(y));
                        } else {
                            // Y座標に存在する座標が複数あったため、データの格納を行う

                            // 一つ前のY座標と比較し、Y座標の相対数値を抽出
                            newValue = Number(y);
                            addValue = newValue - oldValue - 1; // 変動値に0は使われないため、1で減算して無駄を削除
                            oldValue = newValue;

                            // X座標の配列を相対座標の配列に変換して格納
                            saveObject[idText].push(this.getCompressArray(xList), addValue);
                        }
                    }
                }
                // X座標情報の整理
                for (idText in allIdTableX) {
                    id = Number(idText);
                    idTableX = allIdTableX[idText];

                    oldValue = -1;
                    for (x in idTableX) {
                        yList = idTableX[x];

                        // 一つ前のX座標と比較し、X座標の相対数値を抽出
                        newValue = Number(x);
                        addValue = newValue - oldValue - 1; // 変動値に0は使われないため、1で減算して無駄を削除
                        oldValue = newValue;
                        if ((yList.length === 1)) {
                            // X座標とY座標それぞれ独立していて重複なし。
                            saveObject[idText].push(addValue, yList[0]);
                        } else {
                            // Y座標に存在する座標が複数あったため、データの格納を行う
                            // Y座標の配列を相対座標の配列に変換して格納
                            saveObject[idText].push(addValue, this.getCompressArray(yList));
                        }
                    }
                }
                var saveList = [];
                oldValue = -1;

                // テーブル情報を配列情報に変換
                for (idText in saveObject) {
                    newValue = Number(idText);
                    addValue = newValue - oldValue - 1;
                    oldValue = newValue;
                    saveList.push(addValue, saveObject[idText]);
                }
                if (this._usingByteFlag) {
                    if (JSON.stringify(saveList).length >= this._mapByteLength) {
                        return this.compressMapAllObject(wwaObject, restartObject, this._firstRandomMapObjectUtf8Table[key]);
                    }
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
     * JSON化したときの文字列の長さにより判定し、分岐する。
     * bit単位でフラグ管理し、マップ全体の通行情報を格納する方式に変換。
     * 最初の0の羅列はバイナリデータから消去し、数値を格納して詰める。
     * 使用されているパーツをindex配列に登録し、使用数順にソートする。
     * フラグの数だけ配置するパーツのindexを配列に格納する。
     * @param wwaObject
     * @param restartObject
     */
    private static compressMapAllObject(wwaObject: object, restartObject: object, firstRandomMapObjectUtf8Array: Uint8Array): object {
        var x: number, y: number, bit: number, position: number, idText: string, lastPosition: number, count: number, id: number;
        var mapWidth: number = this._restartData.mapWidth;
        var idList: Array<number>, indexList: Array<number>, compressClassList: Array<WWACompressIndexTable>, indexText: string, indexTable: object, idClassTable: object, index: number, indexCount: number;
        var uint8Array: Uint8Array = new Uint8Array(this._mapByteLength);
        var startIndex: number = -1;
        var len: number;
        bit = 0;
        position = 0;
        lastPosition = 0;
        count = 0;
        indexCount = 0;
        compressClassList = [];
        idClassTable = {};
        idList = [];
        indexList = [];
        for (y = 0; y < mapWidth; y++) {
            for (x = 0; x < mapWidth; x++) {
                id = wwaObject[y][x];
                if (id !== restartObject[y][x]) {

                    if (startIndex === -1) {
                        // 0ではないバイト開始位置を取得
                        startIndex = position;
                    }

                    // ビット単位で座標が存在するかを記録
                    uint8Array[position] = uint8Array[position] | (1 << bit);

                    // 最後のビットとして設定
                    lastPosition = position;

                    // その座標のIDを取得
                    if (idClassTable[id] === undefined) {
                        idClassTable[id] = new WWACompressIndexTable(id, indexCount++);
                    }

                    // その座標のIDの利用回数を加算
                    idClassTable[id].count++;
                }
                bit++;
                if (bit === 8) {
                    bit = 0;
                    position++;
                }
            }
        }
        // テーブルを配列に変換
        for (idText in idClassTable) {
            index = idClassTable[idText].index;
            compressClassList[index] = idClassTable[idText];
        }

        // IDごとの利用回数順に並び替え
        compressClassList.sort(this.idSort);

        indexTable = {};
        // Index配列を生成する。使用回数が多い順に格納する
        for (indexText in compressClassList) {
            id = compressClassList[indexText].id;
            indexTable[id] = Number(indexText);

            idList[indexText] = id;
        }

        //
        for (y = 0; y < mapWidth; y++) {
            for (x = 0; x < mapWidth; x++) {
                id = wwaObject[y][x];
                if (id !== restartObject[y][x]) {
                    indexList[count++] = indexTable[id];
                }
            }
        }
        if (firstRandomMapObjectUtf8Array) {
            len = uint8Array.length;
            startIndex = -1;
            lastPosition = 0;
            for (position = 0; position < len; position++) {
                uint8Array[position] = uint8Array[position] & (~firstRandomMapObjectUtf8Array[position]);
                if (uint8Array[position] !== 0) {
                    if (startIndex === -1) {
                        // 0ではないバイト開始位置を取得
                        startIndex = position;
                    }
                    // 最後のビットとして設定
                    lastPosition = position;
                }
            }
            if (startIndex === -1) {
                // データなし
                startIndex = 0;
                lastPosition = 0;
            }
        }

        return [startIndex, uint8Array.subarray(startIndex, lastPosition + 1), idList, this.indexListCompress(indexList, idList.length)];
    }
    private static indexListCompress(indexList: Array<number>, idLength: number): Array<number> {
        var newIndexList: Array<number> = [];
        var i: number, n: number, s: number, len: number, index: number, nextIndex: number, repeatCount: number;
        len = indexList.length;
        n = 0;
        for (i = 0; i < len; i++) {
            index = indexList[i];
            repeatCount = 0;
            for (s = i + 1; s < len; s++) {
                nextIndex = indexList[s];
                if (index === nextIndex) {
                    repeatCount++;
                    i = s;
                } else {
                    break;
                }
            }
            switch (repeatCount) {
                case 0:
                    newIndexList[n++] = index;
                    break;
                case 1:
                    newIndexList[n++] = index;
                    newIndexList[n++] = index;
                    break;
                default:
                    newIndexList[n++] = index;
                    newIndexList[n++] = idLength + repeatCount;
                    break;
            }
        }

        return newIndexList;
    }
    private static idSort(a: WWACompressIndexTable, b: WWACompressIndexTable): number {
        return b.count - a.count;
    }

    /**
     * 絶対数値を示した配列を、相対数値を示した配列に変換する
     * @param list
     */
    private static getCompressArray(list: number[]): number[] {
        var newList: number[] = [];
        var oldValue: number, addValue: number, newValue: number, i: number, len: number;
        var k: number, loopCount: number, n: number;
        // 0は連続値のフラグとして使用するため、初期値を-1にして
        // 0座標のaddValueを1になるようにする
        oldValue = -1;
        len = list.length;
        for (k = 0, i = 0; i < len; i++) {
            newValue = list[i];
            addValue = newValue - oldValue;
            loopCount = 0;
            n = i;
            while ((n < len - 1) && (list[n] + 1 === list[n + 1])) {
                // 連続して値が1ずつ増えている数を取得
                n++;
                loopCount++;
            }
            if (loopCount < this.MIN_LOOP_COUNT) {
                // 連続して値が1ずつ増えている回数が最低ループ回数以下の場合、
                // 1変数で保持した方が軽いため1つづつ格納
                newList[k++] = addValue;
            } else {
                i = n;
                newValue += loopCount;
                // 最初の数値をフラグ判定用に0にして、ループ回数を格納。
                // ループ回数は3回未満にならないため、値から最低ループ回数を引く
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
        var lastValue: number, k: number;
        oldValue = -1;// 初期値を-1にすることで、0座標でも値が0にならないようにする
        len = list.length;
        for (i = 0, k = 0; i < len; i++) {
            addValue = list[i];
            if (addValue === 0) {
                // 連続して1ずつ増える配列が存在
                addValue = list[++i];
                newValue = oldValue + addValue; // 増加数値から絶対数値を算出
                lastValue = newValue + list[++i] + this.MIN_LOOP_COUNT; // 変数から最低ループ回数を加算し、ループ回数を算出
                for (; newValue <= lastValue; newValue++) {
                    newList[k++] = newValue;
                }
                oldValue = lastValue;
            } else {
                // その数値を格納
                newValue = oldValue + addValue; // 増加数値から絶対数値を算出
                newList[k++] = newValue;
                oldValue = newValue;
            }
        }
        return newList;
    }
    public static decompress(saveObject: object): [WWAData, {isWorldNameEmpty: boolean}] {
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
        return [newData, {isWorldNameEmpty: (saveObject as WWAData).worldName === undefined}];
    }
    private static decompressObject(key: string, loadObject: object, newObject: object): object {
        var saveObject: object;
        var key: string;
        switch (key) {
            case SAVE_COMPRESS_ID.MAP:
            case SAVE_COMPRESS_ID.MAP_OBJECT:
                var newValue: number, oldValue: number, addValue: number, x: string, y: string, id: number, idText: string;

                saveObject = {};

                oldValue = -1;
                var i, len;
                var loadArray: object[] = <object[]>loadObject;
                len = loadArray.length;
                if (len === 4) {
                    if ((typeof loadArray[0] === "number") && ((loadArray[1] instanceof Uint8Array) || (loadArray[1] instanceof Array)) && (loadArray[2] instanceof Array) && (loadArray[3] instanceof Array)) {
                        this.decompressAllMapObject(loadArray, newObject, this._firstRandomMapObjectUtf8Table[key]);
                        return newObject;
                    }
                }
                // 配列から物体ID・背景IDテーブルに変換
                for (i = 0; i < len; i += 2) {
                    addValue = Number(loadArray[i]);
                    newValue = oldValue + addValue + 1; // 変動値に0は使われないため、1で加算して無駄を削除
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

                    // 配列からX、Y配列を抽出
                    for (i = 0; i < len; i += 2) {

                        var xData = loadArray[i];
                        var yData = loadArray[i + 1];
                        if (xData instanceof Array) {
                            // X座標配列の場合、配列を相対配列から絶対配列に変換
                            xData = this.getDecompressArray(xData);
                        }
                        if (yData instanceof Array) {
                            // X座標配列の場合、配列を絶対配列から相対配列に変換
                            yData = this.getDecompressArray(yData);
                        }
                        if (typeof xData === "object") {
                            // X配列として処理
                            idTableX.push({ x: xData, y: yData });
                        } else {
                            // Y配列として処理
                            idTableY.push({ x: xData, y: yData });
                        }
                    }

                    var code: string;

                    // X座標情報をベースとした配列を探索
                    oldValue = -1;
                    for (code in idTableX) {
                        // 相対数値から絶対数値のY座標に変換
                        addValue = Number(idTableX[code].y);
                        newValue = oldValue + addValue + 1; // 変動値に0は使われないため、1で加算して無駄を削除
                        oldValue = newValue;
                        xData = idTableX[code].x;
                        y = String(newValue);

                        if (xData instanceof Array) {
                            // X座標情報が配列
                            loadArray = <object[]>xData;
                            len = loadArray.length;
                            for (i = 0; i < len; i++) {
                                x = String(loadArray[i]);
                                newObject[y][x] = id;
                            }
                        } else {
                            // X座標情報が数値
                            // ※本来この処理は実行されないが念のために記述
                            x = String(xData);
                            newObject[y][x] = id;
                        }
                    }

                    // Y座標情報をベースとした配列を探索
                    oldValue = -1;
                    for (code in idTableY) {
                        // 相対数値から絶対数値のX座標に変換
                        addValue = Number(idTableY[code].x);
                        newValue = oldValue + addValue + 1; // 変動値に0は使われないため、1で加算して無駄を削除
                        oldValue = newValue;
                        yData = idTableY[code].y;
                        x = String(newValue);

                        if (yData instanceof Array) {
                            // Y座標情報が配列
                            loadArray = <object[]>yData;
                            len = loadArray.length;
                            for (i = 0; i < len; i++) {
                                y = String(loadArray[i]);
                                newObject[y][x] = id;
                            }
                        } else {
                            // Y座標情報が数値
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
    private static decompressAllMapObject(loadArray: object, newObject: object,firstRandomMapObjectUtf8Array: Uint8Array): boolean {
        var x: number, y: number, id: number, bit: number, position: number, count: number, id: number;
        var mapWidth: number = this._restartData.mapWidth;
        var loadIndexList: Array<number>, indexList: Array<number>, idList: Array<number>, index: number, indexCount: number;
        var uint8Array: Uint8Array = new Uint8Array(this._mapByteLength);
        var x: number, y: number, bit: number, position: number, len: number, count: number;

        var startIndex: number = 0;
        startIndex = loadArray[0];
        idList = loadArray[2];
        loadIndexList = loadArray[3];
        var uintCopy8Array: Uint8Array = <Uint8Array>loadArray[1];
        uint8Array.set(uintCopy8Array, startIndex);
        if (firstRandomMapObjectUtf8Array) {
            len = uint8Array.length;
            for (position = 0; position < len; position++) {
                uint8Array[position] = uint8Array[position] | firstRandomMapObjectUtf8Array[position];
            }
        }
        indexList = [];
        var idLength: number = idList.length;
        var len: number, i: number, n: number, repeatCount: number, k: number, indexLog: number;
        len = loadIndexList.length;
        for (i = 0, n = 0; i < len; i++) {
            index = loadIndexList[i];
            if (index >= idLength) {
                repeatCount = index - idLength;
                for (k = 0; k < repeatCount; k++) {
                    indexList[n++] = indexLog;
                }
            } else {
                indexList[n++] = index;
            }
            indexLog = index;
        }

        bit = 0;
        position = 0;
        count = 0;
        indexCount = 0;
        len = uint8Array.length;
        for (position = 0; position < len; position++) {
            for (bit = 0; bit < 8; bit++) {
                if ((uint8Array[position] & (1 << bit)) !== 0) {
                    // 設置している
                    index = indexList[indexCount++];
                    if (index === undefined) {
                        return false;
                    }
                    id = idList[index];
                    x = count % mapWidth;
                    y = (count / mapWidth) | 0;
                    newObject[y][x] = id;

                }
                count++;
            }
        }

        return true;
    }

    public static setRestartData(restartData: WWAData, firstFrameData: WWAData) {
        this._restartData = restartData;
        this._mapByteLength = Math.ceil(restartData.mapWidth * restartData.mapWidth / 8);
        this._firstRandomMapObjectUtf8Table[SAVE_COMPRESS_ID.MAP_OBJECT] = this.getChangedUint8Array(firstFrameData[SAVE_COMPRESS_ID.MAP_OBJECT], restartData[SAVE_COMPRESS_ID.MAP_OBJECT]);
    }

    private static getChangedUint8Array(wwaObject: object, restartObject: object): Uint8Array {
        var x: number, y: number, bit: number, position: number;
        var mapWidth: number = this._restartData.mapWidth;
        var uint8Array: Uint8Array = new Uint8Array(this._mapByteLength);
        var startIndex: number = -1;
        bit = 0;
        position = 0;
        for (y = 0; y < mapWidth; y++) {
            for (x = 0; x < mapWidth; x++) {
                if (wwaObject[y][x] !== restartObject[y][x]) {

                    if (startIndex === -1) {
                        // 0ではないバイト開始位置を取得
                        startIndex = position;
                    }

                    // ビット単位で座標が存在するかを記録
                    uint8Array[position] = uint8Array[position] | (1 << bit);

                }
                bit++;
                if (bit === 8) {
                    bit = 0;
                    position++;
                }
            }
        }
        return uint8Array;
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
                [wwaData] = this.decompress(resumeSaveData);
                if (wwaData) {
                    return wwaData;
                }
            } catch (e) {

            }
        }
        return this._restartData;
    }
    /**
     * WWA COLLECTION向け処理。
     * バイナリデータ保存用のUint8Arrayの保存方式を併用する。
     * @param _usingByteFlag
     */
    public static usingByte(_usingByteFlag): void {
        this._usingByteFlag = _usingByteFlag;
    }
};

export class WWACompressIndexTable {
    public id: number = 0;
    public index: number = 0;
    public count: number = 0;
    public constructor(id: number, index: number) {
        this.id = id;
        this.index = index;
    }
}
