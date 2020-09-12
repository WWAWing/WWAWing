import { new2DArray } from "../../infra/util";
import { checkMapDataBroken } from "./checksum";
import { BytePosition } from "./constants";
import { WWAData } from "@wwawing/common-interface";
import { WWAConsts, PartsType, LoadStage, createDefaultWWAData, WWALoaderEventEmitter } from "../../infra";

export class WWADataExtractor {
  private wwaData: WWAData;
  private currentPosition: number;

  public constructor(
    private byteMapData: Uint8Array,
    byteMapLength: number,
    private eventEmitter: WWALoaderEventEmitter
  ) {
    checkMapDataBroken(byteMapData, byteMapLength);
    this.wwaData = createDefaultWWAData();
  }

  public extractAllData(): WWAData {
    var mapAttrMax: number, objAttrMax: number;
    this.wwaData.version = this.byteMapData[BytePosition.VERSION];
    this._extractInitialParameters();

    if (this.wwaData.version >= 29) {
      this.currentPosition = BytePosition.MAPDATA_TOP;
    } else {
      this.currentPosition = BytePosition.OLD_MAPDATA_TOP;
    }

    this.wwaData.map = this._getFieldDataFromBits(PartsType.MAP, this.wwaData.mapPartsMax).concat();

    this.wwaData.mapObject = this._getFieldDataFromBits(PartsType.OBJECT, this.wwaData.objPartsMax).concat();

    mapAttrMax = this.wwaData.version > 29 ? WWAConsts.MAP_ATR_MAX : WWAConsts.OLD_MAP_ATR_MAX;
    objAttrMax = this.wwaData.version > 29 ? WWAConsts.OBJ_ATR_MAX : WWAConsts.OLD_OBJ_ATR_MAX;

    this.wwaData.mapAttribute = this._getPartsDataFromBits(PartsType.MAP, this.wwaData.mapPartsMax, mapAttrMax).concat();
    this.wwaData.objectAttribute = this._getPartsDataFromBits(PartsType.OBJECT, this.wwaData.objPartsMax, objAttrMax).concat();

    //  下位互換拡張キャラクタ変換
    if (this.wwaData.version <= 29) {
      this._convertAttributeV2toV3(PartsType.MAP);
      this._convertAttributeV2toV3(PartsType.OBJECT);
   }

    this._replaceAllRandomObjects();

    return this.wwaData;
  }

