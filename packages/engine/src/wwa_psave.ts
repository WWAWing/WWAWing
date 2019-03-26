import { WWAData } from "./wwa_data";

var SAVE_COMPRESS_ID = {
    MAP: "map",
    MAP_ATTERIVUTE: "mapAttribute",
    MAP_OBJECT: "mapObject",
    MAP_OBJECT_ATTIBUTE:"objectAttribute",
    MESSAGE: "message",
    SYSTEM_MESSAGE:"systemMessage"
};

export class WWACompress {
    public static _restartData: WWAData;
    public static compress(wwaData: WWAData): object {
        var saveObject: object = {};
        var key: string, value;
        for (key in wwaData) {
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
            case SAVE_COMPRESS_ID.MAP_ATTERIVUTE:
            case SAVE_COMPRESS_ID.MAP_OBJECT:
            case SAVE_COMPRESS_ID.MAP_OBJECT_ATTIBUTE:
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
                            addValue = newValue - oldValue - 1;
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
                        addValue = newValue - oldValue - 1;
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
            case SAVE_COMPRESS_ID.MESSAGE:
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
        oldValue = -1;
        newList.length = len = list.length;
        for (i = 0; i < len; i++) {
            newValue = list[i];
            addValue = newValue - oldValue - 1;
            newList[i] = addValue;
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
        oldValue = -1;
        newList.length = len = list.length;
        for (i = 0; i < len; i++) {
            addValue = list[i];
            newValue = oldValue + addValue + 1;
            oldValue = newValue;
            newList[i] = newValue;
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
        switch (key) {
            case SAVE_COMPRESS_ID.MAP:
            case SAVE_COMPRESS_ID.MAP_ATTERIVUTE:
            case SAVE_COMPRESS_ID.MAP_OBJECT:
            case SAVE_COMPRESS_ID.MAP_OBJECT_ATTIBUTE:
                var newValue: number, oldValue: number, addValue: number, x: string, y: string, x_number: number, y_number: number, id: number, allIdTableX: object, allIdTableY: object, idText: string, xList: number[], yList: number[];

                saveObject = {};

                oldValue = -1;
                var i, len;
                var loadArray: object[] = <object[]>loadObject;
                len = loadArray.length;
                //配列から物体ID・背景IDテーブルに変換
                for (i = 0; i < len;i+=2) {
                    addValue = Number(loadArray[i]);
                    newValue = oldValue + addValue + 1;
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
                        newValue = oldValue + addValue + 1;
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
                        newValue = oldValue + addValue + 1;
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
            case SAVE_COMPRESS_ID.MESSAGE:
            case SAVE_COMPRESS_ID.SYSTEM_MESSAGE:
                var key: string, value;
                for (key in loadObject) {
                    newObject[key] = value;
                }
                break;
            default:
                return newObject;
        }
        return newObject;
    } 

}
