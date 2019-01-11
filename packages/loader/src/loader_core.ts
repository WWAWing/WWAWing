import * as loader_wwa_data from "./wwa_data";
import { WWADataExtractor } from "./loader_extractor";
import { WWAConsts } from "./wwa_data";
import { sendToMain } from ".";
import { util } from "./loader_util";

export class DecodeResult {
  public mapData: Uint8Array;
  public extractEndPos: number;
  public constructor(mapData: Uint8Array, extractEndPos) {
    this.mapData = mapData;
    this.extractEndPos = extractEndPos;
  }
}

export class WWALoader {
  public static MEM_BLOCK: number = 65000;
  public static EXT_LAST_PADDING: number = 3;
  public static OLDVER_MESSAGE_MAX: number = 400;

  private _fileName: string;
  private _dataExtractor: WWADataExtractor;
  private _dataJSObj: loader_wwa_data.WWAData;
  private _currentPos: number;
  private _srcData: Uint8Array;

  public constructor(fileName) {
    this._fileName = fileName;
  }

  public requestMapData(): void {
    var xhr: XMLHttpRequest = new XMLHttpRequest();
    try {
      xhr.open("GET", this._fileName, true);
      xhr.responseType = "arraybuffer";

      xhr.onreadystatechange = () => {
        try {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 304) {
              this.loadMapData(xhr.response);
              this.sendDataToMainProgram();
            } else if (xhr.status === 404) {
              throw new Error(
                "マップデータ「" +
                  this._fileName +
                  "」が見つかりませんでした。\n" +
                  "HTTPステータスコードは " +
                  xhr.status +
                  "です。"
              );
            } else if (xhr.status === 403) {
              throw new Error(
                "マップデータ「" +
                  this._fileName +
                  "」を読み取る権限がないようです。\n" +
                  "管理者の方へ: マップデータのパーミッションを確認してください。\n" +
                  "HTTPステータスコードは " +
                  xhr.status +
                  "です。"
              );
            } else {
              throw new Error(
                "マップデータ「" +
                  this._fileName +
                  "」の読み込みに失敗しました。\n" +
                  "HTTPステータスコードは " +
                  xhr.status +
                  "です。"
              );
            }
          }
        } catch (e) {
          this.sendErrorToMainProgram(e);
        }
      };
      xhr.send(null);
    } catch (e) {
      var error = new Error(
        "ロードエラー: ローカルテストの場合は、ブラウザが対応していない可能性があります。\n" +
          e.message
      );
      this.sendErrorToMainProgram(error);
    }
  }

  public loadMapData(data: any): void {
    try {
      this._srcData = new Uint8Array(data);
      var extResult: DecodeResult = this.decodeMapData();
      this._dataExtractor = new WWADataExtractor(extResult.mapData);
      this._dataExtractor.extractAllData();
      this._dataJSObj = this._dataExtractor.getJSObject();
      this._currentPos = extResult.extractEndPos;
    } catch (e) {
      throw e;
    }
    this._loadAllTextData();
  }

  private _loadAllTextData(): void {
    var i;
    //            if (this._srcData[WWADataExtractor.POS_VERSION] >= 30) {
    if (this._dataJSObj.version >= 30) {
      this._dataJSObj.worldPassword = this._getMessageFromData();
    }

    //            if (this._srcData[WWADataExtractor.POS_VERSION] <= 29) {
    if (this._dataJSObj.version <= 29) {
      this._dataJSObj.messageNum = WWALoader.OLDVER_MESSAGE_MAX;
    }

    this._dataJSObj.message = new Array(this._dataJSObj.messageNum);
    for (i = 0; i < this._dataJSObj.message.length; i++) {
      this._dataJSObj.message[i] = this._getMessageFromData();
      if (i % 200 === 0) {
        sendProgressToMainProgram(
          i,
          this._dataJSObj.message.length,
          loader_wwa_data.LoadStage.MESSAGE
        );
      }
    }

    // システムメッセージが足りない時対策
    while (this._dataJSObj.messageNum < 10) {
      this._dataJSObj.message.push("");
      this._dataJSObj.messageNum++;
    }
    sendProgressToMainProgram(
      this._dataJSObj.message.length,
      this._dataJSObj.message.length,
      loader_wwa_data.LoadStage.MESSAGE
    );

    this._dataJSObj.worldName = this._getMessageFromData();
    //            if (this._srcData[WWADataExtractor.POS_VERSION] <= 29) {
    if (this._dataJSObj.version <= 29) {
      this._dataJSObj.worldPassword = this._getMessageFromData();
    } else {
      this._getMessageFromData();
    }
    if (this._dataJSObj.worldPassword === "") {
      this._dataJSObj.worldPassNumber = 0;
    } else {
      //                if (this._srcData[WWADataExtractor.POS_VERSION] >= 29) {
      if (this._dataJSObj.version >= 29) {
        this._dataJSObj.worldPassNumber =
          (parseInt(this._dataJSObj.worldPassword) / 10 - 1197) / 17 - 2357;
      } else {
        this._dataJSObj.worldPassNumber = parseInt(
          this._dataJSObj.worldPassword
        );
      }
    }
    this._dataJSObj.charCGName = this._getMessageFromData();
    this._dataJSObj.mapCGName = this._getMessageFromData();
    this._dataJSObj.systemMessage = new Array(WWAConsts.SYSTEM_MESSAGE_NUM);
    for (i = 0; i < WWAConsts.SYSTEM_MESSAGE_NUM; i++) {
      if (this._dataJSObj.version >= 30) {
        this._dataJSObj.systemMessage[i] = this._getMessageFromData();
      } else {
        this._dataJSObj.systemMessage[i] = "";
      }
    }
    this._dataJSObj.yesnoImgPosX =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_YESNO_X;
    this._dataJSObj.yesnoImgPosY =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_YESNO_Y;
    this._dataJSObj.playerImgPosX =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_PLAYER_X;
    this._dataJSObj.playerImgPosY =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_PLAYER_Y;
    this._dataJSObj.clickableItemSignImgPosX =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_X;
    this._dataJSObj.clickableItemSignImgPosY =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_Y;
    this._dataJSObj.disableSaveFlag =
      loader_wwa_data.WWAConsts.DEFAULT_DISABLE_SAVE;
    this._dataJSObj.isOldMap = loader_wwa_data.WWAConsts.DEFAULT_OLDMAP;
    this._dataJSObj.objectNoCollapseDefaultFlag =
      loader_wwa_data.WWAConsts.DEFAULT_OBJECT_NO_COLLAPSE;
    this._dataJSObj.delPlayerFlag = false;
    this._dataJSObj.bgm = 0;
    this._dataJSObj.effectCoords = [];
    this._dataJSObj.effectWaits = 0;
    this._dataJSObj.imgClickX = 0;
    this._dataJSObj.imgClickY = 0;

    this._dataJSObj.frameColorR = WWAConsts.DEFAULT_FRAME_COLOR_R;
    this._dataJSObj.frameColorG = WWAConsts.DEFAULT_FRAME_COLOR_G;
    this._dataJSObj.frameColorB = WWAConsts.DEFAULT_FRAME_COLOR_B;
    this._dataJSObj.frameOutColorR = WWAConsts.DEFAULT_FRAMEOUT_COLOR_R;
    this._dataJSObj.frameOutColorG = WWAConsts.DEFAULT_FRAMEOUT_COLOR_G;
    this._dataJSObj.frameOutColorB = WWAConsts.DEFAULT_FRAMEOUT_COLOR_B;
    this._dataJSObj.fontColorR = WWAConsts.DEFAULT_STR_COLOR_R;
    this._dataJSObj.fontColorG = WWAConsts.DEFAULT_STR_COLOR_G;
    this._dataJSObj.fontColorB = WWAConsts.DEFAULT_STR_COLOR_B;
    this._dataJSObj.statusColorR = WWAConsts.DEFAULT_STATUS_COLOR_R;
    this._dataJSObj.statusColorG = WWAConsts.DEFAULT_STATUS_COLOR_G;
    this._dataJSObj.statusColorB = WWAConsts.DEFAULT_STATUS_COLOR_B;
  }
  public sendDataToMainProgram(): void {
    var resp = new loader_wwa_data.LoaderResponse();
    resp.progress = null;
    resp.error = null;
    resp.wwaData = this._dataJSObj;
    sendToMain(resp);
  }

  public sendErrorToMainProgram(error: Error): void {
    var resp = new loader_wwa_data.LoaderResponse();
    resp.wwaData = null;
    resp.progress = null;
    resp.error = new loader_wwa_data.LoaderError();
    resp.error.name = error.name;
    resp.error.message = error.message;

    sendToMain(resp);
  }

  public decodeMapData(): DecodeResult {
    var destData: Uint8Array = new Uint8Array(this._srcData.length);
    var srcCounter: number, destCounter: number;
    var maxim: number;
    var i: number;

    for (
      srcCounter = 0, destCounter = 0;
      srcCounter < this._srcData.length;
      srcCounter++
    ) {
      if (
        this._srcData[srcCounter] === 0 &&
        this._srcData[srcCounter + 1] === 0 &&
        this._srcData[srcCounter + 2] === 0
      ) {
        break;
      }

      destData[destCounter++] = this._srcData[srcCounter];

      // 数字が連続していれば解凍処理
      if (this._srcData[srcCounter] === this._srcData[srcCounter + 1]) {
        maxim = this._srcData[srcCounter + 2];
        for (i = 0; i < maxim; i++) {
          destData[destCounter++] = this._srcData[srcCounter];
        }
        srcCounter += 2;
      }

      // マップサイズとパーツ数のデータから必要領域取得
      // 最大サイズを超えそうなときは領域拡張して続行
      if (destCounter + 255 >= destData.length) {
        var newDestData: Uint8Array = new Uint8Array(
          destData.length + WWALoader.MEM_BLOCK
        );

        newDestData.set(destData);
        destData = newDestData;
      }
    }
    try {
      console.log("EXTRACT DATA = " + destCounter + " " + srcCounter);
    } catch (e) {}
    try {
      this.checkCompletelyDecoded(destData, destCounter);
    } catch (e) {
      throw e;
    }

    return new DecodeResult(destData, srcCounter + WWALoader.EXT_LAST_PADDING);
  }

  private _getMessageFromData(): string {
    var str = "";
    // WWA V3.10 Fix (Unicode Byte-length Problem, 1000->1500)
    // see also: http://wwajp.com/making.html
    for (var i = 0; i < 1500; i++) {
      if (
        this._srcData[this._currentPos + i * 2] == 0 &&
        this._srcData[this._currentPos + i * 2 + 1] == 0
      ) {
        break;
      }
      str += String.fromCharCode(
        (this._srcData[this._currentPos + i * 2 + 1] << 8) +
          this._srcData[this._currentPos + i * 2]
      );
    }
    this._currentPos += i * 2 + 2;
    return str;
  }

  public checkCompletelyDecoded(mapData: Uint8Array, dataLength: number): void {
    var i: number;
    var checkSum: number =
      mapData[WWADataExtractor.POS_CHECK] +
      mapData[WWADataExtractor.POS_CHECK + 1] * 0x100;
    var sum: number = 0;
    if (mapData[WWADataExtractor.POS_VERSION] >= 29) {
      for (i = 2; i < dataLength; i++) {
        sum += util.signedByte(mapData[i]) * (i % 8 + 1);
      }
      sum = (sum % 0x10000) & 0xffff;
      if (checkSum !== sum) {
        throw new Error(
          "マップデータが壊れているようです。\n チェックサムの値は" +
            checkSum +
            "ですが、" +
            "実際の和は" +
            sum +
            "でした。"
        );
      }
    }
  }
}

export function sendProgressToMainProgram(
  current: number,
  total: number,
  stage: loader_wwa_data.LoadStage
): void {
  var data = new loader_wwa_data.LoaderResponse();
  data.error = null;
  data.wwaData = null;
  data.progress = new loader_wwa_data.LoaderProgress();
  data.progress.current = current;
  data.progress.total = total;
  data.progress.stage = stage;
  sendToMain(data);
}

