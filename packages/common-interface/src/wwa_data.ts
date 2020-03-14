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

    gamePadButtonItemTable: number[];
}
