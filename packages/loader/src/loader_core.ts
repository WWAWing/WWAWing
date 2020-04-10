import * as loader_wwa_data from "./wwa_data";
import { WWAData } from "@wwawing/common-interface";
import { WWADataExtractor } from "./loader_extractor";
import { WWAConsts, WWALoaderEventEmitter } from "./wwa_data";
import { util } from "./loader_util";

export interface DecodeResult {
  byteMapData: Uint8Array;
  endPosition: number;
}

export class WWALoader {
  public static MEM_BLOCK: number = 65000;
  public static EXT_LAST_PADDING: number = 3;
  public static OLDVER_MESSAGE_MAX: number = 400;

  private wwaData: WWAData;
  private _currentPos: number;
  private _srcData: Uint8Array;

  public constructor(
    private fileName: string,
    private eventEmitter: WWALoaderEventEmitter
  ) { }

  public requestMapData(): void {
    var xhr: XMLHttpRequest = new XMLHttpRequest();
    try {
      // TODO: XHR をやめて、nodeでも動くようにする
      // 例えば、axiosを導入すればどちらでも動くコードにできるはず
      // (Promise を IE11で使えるようにするためにengine側で @babel/preset-env をかける必要があるので注意)
      // (この場合は、ライセンス表記に「axios」「core-js」を増やす必要があることに注意 どちらもMIT)
      xhr.open("GET", this.fileName, true);
      xhr.responseType = "arraybuffer";

      xhr.onreadystatechange = () => {
        try {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 304) {
              this.loadMapData(xhr.response);
              this.eventEmitter.dispatch("mapData", this.wwaData);
            } else if (xhr.status === 404) {
              throw new Error(
                "マップデータ「" +
                this.fileName +
                "」が見つかりませんでした。\n" +
                "HTTPステータスコードは " +
                xhr.status +
                "です。"
              );
            } else if (xhr.status === 403) {
              throw new Error(
                "マップデータ「" +
                this.fileName +
                "」を読み取る権限がないようです。\n" +
                "管理者の方へ: マップデータのパーミッションを確認してください。\n" +
                "HTTPステータスコードは " +
                xhr.status +
                "です。"
              );
            } else {
              throw new Error(
                "マップデータ「" +
                this.fileName +
                "」の読み込みに失敗しました。\n" +
                "HTTPステータスコードは " +
                xhr.status +
                "です。"
              );
            }
          }
        } catch (e) {
          this.eventEmitter.dispatch("error", e);
        }
      };
      xhr.send(null);
    } catch (e) {
      var error = new Error(
        "ロードエラー: ローカルテストの場合は、ブラウザが対応していない可能性があります。\n" +
        e.message
      );
      this.eventEmitter.dispatch("error", error);
    }
  }

  public loadMapData(data: any): void {
    try {
      this._srcData = new Uint8Array(data);
      const decodedResult = this.decodeMapData();
      this.wwaData = new WWADataExtractor(decodedResult.byteMapData, this.eventEmitter).extractAllData();
      this._currentPos = decodedResult.endPosition;
    } catch (e) {
      throw e;
    }
    this._loadAllTextData();
  }

  private _loadAllTextData(): void {
    let i: number;
    if (this.wwaData.version >= 30) {
      this.wwaData.worldPassword = this._getMessageFromData();
    }

    if (this.wwaData.version <= 29) {
      this.wwaData.messageNum = WWALoader.OLDVER_MESSAGE_MAX;
    }

    this.wwaData.message = new Array(this.wwaData.messageNum);
    for (i = 0; i < this.wwaData.message.length; i++) {
      this.wwaData.message[i] = this._getMessageFromData();
      if (i % 200 === 0) {
        this.eventEmitter.dispatch("progress", {
          current: i,
          total: this.wwaData.message.length,
          stage: loader_wwa_data.LoadStage.MESSAGE
        });
      }
    }

    // システムメッセージが足りない時対策
    while (this.wwaData.messageNum < 10) {
      this.wwaData.message.push("");
      this.wwaData.messageNum++;
    }
    this.eventEmitter.dispatch("progress", {
      current: this.wwaData.message.length,
      total: this.wwaData.message.length,
      stage: loader_wwa_data.LoadStage.MESSAGE
    });

    this.wwaData.worldName = this._getMessageFromData();
    if (this.wwaData.version <= 29) {
      this.wwaData.worldPassword = this._getMessageFromData();
    } else {
      this._getMessageFromData();
    }
    if (this.wwaData.worldPassword === "") {
      this.wwaData.worldPassNumber = 0;
    } else {
      if (this.wwaData.version >= 29) {
        this.wwaData.worldPassNumber =
          (parseInt(this.wwaData.worldPassword) / 10 - 1197) / 17 - 2357;
      } else {
        this.wwaData.worldPassNumber = parseInt(
          this.wwaData.worldPassword
        );
      }
    }
    this.wwaData.charCGName = this._getMessageFromData();
    this.wwaData.mapCGName = this._getMessageFromData();
    this.wwaData.systemMessage = new Array(WWAConsts.SYSTEM_MESSAGE_NUM);
    for (i = 0; i < WWAConsts.SYSTEM_MESSAGE_NUM; i++) {
      if (this.wwaData.version >= 30) {
        this.wwaData.systemMessage[i] = this._getMessageFromData();
      } else {
        this.wwaData.systemMessage[i] = "";
      }
    }
    this.wwaData.yesnoImgPosX =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_YESNO_X;
    this.wwaData.yesnoImgPosY =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_YESNO_Y;
    this.wwaData.playerImgPosX =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_PLAYER_X;
    this.wwaData.playerImgPosY =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_PLAYER_Y;
    this.wwaData.clickableItemSignImgPosX =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_X;
    this.wwaData.clickableItemSignImgPosY =
      loader_wwa_data.WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_Y;
    this.wwaData.disableSaveFlag =
      loader_wwa_data.WWAConsts.DEFAULT_DISABLE_SAVE;
    this.wwaData.isOldMap = loader_wwa_data.WWAConsts.DEFAULT_OLDMAP;
    this.wwaData.objectNoCollapseDefaultFlag =
      loader_wwa_data.WWAConsts.DEFAULT_OBJECT_NO_COLLAPSE;
    this.wwaData.delPlayerFlag = false;
    this.wwaData.bgm = 0;
    this.wwaData.effectCoords = [];
    this.wwaData.effectWaits = 0;
    this.wwaData.imgClickX = 0;
    this.wwaData.imgClickY = 0;

    this.wwaData.frameColorR = WWAConsts.DEFAULT_FRAME_COLOR_R;
    this.wwaData.frameColorG = WWAConsts.DEFAULT_FRAME_COLOR_G;
    this.wwaData.frameColorB = WWAConsts.DEFAULT_FRAME_COLOR_B;
    this.wwaData.frameOutColorR = WWAConsts.DEFAULT_FRAMEOUT_COLOR_R;
    this.wwaData.frameOutColorG = WWAConsts.DEFAULT_FRAMEOUT_COLOR_G;
    this.wwaData.frameOutColorB = WWAConsts.DEFAULT_FRAMEOUT_COLOR_B;
    this.wwaData.fontColorR = WWAConsts.DEFAULT_STR_COLOR_R;
    this.wwaData.fontColorG = WWAConsts.DEFAULT_STR_COLOR_G;
    this.wwaData.fontColorB = WWAConsts.DEFAULT_STR_COLOR_B;
    this.wwaData.statusColorR = WWAConsts.DEFAULT_STATUS_COLOR_R;
    this.wwaData.statusColorG = WWAConsts.DEFAULT_STATUS_COLOR_G;
    this.wwaData.statusColorB = WWAConsts.DEFAULT_STATUS_COLOR_B;
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
    } catch (e) { }
    try {
      this.checkCompletelyDecoded(destData, destCounter);
    } catch (e) {
      throw e;
    }

    return { byteMapData: destData, endPosition: srcCounter + WWALoader.EXT_LAST_PADDING };
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
