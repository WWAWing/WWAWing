    import * as loader_wwa_data from "./wwa_data";
    import { util } from "./loader_util";
    import * as loader_core from "./loader_core";
    import { WWAData, WWAConsts, PartsType } from "./wwa_data";

    export class WWADataExtractor {
      // --- vars ---
      public static POS_CHECK = 0x00; //  0
      public static POS_VERSION = 0x02; //  2
      public static POS_OLD_MAP_COUNT = 0x03; //  3
      public static POS_OLD_OBJ_COUNT = 0x04; //  4
      public static POS_OLD_PLAYER_X = 0x05; //  5
      public static POS_OLD_PLAYER_Y = 0x06; //  6
      public static POS_STATUS_ENERGY = 0x0a; // 10
      public static POS_STATUS_STRENGTH = 0x0c; // 12
      public static POS_STATUS_DEFENCE = 0x0e; // 14

      public static POS_STATUS_GOLD = 0x10; // 16
      public static POS_OLD_GAMEOVER_X = 0x12; // 18
      public static POS_OLD_GAMEOVER_Y = 0x13; // 19
      public static POS_OLD_ITEMBOX_TOP = 0x14; // 20

      public static POS_STATUS_ENERGY_MAX = 0x20; // 32
      public static POS_MAP_COUNT = 0x22; // 34
      public static POS_OBJ_COUNT = 0x24; // 36
      public static POS_PLAYER_X = 0x26; // 38
      public static POS_PLAYER_Y = 0x28; // 40
      public static POS_GAMEOVER_X = 0x2a; // 42
      public static POS_GAMEOVER_Y = 0x2c; // 44
      public static POS_MAP_SIZE = 0x2e; // 46

      public static POS_MESSAGE_NUM = 0x30; // 48
      public static POS_ITEMBOX_TOP = 0x3c; // 60

      public static POS_MAPDATA_TOP = 0x5a; // 90
      public static POS_OLD_MAPDATA_TOP = 0x64; //100

      private _bitData: Uint8Array;
      private _wwaData: WWAData;
      private _currentPosition: number;

      // --- methods and constructors
      public constructor(data: Uint8Array) {
        this._bitData = data;
        this._wwaData = new WWAData();
      }

      public extractAllData(): void {
        var mapAttrMax: number, objAttrMax: number;
        this._wwaData.version = this._bitData[WWADataExtractor.POS_VERSION];
        this._extractInitialParameters();

        if (this._wwaData.version >= 29) {
          this._currentPosition = WWADataExtractor.POS_MAPDATA_TOP;
        } else {
          this._currentPosition = WWADataExtractor.POS_OLD_MAPDATA_TOP;
        }

        this._wwaData.map = this._getFieldDataFromBits(loader_wwa_data.PartsType.MAP, this._wwaData.mapPartsMax).concat();

        this._wwaData.mapObject = this._getFieldDataFromBits(loader_wwa_data.PartsType.OBJECT, this._wwaData.objPartsMax).concat();

        mapAttrMax = this._wwaData.version > 29 ? WWAConsts.MAP_ATR_MAX : WWAConsts.OLD_MAP_ATR_MAX;
        objAttrMax = this._wwaData.version > 29 ? WWAConsts.OBJ_ATR_MAX : WWAConsts.OLD_OBJ_ATR_MAX;

        this._wwaData.mapAttribute = this._getPartsDataFromBits(loader_wwa_data.PartsType.MAP, this._wwaData.mapPartsMax, mapAttrMax).concat();
        this._wwaData.objectAttribute = this._getPartsDataFromBits(loader_wwa_data.PartsType.OBJECT, this._wwaData.objPartsMax, objAttrMax).concat();

        //  下位互換拡張キャラクタ変換
        if (this._wwaData.version <= 29) {
          this._convertAttributeV2toV3(PartsType.MAP);
          this._convertAttributeV2toV3(PartsType.OBJECT);
          /*
                throw new Error(
                    "このバージョンのWWAには、現在対応しておりません。\n" +
                    "マップデータバージョン: " + (Math.floor(this._wwaData.version / 10)) + "." + ( this._wwaData.version % 10 ));
                 */
        }

        this._replaceAllRandomObjects();
      }

      private _convertAttributeV2toV3(partsType: PartsType) {
        var partsMax;
        var attributeArray;
        var localGateIndex;
        if (partsType == PartsType.MAP) {
          partsMax = this._wwaData.mapPartsMax;
          attributeArray = this._wwaData.mapAttribute;
          localGateIndex = WWAConsts.MAP_LOCALGATE;
        } else if (partsType == PartsType.OBJECT) {
          partsMax = this._wwaData.objPartsMax;
          attributeArray = this._wwaData.objectAttribute;
          localGateIndex = WWAConsts.OBJECT_LOCALGATE;
        } else {
          throw new Error("謎のパーツ種別が指定されました");
        }

        for (var j = 0; j < partsMax; j++) {
          for (var i = 9; i >= 0; i--) {
            var dataChara = attributeArray[j][20 + i * 2] & 0xff;
            var dataMode = attributeArray[j][20 + i * 2] >> 8;
            var x = attributeArray[j][20 + i * 2 + 1] & 0xff;
            var y = attributeArray[j][20 + i * 2 + 1] >> 8;
            if (x === 250) {
              x = 9000;
            } else if (x > 100) {
              x += 10000 - 160;
            }
            if (y === 250) {
              y = 9000;
            } else if (y > 100) {
              y += 10000 - 160;
            }
            attributeArray[j][20 + i * 4] = dataChara;
            attributeArray[j][20 + i * 4 + 3] = dataMode;
            attributeArray[j][20 + i * 4 + 1] = x;
            attributeArray[j][20 + i * 4 + 2] = y;
          }
          if (attributeArray[j][WWAConsts.ATR_TYPE] === localGateIndex) {
            if (attributeArray[j][WWAConsts.ATR_JUMP_X] > 100) {
              attributeArray[j][WWAConsts.ATR_JUMP_X] += 10000 - 160;
            }
            if (attributeArray[j][WWAConsts.ATR_JUMP_Y] > 100) {
              attributeArray[j][WWAConsts.ATR_JUMP_Y] += 10000 - 160;
            }
          }
        }
      }

      public getJSObject(): WWAData {
        return this._wwaData;
      }

      private _get1ByteNumber(index: number): number {
        return this._bitData[index];
      }

      private _get2BytesNumber(index: number): number {
        return this._bitData[index] + this._bitData[index + 1] * 0x100;
      }

      private _extractInitialParameters(): void {
        // 現行はこちら
        if (this._wwaData.version > 29) {
          this._wwaData.gameoverX = this._get2BytesNumber(WWADataExtractor.POS_GAMEOVER_X);
          this._wwaData.gameoverY = this._get2BytesNumber(WWADataExtractor.POS_GAMEOVER_Y);
          this._wwaData.playerX = this._get2BytesNumber(WWADataExtractor.POS_PLAYER_X);
          this._wwaData.playerY = this._get2BytesNumber(WWADataExtractor.POS_PLAYER_Y);
          this._wwaData.mapPartsMax = this._get2BytesNumber(WWADataExtractor.POS_MAP_COUNT);
          this._wwaData.objPartsMax = this._get2BytesNumber(WWADataExtractor.POS_OBJ_COUNT);
          this._wwaData.isOldMap = false;

          // 旧バージョン互換
        } else {
          this._wwaData.gameoverX = this._get1ByteNumber(WWADataExtractor.POS_OLD_GAMEOVER_X);
          this._wwaData.gameoverY = this._get1ByteNumber(WWADataExtractor.POS_OLD_GAMEOVER_Y);
          this._wwaData.playerX = this._get1ByteNumber(WWADataExtractor.POS_OLD_PLAYER_X);
          this._wwaData.playerY = this._get1ByteNumber(WWADataExtractor.POS_OLD_PLAYER_Y);
          this._wwaData.mapPartsMax = this._get1ByteNumber(WWADataExtractor.POS_OLD_MAP_COUNT);
          this._wwaData.objPartsMax = this._get1ByteNumber(WWADataExtractor.POS_OLD_OBJ_COUNT);
          this._wwaData.isOldMap = true;
        }
        this._wwaData.statusEnergyMax = this._get2BytesNumber(WWADataExtractor.POS_STATUS_ENERGY_MAX);
        this._wwaData.statusEnergy = this._get2BytesNumber(WWADataExtractor.POS_STATUS_ENERGY);
        this._wwaData.statusStrength = this._get2BytesNumber(WWADataExtractor.POS_STATUS_STRENGTH);
        this._wwaData.statusDefence = this._get2BytesNumber(WWADataExtractor.POS_STATUS_DEFENCE);
        this._wwaData.statusGold = this._get2BytesNumber(WWADataExtractor.POS_STATUS_GOLD);
        this._extractInitialItemData();
        this._wwaData.mapWidth = this._get2BytesNumber(WWADataExtractor.POS_MAP_SIZE);
        this._wwaData.messageNum = this._get2BytesNumber(WWADataExtractor.POS_MESSAGE_NUM);

        // 旧バージョン互換
        if (this._wwaData.version < 28) this._wwaData.mapWidth = 71;
        else if (this._wwaData.version <= 29) this._wwaData.mapWidth = 101;
      }

      private _extractInitialItemData(): void {
        var i;
        var topIdx = this._wwaData.version > 29 ? WWADataExtractor.POS_ITEMBOX_TOP : WWADataExtractor.POS_OLD_ITEMBOX_TOP;

        this._wwaData.itemBox = new Array(WWAConsts.ITEMBOX_SIZE);
        for (i = 0; i < WWAConsts.ITEMBOX_SIZE; i++) {
          this._wwaData.itemBox[i] = this._get1ByteNumber(topIdx + i);
        }
      }

      private _getFieldDataFromBits(partsType: loader_wwa_data.PartsType, partsMax: number): number[][] {
        var x: number, y: number;
        var fieldArray: number[][];

        fieldArray = util.new2DArray(this._wwaData.mapWidth, this._wwaData.mapWidth);

        for (x = 0; x < this._wwaData.mapWidth; x++) {
          for (y = 0; y < this._wwaData.mapWidth; y++) {
            if (this._wwaData.version > 29) {
              fieldArray[x][y] = this._get2BytesNumber(this._currentPosition);
              this._currentPosition += 2;
            } else {
              fieldArray[x][y] = this._get1ByteNumber(this._currentPosition);
              this._currentPosition += 1;
            }
            if ((x * this._wwaData.mapWidth + y) % 200 === 0) {
              loader_core.sendProgressToMainProgram(x * this._wwaData.mapWidth + y, this._wwaData.mapWidth * this._wwaData.mapWidth, partsType === loader_wwa_data.PartsType.MAP ? loader_wwa_data.LoadStage.MAP_LOAD : loader_wwa_data.LoadStage.OBJ_LOAD);
            }
            // 範囲外のパーツ削除
            if (fieldArray[x][y] >= partsMax) {
              fieldArray[x][y] = 0;
            }
          }
        }
        loader_core.sendProgressToMainProgram(this._wwaData.mapWidth * this._wwaData.mapWidth, this._wwaData.mapWidth * this._wwaData.mapWidth, partsType === loader_wwa_data.PartsType.MAP ? loader_wwa_data.LoadStage.MAP_LOAD : loader_wwa_data.LoadStage.OBJ_LOAD);

        return fieldArray;
      }

      private _getPartsDataFromBits(partsType: loader_wwa_data.PartsType, partsMax: number, attrMax: number): number[][] {
        var i: number, j: number;
        var partsData: number[][];
        partsData = util.new2DArray(partsMax, attrMax);

        for (i = 0; i < partsMax; i++) {
          for (j = 0; j < attrMax; j++) {
            if ((i * this._wwaData.mapWidth + j) % 200 === 0) {
              loader_core.sendProgressToMainProgram(i * attrMax + j, partsMax * attrMax, partsType === loader_wwa_data.PartsType.MAP ? loader_wwa_data.LoadStage.MAP_ATTR : loader_wwa_data.LoadStage.OBJ_ATTR);
            }
            if (j === WWAConsts.ATR_CROP1 || j === WWAConsts.ATR_CROP2) {
              partsData[i][j] = 0;
              this._currentPosition += 2;
              continue;
            }
            partsData[i][j] = this._get2BytesNumber(this._currentPosition);
            this._currentPosition += 2;
          }
        }
        loader_core.sendProgressToMainProgram(partsMax * attrMax, partsMax * attrMax, partsType === loader_wwa_data.PartsType.MAP ? loader_wwa_data.LoadStage.MAP_ATTR : loader_wwa_data.LoadStage.OBJ_ATTR);
        return partsData;
      }
      /*

        private _extractObjectPartsData(): void {

        }

        private _convertPartsDataToOldVersion(): void {

        }

        private _replaceRandomObjects(): void {

        }

        private _extractMessagesData(): void {

        }
*/

      private _replaceAllRandomObjects(): void {
        /*
           * // 廃止
            var x, y;
            var partsID, partsType;
            for (x = 0; x < this._wwaData.mapWidth; x++) {
                for (y = 0; y < this._wwaData.mapWidth; y++) {
                    partsID = this._wwaData.mapObject[x][y];
                    partsType =
                    this._wwaData.objectAttribute[partsID][WWAConsts.ATR_TYPE];
                    if (partsType === WWAConsts.OBJECT_RANDOM) {
                        this._replaceRandomObject(partsID, x, y);
                            loader_core.sendProgressToMainProgram(
                                x * this._wwaData.mapWidth + y, this._wwaData.mapWidth * this._wwaData.mapWidth,
                                loader_wwa_data.LoadStage.RAND_PARTS
                                );
                    }
                }
            }
            */
        loader_core.sendProgressToMainProgram(this._wwaData.mapWidth * this._wwaData.mapWidth, this._wwaData.mapWidth * this._wwaData.mapWidth, loader_wwa_data.LoadStage.RAND_PARTS);
      }

      private _replaceRandomObject(partsID: number, x: number, y: number): void {
        var randomNum: number = Math.floor(Math.random() * 10);
        var afterPartsID: number = this._wwaData.objectAttribute[partsID][10 + randomNum];

        if (afterPartsID >= this._wwaData.objPartsMax) {
          afterPartsID = 0;
        }
        this._wwaData.mapObject[x][y] = afterPartsID;
      }
    }

