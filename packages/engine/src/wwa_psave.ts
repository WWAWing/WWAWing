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
                    //���́E�w�iID���ƂɃe�[�u�������A�����ɍ��W����ۑ�����B
                    //Y���W��Y�����ɂ���X���W��z��Ɋi�[�B����Y���W�ɑ��݂���X���W�𒊏o�B
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
                //Y���W���̐���
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
                            //Y���W�ɑ΂��AX���W����������݂��Ȃ����߁A
                            //X���W��Y�����ɂ���Y���W��z��Ɋi�[�B����X���W�ɑ��݂���Y���W�𒊏o�B
                            x_number = xList[0];
                            if (idTableX[x_number] === undefined) {
                                idTableX[x_number] = [];
                            }

                            yList = idTableX[x_number];
                            yList.push(Number(y));
                        } else {
                            //Y���W�ɑ��݂�����W���������������߁A�f�[�^�̊i�[���s��

                            //��O��Y���W�Ɣ�r���AY���W�̑��ΐ��l�𒊏o
                            newValue = Number(y);
                            addValue = newValue - oldValue - 1;
                            oldValue = newValue;

                            //X���W�̔z��𑊑΍��W�̔z��ɕϊ����Ċi�[
                            saveObject[idText].push(this.getCompressArray(xList), addValue);
                        }
                    }
                }
                //X���W���̐���
                for (idText in allIdTableX) {
                    id = Number(idText);
                    idTableX = allIdTableX[idText];

                    oldValue = -1;
                    for (x in idTableX) {
                        yList = idTableX[x];

                        //��O��X���W�Ɣ�r���AX���W�̑��ΐ��l�𒊏o
                        newValue = Number(x);
                        addValue = newValue - oldValue - 1;
                        oldValue = newValue;
                        if ((yList.length === 1)) {
                            //X���W��Y���W���ꂼ��Ɨ����Ă��ďd���Ȃ��B
                            saveObject[idText].push(addValue, yList[0]);
                        } else {
                            //Y���W�ɑ��݂�����W���������������߁A�f�[�^�̊i�[���s��
                            //Y���W�̔z��𑊑΍��W�̔z��ɕϊ����Ċi�[
                            saveObject[idText].push(addValue, this.getCompressArray(yList));
                        }
                    }
                }
                var saveList = [];
                oldValue = -1;

                //�e�[�u������z����ɕϊ�
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
     * ��ΐ��l���������z����A���ΐ��l���������z��ɕϊ�����
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
     * ���ΐ��l���������z����A��ΐ��l���������z��ɕϊ�����
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
                //�z�񂩂畨��ID�E�w�iID�e�[�u���ɕϊ�
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
                    
                    //�z�񂩂�X�AY�z��𒊏o
                    for (i = 0; i < len; i += 2) {

                        var xData = loadArray[i];
                        var yData = loadArray[i + 1];
                        var newData;
                        if (xData instanceof Array) {
                            //X���W�z��̏ꍇ�A�z��𑊑Δz�񂩂��Δz��ɕϊ�
                            xData = this.getDecompressArray(xData);
                        }
                        if (yData instanceof Array) {
                            //X���W�z��̏ꍇ�A�z����Δz�񂩂瑊�Δz��ɕϊ�
                            yData = this.getDecompressArray(yData);
                        }
                        if (typeof xData === "object") {
                            //X�z��Ƃ��ď���
                            idTableX.push({ x: xData, y: yData });
                        } else {
                            //Y�z��Ƃ��ď���
                            idTableY.push({ x: xData, y: yData });
                        }
                    }

                    var code: string;

                    //X���W�����x�[�X�Ƃ����z���T��
                    oldValue = -1;
                    for (code in idTableX) {
                        //���ΐ��l�����ΐ��l��Y���W�ɕϊ�
                        addValue = Number(idTableX[code].y);
                        newValue = oldValue + addValue + 1;
                        oldValue = newValue;
                        xData = idTableX[code].x;
                        y = String(newValue);

                        if (xData instanceof Array) {
                            //X���W��񂪔z��
                            loadArray = <object[]>xData;
                            len = loadArray.length;
                            for (i = 0; i < len; i++) {
                                x = String(loadArray[i]);
                                newObject[y][x] = id;
                            }
                        } else {
                            //X���W��񂪐��l
                            //���{�����̏����͎��s����Ȃ����O�̂��߂ɋL�q
                            x = String(xData);
                            newObject[y][x] = id;
                        }
                    }

                    //Y���W�����x�[�X�Ƃ����z���T��
                    oldValue = -1;
                    for (code in idTableY) {
                        //���ΐ��l�����ΐ��l��X���W�ɕϊ�
                        addValue = Number(idTableY[code].x);
                        newValue = oldValue + addValue + 1;
                        oldValue = newValue;
                        yData = idTableY[code].y;
                        x = String(newValue);

                        if (yData instanceof Array) {
                            //Y���W��񂪔z��
                            loadArray = <object[]>yData;
                            len = loadArray.length;
                            for (i = 0; i < len; i++) {
                                y = String(loadArray[i]);
                                newObject[y][x] = id;
                            }
                        } else {
                            //Y���W��񂪐��l
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