  private _convertAttributeV2toV3(partsType: PartsType) {
    var partsMax: number;
    var attributeArray: number[][];
    var localGateIndex: number;
    if (partsType == PartsType.MAP) {
      partsMax = this.wwaData.mapPartsMax;
      attributeArray = this.wwaData.mapAttribute;
      localGateIndex = WWAConsts.MAP_LOCALGATE;
    } else if (partsType == PartsType.OBJECT) {
      partsMax = this.wwaData.objPartsMax;
      attributeArray = this.wwaData.objectAttribute;
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

  private _get1ByteNumber(index: number): number {
    return this.byteMapData[index];
  }

  private _get2BytesNumber(index: number): number {
    return this.byteMapData[index] + this.byteMapData[index + 1] * 0x100;
  }

  private _extractInitialParameters(): void {
    // 現行はこちら
    if (this.wwaData.version > 29) {
      this.wwaData.gameoverX = this._get2BytesNumber(BytePosition.GAMEOVER_X);
      this.wwaData.gameoverY = this._get2BytesNumber(BytePosition.GAMEOVER_Y);
      this.wwaData.playerX = this._get2BytesNumber(BytePosition.PLAYER_X);
      this.wwaData.playerY = this._get2BytesNumber(BytePosition.PLAYER_Y);
      this.wwaData.mapPartsMax = this._get2BytesNumber(BytePosition.MAP_COUNT);
      this.wwaData.objPartsMax = this._get2BytesNumber(BytePosition.OBJ_COUNT);
      this.wwaData.isOldMap = false;

      // 旧バージョン互換
    } else {
      this.wwaData.gameoverX = this._get1ByteNumber(BytePosition.OLD_GAMEOVER_X);
      this.wwaData.gameoverY = this._get1ByteNumber(BytePosition.OLD_GAMEOVER_Y);
      this.wwaData.playerX = this._get1ByteNumber(BytePosition.OLD_PLAYER_X);
      this.wwaData.playerY = this._get1ByteNumber(BytePosition.OLD_PLAYER_Y);
      this.wwaData.mapPartsMax = this._get1ByteNumber(BytePosition.OLD_MAP_COUNT);
      this.wwaData.objPartsMax = this._get1ByteNumber(BytePosition.OLD_OBJ_COUNT);
      this.wwaData.isOldMap = true;
    }
    this.wwaData.statusEnergyMax = this._get2BytesNumber(BytePosition.STATUS_ENERGY_MAX);
    this.wwaData.statusEnergy = this._get2BytesNumber(BytePosition.STATUS_ENERGY);
    this.wwaData.statusStrength = this._get2BytesNumber(BytePosition.STATUS_STRENGTH);
    this.wwaData.statusDefence = this._get2BytesNumber(BytePosition.STATUS_DEFENCE);
    this.wwaData.statusGold = this._get2BytesNumber(BytePosition.STATUS_GOLD);
    this._extractInitialItemData();
    this.wwaData.mapWidth = this._get2BytesNumber(BytePosition.MAP_SIZE);
    this.wwaData.messageNum = this._get2BytesNumber(BytePosition.MESSAGE_NUM);

    // 旧バージョン互換
    if (this.wwaData.version < 28) this.wwaData.mapWidth = 71;
    else if (this.wwaData.version <= 29) this.wwaData.mapWidth = 101;
  }

  private _extractInitialItemData(): void {
    const topIdx = this.wwaData.version > 29 ? BytePosition.ITEMBOX_TOP : BytePosition.OLD_ITEMBOX_TOP;

    this.wwaData.itemBox = new Array(WWAConsts.ITEMBOX_SIZE);
    for (let i = 0; i < WWAConsts.ITEMBOX_SIZE; i++) {
      this.wwaData.itemBox[i] = this._get1ByteNumber(topIdx + i);
    }
  }

  private _getFieldDataFromBits(partsType: PartsType, partsMax: number): number[][] {
    var x: number, y: number;
    var fieldArray: number[][];

    fieldArray = new2DArray(this.wwaData.mapWidth, this.wwaData.mapWidth);

    for (x = 0; x < this.wwaData.mapWidth; x++) {
      for (y = 0; y < this.wwaData.mapWidth; y++) {
        if (this.wwaData.version > 29) {
          fieldArray[x][y] = this._get2BytesNumber(this.currentPosition);
          this.currentPosition += 2;
        } else {
          fieldArray[x][y] = this._get1ByteNumber(this.currentPosition);
          this.currentPosition += 1;
        }
        if ((x * this.wwaData.mapWidth + y) % 200 === 0) {
          this.emitProgress(x * this.wwaData.mapWidth + y, this.wwaData.mapWidth * this.wwaData.mapWidth, partsType === PartsType.MAP ? LoadStage.MAP_LOAD : LoadStage.OBJ_LOAD);
        }
        // 範囲外のパーツ削除
        if (fieldArray[x][y] >= partsMax) {
          fieldArray[x][y] = 0;
        }
      }
    }
    this.emitProgress(this.wwaData.mapWidth * this.wwaData.mapWidth, this.wwaData.mapWidth * this.wwaData.mapWidth, partsType === PartsType.MAP ? LoadStage.MAP_LOAD : LoadStage.OBJ_LOAD);

    return fieldArray;
  }

  private _getPartsDataFromBits(partsType: PartsType, partsMax: number, attrMax: number): number[][] {
    var i: number, j: number;
    var partsData: number[][];
    partsData = new2DArray(partsMax, attrMax);

    for (i = 0; i < partsMax; i++) {
      for (j = 0; j < attrMax; j++) {
        if ((i * this.wwaData.mapWidth + j) % 200 === 0) {
          this.emitProgress(i * attrMax + j, partsMax * attrMax, partsType === PartsType.MAP ? LoadStage.MAP_ATTR : LoadStage.OBJ_ATTR);
        }
        if (j === WWAConsts.ATR_CROP1 || j === WWAConsts.ATR_CROP2) {
          partsData[i][j] = 0;
          this.currentPosition += 2;
          continue;
        }
        partsData[i][j] = this._get2BytesNumber(this.currentPosition);
        this.currentPosition += 2;
      }
    }
    this.emitProgress(partsMax * attrMax, partsMax * attrMax, partsType === PartsType.MAP ? LoadStage.MAP_ATTR : LoadStage.OBJ_ATTR);
    return partsData;
  }

  private _replaceAllRandomObjects(): void {
   this.emitProgress(this.wwaData.mapWidth * this.wwaData.mapWidth, this.wwaData.mapWidth * this.wwaData.mapWidth, LoadStage.RAND_PARTS);
  }

  private emitProgress(
    current: number,
    total: number,
    stage: LoadStage
  ): void {
     this.eventEmitter.dispatch("progress", { current, total, stage });
  }

}

