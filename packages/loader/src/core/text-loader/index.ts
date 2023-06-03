import { LoadStage, WWAConsts, WWALoaderEventEmitter } from "../../infra";
import { WWAData } from "@wwawing/common-interface";

export class TextLoader {
  public readonly OLDVER_MESSAGE_MAX: number = 400;
  private currentPos: number;
  constructor(private wwaData: WWAData,
    private compressedMapData: Uint8Array,
    private startPosition: number,
    private eventEmitter: WWALoaderEventEmitter) { }

  load(): WWAData{
    const wwaData = this.wwaData;
    this.currentPos = this.startPosition;
    if (wwaData.version >= 30) {
      wwaData.worldPassword = this.getMessageFromData();
    }

    if (wwaData.version <= 29) {
      wwaData.messageNum = this.OLDVER_MESSAGE_MAX;
    }

    wwaData.message = new Array(wwaData.messageNum);
    for (let i = 0; i < wwaData.message.length; i++) {
      wwaData.message[i] = this.getMessageFromData();
      if (i % 200 === 0) {
        this.eventEmitter.dispatch("progress", {
          current: i,
          total: wwaData.message.length,
          stage: LoadStage.MESSAGE
        });
      }
    }

    // システムメッセージが足りない時対策
    while (wwaData.messageNum < 10) {
      wwaData.message.push("");
      wwaData.messageNum++;
    }
    this.eventEmitter.dispatch("progress", {
      current: wwaData.message.length,
      total: wwaData.message.length,
      stage: LoadStage.MESSAGE
    });

    wwaData.worldName = this.getMessageFromData();
    if (wwaData.version <= 29) {
      wwaData.worldPassword = this.getMessageFromData();
    } else {
      this.getMessageFromData();
    }
    if (wwaData.worldPassword === "") {
      wwaData.worldPassNumber = 0;
    } else {
      if (wwaData.version >= 29) {
        wwaData.worldPassNumber =
          (parseInt(wwaData.worldPassword) / 10 - 1197) / 17 - 2357;
      } else {
        wwaData.worldPassNumber = parseInt(
          wwaData.worldPassword
        );
      }
    }
    wwaData.charCGName = this.getMessageFromData();
    wwaData.mapCGName = this.getMessageFromData();
    wwaData.systemMessage = new Array(WWAConsts.SYSTEM_MESSAGE_NUM);
    for (let i = 0; i < WWAConsts.SYSTEM_MESSAGE_NUM; i++) {
      if (wwaData.version >= 30) {
        wwaData.systemMessage[i] = this.getMessageFromData();
      } else {
        wwaData.systemMessage[i] = "";
      }
    }
    wwaData.yesnoImgPosX = WWAConsts.IMGPOS_DEFAULT_YESNO_X;
    wwaData.yesnoImgPosY = WWAConsts.IMGPOS_DEFAULT_YESNO_Y;
    wwaData.playerImgPosX = WWAConsts.IMGPOS_DEFAULT_PLAYER_X;
    wwaData.playerImgPosY = WWAConsts.IMGPOS_DEFAULT_PLAYER_Y;
    wwaData.clickableItemSignImgPosX = WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_X;
    wwaData.clickableItemSignImgPosY = WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_Y;
    wwaData.disableSaveFlag = WWAConsts.DEFAULT_DISABLE_SAVE;
    wwaData.isOldMap = WWAConsts.DEFAULT_OLDMAP;
    wwaData.isOldMove = wwaData.version < 31;
    wwaData.objectNoCollapseDefaultFlag = WWAConsts.DEFAULT_OBJECT_NO_COLLAPSE;
    wwaData.delPlayerFlag = false;
    wwaData.bgm = 0;
    wwaData.effectCoords = [];
    wwaData.effectWaits = 0;

    wwaData.imgStatusEnergyX = WWAConsts.IMGPOS_DEFAULT_STATUS_X + WWAConsts.IMGRELPOS_ENERGY_ICON_X;
    wwaData.imgStatusEnergyY = WWAConsts.IMGPOS_DEFAULT_STATUS_Y;
    wwaData.imgStatusStrengthX = WWAConsts.IMGPOS_DEFAULT_STATUS_X + WWAConsts.IMGRELPOS_STRENGTH_ICON_X;
    wwaData.imgStatusStrengthY = WWAConsts.IMGPOS_DEFAULT_STATUS_Y;
    wwaData.imgStatusDefenceX = WWAConsts.IMGPOS_DEFAULT_STATUS_X + WWAConsts.IMGRELPOS_DEFENCE_ICON_X;
    wwaData.imgStatusDefenceY = WWAConsts.IMGPOS_DEFAULT_STATUS_Y;
    wwaData.imgStatusGoldX = WWAConsts.IMGPOS_DEFAULT_STATUS_X + WWAConsts.IMGRELPOS_GOLD_ICON_X;
    wwaData.imgStatusGoldY = WWAConsts.IMGPOS_DEFAULT_STATUS_Y;
    wwaData.imgWideCellX = WWAConsts.IMGPOS_DEFAULT_WIDE_CELL_X;
    wwaData.imgWideCellY = WWAConsts.IMGPOS_DEFAULT_WIDE_CELL_Y;
    wwaData.imgItemboxX = WWAConsts.IMGPOS_DEFAULT_ITEMBOX_X;
    wwaData.imgItemboxY = WWAConsts.IMGPOS_DEFAULT_ITEMBOX_Y;
    wwaData.imgFrameX = WWAConsts.IMGPOS_DEFAULT_FRAME_X;
    wwaData.imgFrameY = WWAConsts.IMGPOS_DEFAULT_FRAME_Y;
    wwaData.imgBattleEffectX = WWAConsts.IMGPOS_DEFAULT_BATTLE_EFFECT_X;
    wwaData.imgBattleEffectY = WWAConsts.IMGPOS_DEFAULT_BATTLE_EFFECT_Y;
    wwaData.imgClickX = 0;
    wwaData.imgClickY = 0;

    wwaData.frameColorR = WWAConsts.DEFAULT_FRAME_COLOR_R;
    wwaData.frameColorG = WWAConsts.DEFAULT_FRAME_COLOR_G;
    wwaData.frameColorB = WWAConsts.DEFAULT_FRAME_COLOR_B;
    wwaData.frameOutColorR = WWAConsts.DEFAULT_FRAMEOUT_COLOR_R;
    wwaData.frameOutColorG = WWAConsts.DEFAULT_FRAMEOUT_COLOR_G;
    wwaData.frameOutColorB = WWAConsts.DEFAULT_FRAMEOUT_COLOR_B;
    wwaData.fontColorR = WWAConsts.DEFAULT_STR_COLOR_R;
    wwaData.fontColorG = WWAConsts.DEFAULT_STR_COLOR_G;
    wwaData.fontColorB = WWAConsts.DEFAULT_STR_COLOR_B;
    wwaData.statusColorR = WWAConsts.DEFAULT_STATUS_COLOR_R;
    wwaData.statusColorG = WWAConsts.DEFAULT_STATUS_COLOR_G;
    wwaData.statusColorB = WWAConsts.DEFAULT_STATUS_COLOR_B;

    wwaData.moves = WWAConsts.DEFAULT_MOVES;
    wwaData.gameSpeedIndex = WWAConsts.DEFAULT_SPEED_INDEX;
    wwaData.permitChangeGameSpeed = true;
    wwaData.userVar = new Array(WWAConsts.USER_VAR_NUM);
    for (let i = 0; i < WWAConsts.USER_VAR_NUM; i++) {
      wwaData.userVar[i] = 0;
    }
    wwaData.playTime = 0;

    wwaData.isVisibleStatusEnergy = true;
    wwaData.isVisibleStatusStrength = true;
    wwaData.isVisibleStatusDefence = true;
    wwaData.isVisibleStatusGold = true;

    wwaData.gameOverPolicy = "default";

    wwaData.bgmDelayDurationMs = 0;

    return wwaData;
  }

  private getMessageFromData(): string {
    let str = "";
    let i: number = 0;
    // WWA V3.10 Fix (Unicode Byte-length Problem, 1000->1500)
    // see also: http://wwajp.com/making.html
    for ( i = 0; i < 1500; i++) {
      if (
        this.compressedMapData[this.currentPos + i * 2] == 0 &&
        this.compressedMapData[this.currentPos + i * 2 + 1] == 0
      ) {
        break;
      }
      str += String.fromCharCode(
        (this.compressedMapData[this.currentPos + i * 2 + 1] << 8) +
        this.compressedMapData[this.currentPos + i * 2]
      );
    }
    this.currentPos += i * 2 + 2;
    return str;
  }
}
