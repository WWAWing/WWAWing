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
                            addValue = newValue - oldValue - 1;//�ϓ��l��0�͎g���Ȃ����߁A1�Ō��Z���Ė��ʂ��폜
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
                        addValue = newValue - oldValue - 1;//�ϓ��l��0�͎g���Ȃ����߁A1�Ō��Z���Ė��ʂ��폜
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
                var saveListTest = [];
                oldValue = -1;

                //�e�[�u������z����ɕϊ�
                var usingUint8Flag: boolean = false;
                for (idText in saveObject) {
                    newValue = Number(idText);
                    addValue = newValue - oldValue - 1;
                    oldValue = newValue;
                    /*usingUint8Flag = false;
                    if (this._usingByteFlag) {
                        //�o�C�i����
                        saveObject[idText] = this.compressUint8Array(newValue, saveObject[idText], wwaObject);
                        if (saveObject[idText] instanceof Uint8Array) {
                            usingUint8Flag = true;
                        }
                    }
                    if (!usingUint8Flag) {
                        saveListTest.push(addValue, saveObject[idText]);
                    }*/
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
     * JSON�������Ƃ��̕�����̒����ɂ�蔻�肵�A���򂷂�B
     * bit�P�ʂŃt���O�Ǘ����A�}�b�v�S�̂̒ʍs�����i�[��������ɕϊ��B
     * �ŏ���0�̗���̓o�C�i���f�[�^����������A���l���i�[���ċl�߂�B
     * �g�p����Ă���p�[�c��index�z��ɓo�^���A�g�p�����Ƀ\�[�g����B
     * �t���O�̐������z�u����p�[�c��index��z��Ɋi�[����B
     * @param wwaObject
     * @param restartObject
     */
    private static compressMapAllObject(wwaObject: object, restartObject: object, firstRandomMapObjectUtf8Array: Uint8Array): object {
        var saveObject: object, mapY: object, restartMapY: object, writeMapY: object;
        var x: number, y: number, bit: number, position: number, idText: string, lastPosition: number, count: number, id: number;
        var mapWidth: number = this._restartData.mapWidth;
        var oldID: number, idList: Array<number>, indexList: Array<number>, compressClassList: Array<WWACompressIndexTable>, indexText: string, indexTable: object, idClassTable: object, index: number, indexCount: number;
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
                        //0�ł͂Ȃ��o�C�g�J�n�ʒu���擾
                        startIndex = position;
                    }

                    //�r�b�g�P�ʂō��W�����݂��邩���L�^
                    uint8Array[position] = uint8Array[position] | (1 << bit);

                    //�Ō�̃r�b�g�Ƃ��Đݒ�
                    lastPosition = position;

                    //���̍��W��ID���擾
                    if (idClassTable[id] === undefined) {
                        idClassTable[id] = new WWACompressIndexTable(id, indexCount++);
                    }

                    //���̍��W��ID�̗��p�񐔂����Z
                    idClassTable[id].count++;
                }
                bit++;
                if (bit === 8) {
                    bit = 0;
                    position++;
                }
            }
        }
        //�e�[�u����z��ɕϊ�
        for (idText in idClassTable) {
            index = idClassTable[idText].index;
            compressClassList[index] = idClassTable[idText];
        }

        //ID���Ƃ̗��p�񐔏��ɕ��ёւ�
        compressClassList.sort(this.idSort);

        indexTable = {};
        oldID = -1;
        //Index�z��𐶐�����B�g�p�񐔂��������Ɋi�[����
        for (indexText in compressClassList) {
            id = compressClassList[indexText].id;
            indexTable[id] = Number(indexText);

            idList[indexText] = id;
            oldID = id;
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
                        //0�ł͂Ȃ��o�C�g�J�n�ʒu���擾
                        startIndex = position;
                    }
                    //�Ō�̃r�b�g�Ƃ��Đݒ�
                    lastPosition = position;
                }
            }
            if (startIndex === -1) {
                //�f�[�^�Ȃ�
                startIndex = 0;
                lastPosition = 0;
            }
        }

        return [startIndex, uint8Array.subarray(startIndex, lastPosition + 1), idList, this.indexListCompress(indexList, idList.length)];
    }
    private static indexListCompress(indexList: Array<number>, idLength: number): Array<number> {
        var newIndexList: Array<number> = [];
        var i: number, n: number, s: number, len: number, index: number, indexLog: number, nextIndex: number, repeatCount: number;
        len = indexList.length;
        indexLog = -1;
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
     * ��ΐ��l���������z����A���ΐ��l���������z��ɕϊ�����
     * @param list
     */
    private static getCompressArray(list: number[]): number[] {
        var newList: number[] = [];
        var oldValue: number, addValue: number, newValue: number, i: number, len: number;
        var k: number, loopCount: number, n: number;
        //0�͘A���l�̃t���O�Ƃ��Ďg�p���邽�߁A�����l��-1�ɂ���
        //0���W��addValue��1�ɂȂ�悤�ɂ���
        oldValue = -1;
        len = list.length;
        for (k = 0, i = 0; i < len; i++) {
            newValue = list[i];
            addValue = newValue - oldValue;
            loopCount = 0;
            n = i;
            while ((n < len - 1) && (list[n] + 1 === list[n + 1])) {
                //�A�����Ēl��1�������Ă��鐔���擾
                n++;
                loopCount++;
            }
            if (loopCount < this.MIN_LOOP_COUNT) {
                //�A�����Ēl��1�������Ă���񐔂��Œ჋�[�v�񐔈ȉ��̏ꍇ�A
                //1�ϐ��ŕێ����������y������1�Âi�[
                newList[k++] = addValue;
            } else {
                i = n;
                newValue += loopCount;
                //�ŏ��̐��l���t���O����p��0�ɂ��āA���[�v�񐔂��i�[�B
                //���[�v�񐔂�3�񖢖��ɂȂ�Ȃ����߁A�l����Œ჋�[�v�񐔂�����
                newList[k++] = 0;
                newList[k++] = addValue;
                newList[k++] = loopCount - this.MIN_LOOP_COUNT;
            }
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
        var lastValue: number, k: number;
        oldValue = -1;//�����l��-1�ɂ��邱�ƂŁA0���W�ł��l��0�ɂȂ�Ȃ��悤�ɂ���
        len = list.length;
        for (i = 0, k = 0; i < len; i++) {
            addValue = list[i];
            if (addValue === 0) {
                //�A������1��������z�񂪑���
                addValue = list[++i];
                newValue = oldValue + addValue;//�������l�����ΐ��l���Z�o
                lastValue = newValue + list[++i] + this.MIN_LOOP_COUNT;//�ϐ�����Œ჋�[�v�񐔂����Z���A���[�v�񐔂��Z�o
                for (; newValue <= lastValue; newValue++) {
                    newList[k++] = newValue;
                }
                oldValue = lastValue;
            } else {
                //���̐��l���i�[
                newValue = oldValue + addValue;//�������l�����ΐ��l���Z�o
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
                if (len === 4) {
                    if ((typeof loadArray[0] === "number") && ((loadArray[1] instanceof Uint8Array) || (loadArray[1] instanceof Array)) && (loadArray[2] instanceof Array) && (loadArray[3] instanceof Array)) {
                        this.decompressAllMapObject(loadArray, newObject, this._firstRandomMapObjectUtf8Table[key]);
                        return newObject;
                    }
                }
                //�z�񂩂畨��ID�E�w�iID�e�[�u���ɕϊ�
                for (i = 0; i < len; i += 2) {
                    addValue = Number(loadArray[i]);
                    newValue = oldValue + addValue + 1;//�ϓ��l��0�͎g���Ȃ����߁A1�ŉ��Z���Ė��ʂ��폜
                    oldValue = newValue;

                    id = newValue;

                    saveObject[newValue] = loadArray[i + 1];
                }
                var idTableX, idTableY;
                for (idText in saveObject) {
                    id = Number(idText);

                    loadArray = <object[]>saveObject[idText];
                    /*if (this.decompressUint8Array(id, loadArray, newObject)) {
                        //�o�C�g�f�[�^�ł���ꍇ�͏�������Ŗ߂�
                        continue;
                    }*/
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
                        newValue = oldValue + addValue + 1;//�ϓ��l��0�͎g���Ȃ����߁A1�ŉ��Z���Ė��ʂ��폜
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
                        newValue = oldValue + addValue + 1;//�ϓ��l��0�͎g���Ȃ����߁A1�ŉ��Z���Ė��ʂ��폜
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
        var saveObject: object, mapY: object, restartMapY: object, writeMapY: object;
        var x: number, y: number, id: number, bit: number, position: number, idText: string, lastPosition: number, count: number, id: number;
        var mapWidth: number = this._restartData.mapWidth;
        var oldID: number, loadIndexList: Array<number>, indexList: Array<number>, idList: Array<number>, index: number, indexCount: number;
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
        lastPosition = 0;
        count = 0;
        indexCount = 0;
        len = uint8Array.length;
        for (position = 0; position < len; position++) {
            for (bit = 0; bit < 8; bit++) {
                if ((uint8Array[position] & (1 << bit)) !== 0) {
                    //�ݒu���Ă���
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
        var saveObject: object, mapY: object, restartMapY: object, writeMapY: object;
        var x: number, y: number, bit: number, position: number, lastPosition: number, count: number, id: number;
        var mapWidth: number = this._restartData.mapWidth;
        var indexCount: number;
        var uint8Array: Uint8Array = new Uint8Array(this._mapByteLength);
        var startIndex: number = -1;
        bit = 0;
        position = 0;
        lastPosition = 0;
        count = 0;
        indexCount = 0;
        for (y = 0; y < mapWidth; y++) {
            for (x = 0; x < mapWidth; x++) {
                if (wwaObject[y][x] !== restartObject[y][x]) {

                    if (startIndex === -1) {
                        //0�ł͂Ȃ��o�C�g�J�n�ʒu���擾
                        startIndex = position;
                    }

                    //�r�b�g�P�ʂō��W�����݂��邩���L�^
                    uint8Array[position] = uint8Array[position] | (1 << bit);

                    //�Ō�̃r�b�g�Ƃ��Đݒ�
                    lastPosition = position;
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
                wwaData = this.decompress(resumeSaveData);
                if (wwaData) {
                    return wwaData;
                }
            } catch (e) {

            }
        }
        return this._restartData;
    }
    /**
     * WWA COLLECTION���������B
     * �o�C�i���f�[�^�ۑ��p��Uint8Array�̕ۑ������𕹗p����B
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