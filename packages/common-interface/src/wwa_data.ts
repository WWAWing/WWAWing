export interface Coord {
    x: number;
    y: number;
}

// TODO: LoaderとEngineで必要なやつが違うのでわける
// @see: https://github.com/WWAWing/tmp-wwadata-compare/pull/1/files
export interface WWAData {
    version: number;

    gameoverX: number;
    gameoverY: number;

    playerX: number;
    playerY: number;

    mapPartsMax: number;
    objPartsMax: number;

    isOldMap: boolean;
    isOldMove: boolean;

    statusEnergyMax: number;
    statusEnergy: number;
    statusStrength: number;
    statusDefence: number;
    statusGold: number;

    itemBox: number[];

    mapWidth: number;
    messageNum: number;

    map: number[][];
    mapObject: number[][];

    mapCompressed: number[][][];
    mapObjectCompressed: number[][][];

    mapAttribute: number[][];
    objectAttribute: number[][];

    worldPassword: string;
    message: string[];
    worldName: string;
    worldPassNumber: number;
    charCGName: string;
    mapCGName: string;
    systemMessage: string[];
    moves: number;

    yesnoImgPosX: number;
    yesnoImgPosY: number;
    playerImgPosX: number;
    playerImgPosY: number;
    clickableItemSignImgPosX: number; // 0の時, 標準枠 注) 面倒なことがわかったので未実装
    clickableItemSignImgPosY: number; // undefined時, 標準枠 注) 面倒なことがわかったので未実装

    disableSaveFlag: boolean;
    compatibleForOldMapFlag: boolean;
    objectNoCollapseDefaultFlag: boolean;

    delPlayerFlag: boolean;

    bgm: number;
    effectCoords: Coord[];
    effectWaits: number;

    imgStatusEnergyX: number;
    imgStatusEnergyY: number;
    imgStatusStrengthX: number;
    imgStatusStrengthY: number;
    imgStatusDefenceX: number;
    imgStatusDefenceY: number;
    imgStatusGoldX: number;
    imgStatusGoldY: number;
    imgWideCellX: number;
    imgWideCellY: number;
    imgItemboxX: number;
    imgItemboxY: number;
    imgFrameX: number;
    imgFrameY: number;
    imgBattleEffectX: number;
    imgBattleEffectY: number;
    imgClickX: number;
    imgClickY: number;

    frameColorR: number;
    frameColorG: number;
    frameColorB: number;

    frameOutColorR: number;
    frameOutColorG: number;
    frameOutColorB: number;

    fontColorR: number;
    fontColorG: number;
    fontColorB: number;

    statusColorR: number;
    statusColorG: number;
    statusColorB: number;
    checkOriginalMapString: string;
    checkString: string;

    isItemEffectEnabled: boolean;

    /**
     * プレイ時間
     * memo: playFrameCount というのは古い表記なのでマージなどの時に注意
     */
    frameCount: number

    /** 
     * `gamePadButtonItemTable[i]` (ただし `i` は ゲームパッドのボタンID) に、
     * 対応するアイテムボックスの番号(1以上12以下) または アイテムボックスの対応がないことを示す「0」が入っているような配列
     * NOTE: この配列は $gamepad_button が一度でも使用されなければ、配列ではなくundefinedが入っていることに注意せよ
     */
    gamePadButtonItemTable: number[];
}
