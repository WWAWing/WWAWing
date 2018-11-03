export class WWAConsts {
    static ITEMBOX_SIZE: number = 12;
    static MAP_ATR_MAX: number = 60;
    static OBJ_ATR_MAX: number = 60;
    static OLD_MAP_ATR_MAX: number = 40;
    static OLD_OBJ_ATR_MAX: number = 40;
    static ATR_CROP1: number = 1;
    static ATR_CROP2: number = 2;
    static ATR_TYPE: number = 3;
    static ATR_JUMP_X: number = 16;
    static ATR_JUMP_Y: number = 17;

    static MAP_LOCALGATE: number = 2;
    static OBJECT_RANDOM: number = 16;
    static OBJECT_LOCALGATE: number = 18;

    static SYSTEM_MESSAGE_NUM: number = 20;

    static IMGPOS_DEFAULT_YESNO_X: number = 3;
    static IMGPOS_DEFAULT_YESNO_Y: number = 1;

    static IMGRELPOS_YESNO_YES_X: number = 0;
    static IMGRELPOS_YESNO_NO_X: number = 1;
    static IMGRELPOS_YESNO_YESP_X: number = 2;
    static IMGRELPOS_YESNO_NOP_X: number = 3;

    static IMGPOS_DEFAULT_PLAYER_X: number = 2;
    static IMGPOS_DEFAULT_PLAYER_Y: number = 0;

    static IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_X: number = 0;
    static IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_Y: number = 0;

    static DEFAULT_DISABLE_SAVE: boolean = false;
    static DEFAULT_OLDMAP: boolean = false;
    static DEFAULT_OBJECT_NO_COLLAPSE: boolean = false;

    static DEFAULT_FRAME_COLOR_R = 0xff;
    static DEFAULT_FRAME_COLOR_G = 0xff;
    static DEFAULT_FRAME_COLOR_B = 0xff;
    static DEFAULT_FRAMEOUT_COLOR_R = 0x60;
    static DEFAULT_FRAMEOUT_COLOR_G = 0x60;
    static DEFAULT_FRAMEOUT_COLOR_B = 0x60;
    static DEFAULT_STR_COLOR_R = 0x0;
    static DEFAULT_STR_COLOR_G = 0x0;
    static DEFAULT_STR_COLOR_B = 0x0;
    static DEFAULT_STATUS_COLOR_R = 0x0;
    static DEFAULT_STATUS_COLOR_G = 0x0;
    static DEFAULT_STATUS_COLOR_B = 0x0;
}

export class LoaderResponse {
    error: LoaderError;
    progress: LoaderProgress;
    wwaData: WWAData;
}

export class LoaderError implements Error {
    name: string;
    message: string;
}

export class LoaderProgress {
    current: number;
    total: number;
    stage: LoadStage;
}

export enum PartsType {
    MAP = 1, OBJECT = 0
}

export enum LoadStage {
    INIT = 0, MAP_LOAD = 1, OBJ_LOAD = 2, MAP_ATTR = 3, OBJ_ATTR = 4, RAND_PARTS = 5, MESSAGE = 6
}

export class Coord {
    public x: number;
    public y: number;
    public equals(coord: Coord): boolean {
    return this.x === coord.x && this.y === coord.y;
    }
    public substract(c: Coord): Coord {
    return new Coord(this.x - c.x, this.y - c.y);
    }
    public clone(): Coord {
    return new Coord(this.x, this.y);
    }
    /*
    public convertIntoPosition(wwa: wwa_main.WWA): Position {
        return new Position(wwa, this.x, this.y, 0, 0);
    }
    public getDirectionTo(dest: Coord): Direction {
        if (this.x < dest.x) {
            if (this.y > dest.y) {
                return Direction.RIGHT_UP;
            }
            if (this.y === dest.y) {
                return Direction.RIGHT;
            }
            return Direction.RIGHT_DOWN;
        }
        if (this.x === dest.x) {
            if (this.y > dest.y) {
                return Direction.UP;
            }
            if (this.y === dest.y) {
                return Direction.NO_DIRECTION;
            }
            return Direction.DOWN;
        }

        if (this.y > dest.y) {
            return Direction.LEFT_UP;
        }
        if (this.y === dest.y) {
            return Direction.LEFT;
        }
        return Direction.LEFT_DOWN;
    }
    */
    public constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
    }
}

export class WWAData {
    version: number = void 0;

    gameoverX: number = void 0;
    gameoverY: number = void 0;

    playerX: number = void 0;
    playerY: number = void 0;

    mapPartsMax: number = void 0;
    objPartsMax: number = void 0;

    isOldMap: boolean = void 0;

    statusEnergyMax: number = void 0;
    statusEnergy: number = void 0;
    statusStrength: number = void 0;
    statusDefence: number = void 0;
    statusGold: number = void 0;

    itemBox: number[] = void 0;

    mapWidth: number = void 0;
    messageNum: number = void 0;

    map: number[][] = void 0;
    mapObject: number[][] = void 0;

    mapAttribute: number[][] = void 0;
    objectAttribute: number[][] = void 0;

    worldPassword: string = void 0;
    message: string[] = void 0;
    worldName: string = void 0;
    worldPassNumber: number = void 0;
    charCGName: string = void 0;
    mapCGName: string = void 0;
    systemMessage: string[] = void 0;
    moves: number = 0;

    yesnoImgPosX: number = void 0;
    yesnoImgPosY: number = void 0;
    playerImgPosX: number = void 0;
    playerImgPosY: number = void 0;
    clickableItemSignImgPosX: number = void 0; // 0の時, 標準枠
    clickableItemSignImgPosY: number = void 0; // undefined時, 標準枠

    disableSaveFlag: boolean = void 0;
    compatibleForOldMapFlag: boolean = void 0;
    objectNoCollapseDefaultFlag: boolean = void 0;
    delPlayerFlag: boolean = void 0;
    bgm: number = void 0;
    effectCoords: Coord[];
    effectWaits: number;

    imgClickX: number = void 0;
    imgClickY: number = void 0;

    frameColorR: number = void 0;
    frameColorG: number = void 0;
    frameColorB: number = void 0;

    frameOutColorR: number = void 0;
    frameOutColorG: number = void 0;
    frameOutColorB: number = void 0;

    fontColorR: number = void 0;
    fontColorG: number = void 0;
    fontColorB: number = void 0;

    statusColorR: number = void 0;
    statusColorG: number = void 0;
    statusColorB: number = void 0;

    constructor() {}
}