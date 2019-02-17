import { WWA } from "./wwa_main";
import {
    WWAConsts,
    Coord,
    PartsType,
    Face,
    MacroType,
    MacroImgFrameIndex,
    macrotable,
    YesNoState,
    Position
} from "./wwa_data";
import {
    Positioning as MPositioning
} from "./wwa_message";
import {
    Monster
} from "./wwa_monster";
import * as util from "./wwa_util";

export class MessageInfo {
    constructor(
        public message: string,
        public isSystemMessage: boolean,
        public isEndOfPartsEvent?: boolean,
        public macro?: Macro[]
    ) {
        if (this.macro === void 0) {
            this.macro = [];
        }
    }

}

export function strArrayToMessageInfoArray(strArray: string[], isSystemMessage: boolean): MessageInfo[] {
    var newq: MessageInfo[] = [];
    strArray.forEach((s) => {
        newq.push(new MessageInfo(s, isSystemMessage));
    });
    return newq;
}

export class Macro {
    constructor(
        private _wwa: WWA,
        private _triggerPartsID: number,
        private _triggerPartsType: number,
        private _triggerPartsPosition: Coord,
        public macroType: MacroType,
        public macroArgs: string[]
    ) { }
    public execute(): void {
        try {
            if (this.macroType === MacroType.IMGPLAYER) {
                this._executeImgPlayerMacro();
            } else if (this.macroType === MacroType.IMGYESNO) {
                this._executeImgYesNoMacro();
            } else if (this.macroType === MacroType.HPMAX) {
                this._executeHPMaxMacro();
            } else if (this.macroType === MacroType.SAVE) {
                this._executeSaveMacro();
            } else if (this.macroType === MacroType.PASS_SAVE) {
                this._executePassSaveMacro();
            } else if (this.macroType === MacroType.ITEM) {
                this._executeItemMacro();
            } else if (this.macroType === MacroType.DEFAULT) {
                this._executeDefaultMacro();
            } else if (this.macroType === MacroType.OLDMAP) {
                this._executeOldMapMacro();
            } else if (this.macroType === MacroType.PARTS) {
                this._executePartsMacro();
            } else if (this.macroType === MacroType.MOVE) {
                this._executeMoveMacro();
            } else if (this.macroType === MacroType.MAP) {
                this._executeMapMacro();
            } else if (this.macroType === MacroType.DIRMAP) {
                this._executeDirMapMacro();
            } else if (this.macroType === MacroType.IMGFRAME) {
                this._executeImgFrameMacro();
            } else if (this.macroType === MacroType.IMGBOM) {
                this._executeImgBomMacro();
            } else if (this.macroType === MacroType.DELPLAYER) {
                this._executeDelPlayerMacro();
            } else if (this.macroType === MacroType.FACE) {
                this._executeFaceMacro();
            } else if (this.macroType === MacroType.EFFECT) {
                this._executeEffectMacro();
            } else if (this.macroType === MacroType.GAMEOVER) {
                this._executeGameOverMacro();
            } else if (this.macroType === MacroType.IMGCLICK) {
                this._executeImgClickMacro();
            } else if (this.macroType === MacroType.STATUS) {
                this._executeStatusMacro();
            } else if(this.macroType === MacroType.EFFITEM) {
                this._executeEffItemMacro();
            } else if (this.macroType === MacroType.COLOR) {
                this._executeColorMacro();
            } else if (this.macroType === MacroType.WAIT) {
                this._executeWaitMacro();
            } else if (this.macroType === MacroType.SOUND) {
                this._executeSoundMacro();
            }
            // JUMPGATEマクロ受け取り
            else if (this.macroType === MacroType.JUMPGATE) {
                this._executeJumpGateMacro();
            }
            // 現在の座標を記憶
            else if (this.macroType === MacroType.RECPOSITION) {
                this._executeRecPositionMacro();
            }
            // 記憶していた座標にジャンプ
            else if (this.macroType === MacroType.JUMPRECPOSITION) {
                this._executeJumpRecPositionMacro();
            }
            // 変数デバッグ出力
            else if (this.macroType === MacroType.CONSOLE_LOG) {
                this._executeConsoleLogMacro();
            }
            // 変数 <- HP
            else if (this.macroType === MacroType.COPY_HP_TO) {
                this._executeCopyHpToMacro();
            }
            // HP <- 変数
            else if (this.macroType === MacroType.SET_HP) {
                this._executeSetHPMacro();
            }
            // 変数 <- HPMAX
            else if (this.macroType === MacroType.COPY_HPMAX_TO) {
                this._executeCopyHpMaxToMacro();
            }
            // HPMAX <- 変数
            else if (this.macroType === MacroType.SET_HPMAX) {
                this._executeSetHpMaxMacro();
            }
            // 変数 <- AT
            else if (this.macroType === MacroType.COPY_AT_TO) {
                this._executeCopyAtToMacro();
            }
            // AT <- 変数
            else if (this.macroType === MacroType.SET_AT) {
                this._executeSetAtMacro();
            }
            // 変数 <- DF
            else if (this.macroType === MacroType.COPY_DF_TO) {
                this._executeCopyDfToMacro();
            }
            // DF <- 変数
            else if (this.macroType === MacroType.SET_DF) {
                this._executeSetDfMacro();
            }
            // 変数 <- MONEY
            else if (this.macroType === MacroType.COPY_MONEY_TO) {
                this._executeCopyMoneyToMacro();
            }
            // MONEY <- 変数
            else if (this.macroType === MacroType.SET_MOENEY) {
                this._executeSetMoneyMacro();
            }
            // HW3.16.4 より実装
            // 歩数カウント代入
            else if (this.macroType === MacroType.COPY_STEP_COUNT_TO) {
                this._executeSetStepCountMacro();
            }
            // 変数に定数代入
            else if (this.macroType === MacroType.VAR_SET_VAL) {
                this._executeVarSetValMacro();
            }
            // 変数に変数代入
            else if (this.macroType === MacroType.VAR_SET) {
                this._executeVarSetMacro();
            }
            // 足し算代入
            else if (this.macroType === MacroType.VAR_ADD) {
                this._executeVarAddMacro();
            }
            // 引き算代入
            else if (this.macroType === MacroType.VAR_SUB) {
                this._executeVarSubMacro();
            }
            // 掛け算代入
            else if (this.macroType === MacroType.VAR_MUL) {
                this._executeVarMulMacro();
            }
            // 割り算代入
            else if (this.macroType === MacroType.VAR_DIV) {
                this._executeVarDivMacro();
            }
            // 変数Xに1からYまでの乱数を代入
            else if (this.macroType === MacroType.VAR_SET_RAND) {
                this._executeVarSetRandMacro();
            }
            // 速度変更禁止マクロ
            else if (this.macroType === MacroType.GAME_SPEED) {
                this._executeGameSpeedMacro();
            }
            // 変数付きのメッセージ表示
            else if (this.macroType === MacroType.SHOW_STR) {
                this._executeShowStrMacro();
            }
            // 強制クイックセーブ
            else if (this.macroType === MacroType.AUTO_SAVE) {
                this._executeAutoSaveMacro();
            }
            // IF文
            else if (this.macroType === MacroType.IF) {
                this._executeIfMacro();
            }
            // 速度設定
            else if (this.macroType === MacroType.SET_SPEED) {
                this._executeSetSpeedMacro();
            }
            // HW3.16.5 より実装
            // プレイ時間変数代入
            else if (this.macroType === MacroType.COPY_TIME_TO) {
                this._executeCopyTimeToMacro();
            }
            // HW3.18.0 より実装
            // ステータスを隠す
            else if (this.macroType === MacroType.HIDE_STATUS) {
                this._hideStatusMacro();
            }
            // HW3.19.0 より実装
            // $map の変数対応版
            else if (this.macroType === MacroType.VAR_MAP) {
                this._varMapMacro();
            }
 
        } catch (e) {
            // デベロッパーモードならエラーを吐くとかしたいね
        }
    }

    private _concatEmptyArgs(requiredLength: number): void {
        if (this.macroArgs.length < requiredLength) {
            var ap = new Array(requiredLength - this.macroArgs.length);
            for (var i = 0; i < ap.length; i++) {
                ap[i] = "";
            }
            this.macroArgs = this.macroArgs.concat(ap);
        }
    }

    private _parseInt(argIndex: number, fallback: number = 0): number {
        var x = parseInt(this.macroArgs[argIndex]);
        if (isNaN(x)) {
            return fallback;
        }
        return x;
    }

    // JumpGateマクロ実行部
    private _executeJumpGateMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.forcedJumpGate(x, y);
    }
    // RecPositionマクロ実行部
    private _executeRecPositionMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.recUserPosition(x, y);
    }
    // JumpRecPositionマクロ実行部
    private _executeJumpRecPositionMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.jumpRecUserPosition(x, y);
    }
    // consoleLogマクロ実行部
    private _executeConsoleLogMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.outputUserVar(num);
    }
    // copy_hp_toマクロ実行部
    private _executeCopyHpToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarHP(num);
    }
    // copy_hpmax_toマクロ実行部
    private _executeCopyHpMaxToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarHPMAX(num);
    }
    // copy_at_toマクロ実行部
    private _executeCopyAtToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarAT(num);
    }
    // copy_df_toマクロ実行部
    private _executeCopyDfToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarDF(num);
    }
    // copy_money_toマクロ実行部
    private _executeCopyMoneyToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarMONEY(num);
    }
    // set_hpマクロ実行部
    private _executeSetHPMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setHPUserVar(num);
    }
    // set_hpmaxマクロ実行部
    private _executeSetHpMaxMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setHPMAXUserVar(num);
    }
    // set_atマクロ実行部
    private _executeSetAtMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setATUserVar(num);
    }
    // set_dfマクロ実行部
    private _executeSetDfMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setDFUserVar(num);
    }
    // set_moneyマクロ実行部
    private _executeSetMoneyMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setMONEYUserVar(num);
    }
    // copy_step_count_toマクロ実行部
    private _executeSetStepCountMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarStep(num);
    }
    // var_set_valマクロ実行部
    private _executeVarSetValMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var num = this._parseInt(1);
        this._wwa.setUserVarVal(x, num);
    }
    // var_setマクロ実行部
    private _executeVarSetMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValOtherUserVal(x, y);
    }
    // var_addマクロ実行部
    private _executeVarAddMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValAdd(x, y);
    }
    // var_subマクロ実行部
    private _executeVarSubMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValSub(x, y);
    }
    // var_mulマクロ実行部
    private _executeVarMulMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValMul(x, y);
    }
    // var_divマクロ実行部
    private _executeVarDivMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValDiv(x, y);
    }
    // var_set_randマクロ実行部
    private _executeVarSetRandMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValRandNum(x, y);
    }
    // game_speedマクロ実行部
    private _executeGameSpeedMacro(): void {
        this._concatEmptyArgs(1);
        var speedChangeFlag = !!this._parseInt(0);
        this._wwa.speedChangeJudge(speedChangeFlag);
    }
    // show_strマクロ実行部
    private _executeShowStrMacro(): void {
        var max_num = 10;
        var out_str = new String("");
        this._concatEmptyArgs(max_num);
        this._wwa.showUserValString(this.macroArgs);
    }
    // autoSaveマクロ実行部
    private _executeAutoSaveMacro(): void {
        this._wwa.autoSave();
    }
    // IFマクロ実行部
    private _executeIfMacro(): void {
        // 0,1,2 -対象ユーザ変数添字 3-番号 4-X 5-Y 6-背景物理
        var str: string[] = new Array(11);
        for (var i = 0; i < 10; i++) {
            str[i] = this.macroArgs[i];
        }
        this._wwa.userVarUserIf(this._triggerPartsPosition, str);
    }
    // SET_SPEEDマクロ実行部
    private _executeSetSpeedMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setPlayerSpeed(num);
    }
    // COPY_TO_TIMEマクロ実行部
    private _executeCopyTimeToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarPlayTime(num);
    }
    // HIDE_STATUS マクロ実行部
    private _hideStatusMacro(): void {
        this._concatEmptyArgs(2);
        var no = this._parseInt(0);
        var isHideNumber = this._parseInt(1);
        var isHide = (isHideNumber === 0) ? false : true;
        this._wwa.hideStatus(no, isHide);
    }
    // VAR_MAP マクロ実行部
    private _varMapMacro(): void {
        this._concatEmptyArgs(4);
        var partsID = this._parseInt(0);
        var xstr = this.macroArgs[1];
        var ystr = this.macroArgs[2];
        var partsType = this._parseInt(3, PartsType.OBJECT);

        if (partsID < 0) {
            throw new Error("入力変数が不正です");
        }
        this._wwa.varMap(this._triggerPartsPosition, xstr, ystr, partsID, partsType);
        // this._wwa.appearPartsEval( this._triggerPartsPosition, xstr, ystr, partsID, partsType);
    }
    // executeImgPlayerMacro
    private _executeImgPlayerMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setPlayerImgCoord(new Coord(x, y));
    }

    private _executeImgYesNoMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setYesNoImgCoord(new Coord(x, y));
    }

    private _executeHPMaxMacro(): void {
        this._concatEmptyArgs(1);
        var hpmax = Math.max(0, this._parseInt(0));
        this._wwa.setPlayerEnergyMax(hpmax);
    }

    private _executeSaveMacro(): void {
        this._concatEmptyArgs(1);
        var disableSaveFlag = !!this._parseInt(0);
        this._wwa.disableSave(disableSaveFlag);
    }

    private _executePassSaveMacro(): void {
        this._concatEmptyArgs(1);
        var disablePassSaveFlag = !!this._parseInt(0);
        this._wwa.disablePassSave(disablePassSaveFlag);
    }

    private _executeItemMacro(): void {
        this._concatEmptyArgs(2);
        var pos = this._parseInt(0);
        var id = this._parseInt(1);
        this._wwa.setPlayerGetItem(pos, id);
    }

    private _executeDefaultMacro(): void {
        this._concatEmptyArgs(1);
        var defaultFlag = !!this._parseInt(0);
        this._wwa.setObjectNotCollapseOnPartsOnPlayer(defaultFlag);
    }

    private _executeOldMapMacro(): void {
        this._concatEmptyArgs(1);
        var oldMapFlag = !!this._parseInt(0);
        this._wwa.setOldMap(oldMapFlag);
    }

    private _executePartsMacro(): void {
        this._concatEmptyArgs(4);
        var srcID = this._parseInt(0);
        var destID = this._parseInt(1);
        var partsType = this._parseInt(2, PartsType.OBJECT);
        var onlyThisSight = this._parseInt(3);

        if (partsType !== PartsType.OBJECT && partsType !== PartsType.MAP) {
            throw new Error("パーツ種別が不明です");
        }
        if (onlyThisSight !== 0 && onlyThisSight !== 1) {
            // fallback
            onlyThisSight = 1;
        }
        if (srcID < 0 || destID < 0) {
            throw new Error("パーツ番号が不正です");
        }
        if (partsType === PartsType.OBJECT) {
            if (srcID >= this._wwa.getObjectPartsNum() || destID >= this._wwa.getObjectPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        } else {
            if (srcID >= this._wwa.getMapPartsNum() || destID >= this._wwa.getMapPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        }
        this._wwa.replaceParts(srcID, destID, partsType, !!onlyThisSight);
    }

    private _executeMoveMacro(): void {
        this._concatEmptyArgs(1);
        var moveNum = this._parseInt(0);
        this._wwa.setMoveMacroWaitingToPlayer(moveNum);
    }

    private _executeMapMacro(): void {
        this._concatEmptyArgs(4);
        var partsID = this._parseInt(0);
        var xstr = this.macroArgs[1];
        var ystr = this.macroArgs[2];
        var partsType = this._parseInt(3, PartsType.OBJECT);

        if (partsID < 0) {
            throw new Error("パーツ番号が不正です");
        }
        if (partsType === PartsType.OBJECT) {
            if (partsID >= this._wwa.getObjectPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        } else {
            if (partsID >= this._wwa.getMapPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        }
        this._wwa.appearPartsEval(this._triggerPartsPosition, xstr, ystr, partsID, partsType);
    }

    private _executeDirMapMacro(): void {
        this._concatEmptyArgs(3);
        var partsID = this._parseInt(0);
        var dist = this._parseInt(1);
        var partsType = this._parseInt(2, PartsType.OBJECT);
        if (isNaN(partsID) || isNaN(dist) || isNaN(partsType)) {
            throw new Error("引数が整数ではありません");
        }
        if (partsID < 0) {
            throw new Error("パーツ番号が不正です");
        }
        if (partsType === PartsType.OBJECT) {
            if (partsID >= this._wwa.getObjectPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        } else {
            if (partsID >= this._wwa.getMapPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        }
        this._wwa.appearPartsByDirection(dist, partsID, partsType);
    }

    private _executeImgFrameMacro(): void {
        this._concatEmptyArgs(3);
        var type = this._parseInt(0);
        var posX = this._parseInt(1);
        var posY = this._parseInt(2);

        var x = posX * WWAConsts.CHIP_SIZE;
        var y = posY * WWAConsts.CHIP_SIZE

        if (posX < 0 || posY < 0) {
            throw new Error("座標は正でなければなりません。");
        }
        if (type === MacroImgFrameIndex.ENERGY) {
            var iconNode_energy = util.$qsh("#disp-energy>.status-icon");
            iconNode_energy.style.backgroundPosition = "-" + x + "px -" + y + "px";
        } else if (type === MacroImgFrameIndex.STRENGTH) {
            var iconNode_strength = util.$qsh("#disp-strength>.status-icon");
            iconNode_strength.style.backgroundPosition = "-" + x + "px -" + y + "px";
        } else if (type === MacroImgFrameIndex.DEFENCE) {
            var iconNode_defence = util.$qsh("#disp-defence>.status-icon");
            iconNode_defence.style.backgroundPosition = "-" + x + "px -" + y + "px";
        } else if (type === MacroImgFrameIndex.GOLD) {
            var iconNode_gold = util.$qsh("#disp-gold>.status-icon");
            iconNode_gold.style.backgroundPosition = "-" + x + "px -" + y + "px";
        } else if (type === MacroImgFrameIndex.WIDE_CELL_ROW) {
            Array.prototype.forEach.call(util.$qsAll("div.wide-cell-row"), (node: HTMLElement) => {
                node.style.backgroundPosition = "-" + x + "px -" + y + "px";
            });
        } else if (type === MacroImgFrameIndex.ITEM_BG) {
            Array.prototype.forEach.call(util.$qsAll("div.item-cell"), (node: HTMLElement) => {
                node.style.backgroundPosition = "-" + x + "px -" + y + "px";
            });
        } else if (type === MacroImgFrameIndex.MAIN_FRAME) {
            this._wwa.setFrameCoord(new Coord(posX, posY));
        } else {
            throw new Error("種別が不正です。");
        }

    }

    private _executeImgBomMacro(): void {
        this._concatEmptyArgs(2);
        var posX = this._parseInt(0);
        var posY = this._parseInt(1);
        if (posX < 0 || posY < 0) {
            throw new Error("座標は正でなければなりません。");
        }
        this._wwa.setBattleEffectCoord(new Coord(posX, posY));
    }

    private _executeDelPlayerMacro(): void {
        this._concatEmptyArgs(1);
        var flag = parseInt(this.macroArgs[0]);
        this._wwa.setDelPlayer(!!flag);
    }
    private _executeFaceMacro(): void {
        this._concatEmptyArgs(6);
        var destPosX = this._parseInt(0);
        var destPosY = this._parseInt(1);
        var srcPosX = this._parseInt(2);
        var srcPosY = this._parseInt(3);
        var srcWidth = this._parseInt(4);
        var srcHeight = this._parseInt(5);
        var face: Face;

        if (destPosX < 0 || destPosY < 0 ||
            srcPosX < 0 || srcPosY < 0 ||
            srcWidth < 0 || srcHeight < 0) {
            throw new Error("各引数は0以上の整数でなければなりません。");
        }

        face = new Face(
            new Coord(destPosX, destPosY),
            new Coord(srcPosX, srcPosY),
            new Coord(srcWidth, srcHeight)
        );

        this._wwa.addFace(face);
    }
    private _executeEffectMacro(): void {
        this._concatEmptyArgs(1);
        var waitTime = this._parseInt(0);
        if (waitTime < 0) {
            throw new Error("待ち時間は0以上の整数でなければなりません。");
        }
        if (waitTime === 0) {
            this._wwa.stopEffect();
        }
        var coords: Coord[] = [];
        for (var i = 1; i < this.macroArgs.length; i += 2) {
            var cropX = this._parseInt(i);
            var cropY = 0;
            if (cropX < 0) {
                throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
            }
            if (i + 1 === this.macroArgs.length) {
                throw new Error("画像のパーツ座標指定で、Y座標が指定されていません。");
            }
            cropY = this._parseInt(i + 1);
            if (cropY < 0) {
                throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
            }
            coords.push(new Coord(cropX, cropY));
        }
        this._wwa.setEffect(waitTime, coords);
    }

    private _executeGameOverMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);

        if (x < 0 || x >= this._wwa.getMapWidth() || y < 0 || y >= this._wwa.getMapWidth()) {
            throw new Error("マップの範囲外が指定されています!");
        }

        this._wwa.setGameOverPosition(new Coord(x, y));
    }

    private _executeImgClickMacro(): void {
        this._concatEmptyArgs(2);
        if (this.macroArgs.length < 1) {
            throw new Error("引数が少なすぎます");
        }
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        if (x < 0 || y < 0) {
            throw new Error("引数が0以上の整数ではありません");
        }
        this._wwa.setImgClick(new Coord(x, y));
    }

    private _executeEffItemMacro(): void {
        if (this.macroArgs.length < 1) {
            throw new Error("引数が少なすぎます");
        }
        var mode = this._parseInt(0);
        this._wwa.updateItemEffectEnabled(!!mode);
    }

    private _executeStatusMacro(): void {
        this._concatEmptyArgs(2);
        var type = this._parseInt(0);
        var value = this._parseInt(1);

        if (type < 0 || 4 < type) {
            throw new Error("ステータス種別が範囲外です。");
        }

        this._wwa.setPlayerStatus(type, value);
    }

    private _executeColorMacro(): void {
        this._concatEmptyArgs(4);
        var type = this._parseInt(0);
        var r = this._parseInt(1);
        var g = this._parseInt(2);
        var b = this._parseInt(3);
        if (type < 0 || type > 5) {
            throw new Error("種別は0から5までです");
        }
        if (r < 0 || r > 255 ||
            g < 0 || g > 255 ||
            b < 0 || b > 255) {
            throw new Error("色が範囲外です");
        }
        this._wwa.changeStyleRule(type, r, g, b);
    }

    private _executeWaitMacro(): void {
        // 動作が不安定なので、実装しないことになりました。
        throw new Error("Not implemented!");
        /*
        if (this.macroArgs.length < 1) {
        throw new Error("引数が少なすぎます");
        }
        var t = parseInt(this.macroArgs[0]);
        if (isNaN(t)) {
        throw new Error("引数が整数ではありません");
        }
        if (t < 0) {
        throw new Error("待ち時間が正ではありません");
        }
        this._wwa.setWaitTime( t );
        */
    }

    private _executeSoundMacro(): void {
        this._concatEmptyArgs(1);
        var id = parseInt(this.macroArgs[0]);
        this._wwa.playSound(id);
    }
}

export function parseMacro(
    wwa: WWA,
    partsID: number,
    partsType: PartsType,
    position: Coord,
    macroStr: string
): Macro {

    var matchInfo = macroStr.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)$/);
    if (matchInfo === null || matchInfo.length !== 3) {
        throw new Error("マクロではありません");
    }
    var macroType = matchInfo[1];
    var macroIndex = macrotable["$" + macroType.toLowerCase()];
    if (macroIndex === void 0) {
        // undefined macro
        return new Macro(wwa, partsID, partsType, position, MacroType.UNDEFINED, matchInfo[2].split(","));
    }
    return new Macro(wwa, partsID, partsType, position, macroIndex, matchInfo[2].split(",").map((e) => { return e.trim(); }));
}



export class TextWindow {
    protected _element: HTMLElement;

    constructor(
        protected _wwa: WWA,
        protected _coord: Coord,
        protected _width: number,
        protected _height: number,
        protected _isVisible: boolean,
        protected _parentElement: HTMLElement,
        zIndex: number
    ) {
        this._element = document.createElement("div");
        this._element.style.position = "absolute";
        this._element.style.borderWidth = "2px";
        this._element.style.borderStyle = "solid";
        if (_wwa.isClassicMode()) {
            this._element.style.borderRadius = "15px";
        } else {
            this._element.style.borderRadius = "10px";
        }
        this._element.classList.add("wwa-message-window");
        this._element.style.zIndex = zIndex + "";
        //            this._element.style.opacity = "0.9";
        this._element.style.left = this._coord.x + "px";
        this._element.style.top = this._coord.y + "px";
        this._element.style.width = this._width + "px";
        this._element.style.height = this._height + "px";
        this._parentElement.appendChild(this._element);
    }

    public update(a?: any): void {
        /* サブクラスで実装してください。*/
    }

    public show(): void {
        this._isVisible = true;
        this._element.style.display = "block";
        this.update();
    }
    public hide(): void {
        this._isVisible = false;
        this._element.style.display = "none";
        this.update();
    }
    public isVisible(): boolean {
        return this._isVisible;
    }
}

export class MosterWindow extends TextWindow {
    protected _monsterBox: HTMLDivElement;
    protected _energyBox: HTMLDivElement;
    protected _strengthBox: HTMLDivElement;
    protected _defenceBox: HTMLDivElement;

    constructor(
        wwa: WWA,
        coord: Coord,
        width: number,
        height: number,
        isVisible: boolean,
        parentElement: HTMLElement,
        protected _cgFileName: string
    ) {
        super(wwa, new Coord(coord.x, coord.y), width, height, isVisible, parentElement, 201);

        this._monsterBox = document.createElement("div");
        this._monsterBox.style.width = WWAConsts.CHIP_SIZE + "px";
        this._monsterBox.style.height = WWAConsts.CHIP_SIZE + "px";
        this._monsterBox.style.position = "absolute";
        this._monsterBox.style.left = "10px";
        this._monsterBox.style.top = "10px";
        this._monsterBox.style.backgroundImage = "url(" + this._cgFileName.replace("(", "\\(").replace(")", "\\)") + ")";
        this._monsterBox.style.backgroundPosition = "0 0";
        this._element.appendChild(this._monsterBox);

        this._energyBox = document.createElement("div");
        this._energyBox.style.position = "absolute";
        this._energyBox.style.left = "80px";
        this._energyBox.style.top = "10px";
        this._energyBox.textContent = "生命力 0";
        this._element.appendChild(this._energyBox);

        this._strengthBox = document.createElement("div");
        this._strengthBox.style.position = "absolute";
        this._strengthBox.style.left = "80px";
        this._strengthBox.style.top = "30px";
        this._strengthBox.textContent = "攻撃力 0";
        this._element.appendChild(this._strengthBox);

        this._defenceBox = document.createElement("div");
        this._defenceBox.style.position = "absolute";
        this._defenceBox.style.left = "180px";
        this._defenceBox.style.top = "30px";
        this._defenceBox.textContent = "防御力 0";
        this._element.appendChild(this._defenceBox);

        if (this._isVisible) {
            this._element.style.display = "block";
        } else {
            this._element.style.display = "none";
        }

    }

    public update(monster?: Monster) {
        if (monster !== void 0) {
            this._monsterBox.style.backgroundPosition =
                "-" + monster.imgCoord.x + "px -" + monster.imgCoord.y + "px";
            this._energyBox.textContent = "生命力 " + monster.status.energy;
            this._strengthBox.textContent = "攻撃力 " + monster.status.strength;
            this._defenceBox.textContent = "防御力 " + monster.status.defence;
        }

    }

}

export class ScoreWindow extends TextWindow {
    constructor(
        wwa: WWA,
        coord: Coord,
        isVisible: boolean,
        parentElement: HTMLElement
    ) {
        if (wwa.isClassicMode()) {
            super(wwa, new Coord(WWAConsts.CHIP_SIZE * 2, 30), WWAConsts.CHIP_SIZE * 7, 40, isVisible, parentElement, 202);
            this._element.style.borderWidth = "0";
            this._element.style.borderRadius = "4px";
            this._element.style.fontSize = "20px";
            this._element.style.lineHeight = "40px";
        } else {
            super(wwa, new Coord(coord.x, coord.y), 340, 30, isVisible, parentElement, 202);
        }
        this._element.style.textAlign = "center";
        if (this._isVisible) {
            this._element.style.display = "block";
        } else {
            this._element.style.display = "none";
        }
        this.update(0);
    }


    public update(score?: number) {
        if (score !== void 0) {
            this._element.textContent = "Score: " + score;
        }
    }
}

export enum Positioning {
    TOP,
    CENTER,
    BOTTOM,
    SCORE
}

export class MessageWindow /* implements TextWindow(予定)*/ {
    private _wwa: WWA;

    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    private _message: string;

    private _cgFileName: string;
    private _isVisible: boolean;
    private _isYesno: boolean;
    private _isItemMenu: boolean;
    private _isInputDisable: boolean;

    private _element: HTMLElement;
    private _msgWrapperElement: HTMLElement;
    private _dummyElement: HTMLElement;
    private _ynWrapperElement: HTMLElement;

    private _divYesElement: HTMLElement;
    private _divNoElement: HTMLElement;
    private _parentElement: HTMLElement;

    constructor(
        wwa: WWA,
        x: number,
        y: number,
        width: number,
        height: number,
        message: string,
        cgFileName: string,
        isVisible: boolean,
        isYesno: boolean,
        isItemMenu: boolean,
        parentElement: HTMLElement
    ) {
        var thisA = this;

        var escapedFilename: string = cgFileName.replace("(", "\\(").replace(")", "\\)");
        this._wwa = wwa;
        this._cgFileName = cgFileName;
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._message = message;
        this._isVisible = isVisible;
        this._isYesno = isYesno;
        this._isItemMenu = isItemMenu;
        this._element = document.createElement("div");
        this._element.id = "wwa-text-message-window";
        this._element.style.position = "absolute";
        this._element.style.borderWidth = "2px";
        this._element.style.borderStyle = "solid";
        if (wwa.isClassicMode()) {
            this._element.style.borderRadius = "15px";
        } else {
            this._element.style.borderRadius = "10px";
        }
        this._element.classList.add("wwa-message-window");
        this._element.style.zIndex = "400";
        this._msgWrapperElement = document.createElement("div");
        this._msgWrapperElement.style.textAlign = "left";
        this._msgWrapperElement.style.wordWrap = "break-word";
        if (wwa.isClassicMode()) {
            this._msgWrapperElement.style.margin = "8px 0 8px 16px";
        } else {
            this._msgWrapperElement.style.margin = "0";
            this._msgWrapperElement.style.padding = "7px";
        }
        this._element.appendChild(this._msgWrapperElement);
        this._dummyElement = document.createElement("div");
        this._dummyElement.style.display = "none";
        this._dummyElement.style.padding = "0";
        this._dummyElement.style.margin = "0";
        this._dummyElement.style.height = "55px";
        this._element.appendChild(this._dummyElement);
        this._ynWrapperElement = document.createElement("div");
        this._ynWrapperElement.style.padding = "0";
        this._ynWrapperElement.style.margin = "0";
        this._ynWrapperElement.style.position = "absolute";
        this._ynWrapperElement.style.left = "246px";
        this._ynWrapperElement.style.bottom = "10px";
        this._ynWrapperElement.style.width = "80px";
        this._ynWrapperElement.style.height = "40px";
        this._ynWrapperElement.style.zIndex = "10";
        this._element.appendChild(this._ynWrapperElement);
        this._parentElement = parentElement;
        this._parentElement.appendChild(this._element);
        this._divYesElement = document.createElement("div");
        this._divYesElement.style.padding = "0";
        this._divYesElement.style.margin = "0";
        this._divYesElement.style.cssFloat = "left";
        this._divYesElement.style.width = "40px";
        this._divYesElement.style.height = "40px";
        this._divYesElement.style.background =
            "url(" + escapedFilename + ")";
        this._divYesElement.onclick = function () {
            if (!thisA._isInputDisable) {
                wwa.setYesNoInput(YesNoState.YES);
                thisA.update();
            }
        };
        this._divYesElement.style.cursor = "pointer";
        this._divNoElement = document.createElement("div");
        this._divNoElement.style.padding = "0";
        this._divNoElement.style.margin = "0";
        this._divNoElement.style.cssFloat = "left";
        this._divNoElement.style.width = "40px";
        this._divNoElement.style.height = "40px";
        this._divNoElement.style.background =
            "url(" + escapedFilename + ")";
        this._divNoElement.onclick = function () {
            if (!thisA._isInputDisable) {
                wwa.setYesNoInput(YesNoState.NO);
                thisA.update();
            }
        };
        this._divNoElement.style.cursor = "pointer";
        this._ynWrapperElement.appendChild(this._divYesElement);
        this._ynWrapperElement.appendChild(this._divNoElement);
        thisA._isInputDisable = false;
        this.update();
    }

    public setPosition(x: number, y: number, width: number, height: number): void {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this.update();
    }

    public setPositionByPlayerPosition(existsFaces: boolean, existsScoreWindow: boolean, displayCenter: boolean, playerPos: Position, cameraPos: Position) {
        var playerInScreenY = playerPos.getPartsCoord().substract(cameraPos.getPartsCoord()).y;
        var pos: MPositioning;
        if (existsFaces) {
            pos = MPositioning.BOTTOM;
        } else if (existsScoreWindow) {
            pos = MPositioning.SCORE;
        } else if (displayCenter) {
            pos = MPositioning.CENTER;
        } else if (playerInScreenY >= Math.ceil(WWAConsts.V_PARTS_NUM_IN_WINDOW / 2)) {
            pos = MPositioning.TOP;
        } else {
            pos = MPositioning.BOTTOM;
        }
        this.setPositionEasy(pos);
    }

    public setPositionEasy(pos: Positioning): void {
        var centerPos = Math.floor(this._element.clientHeight / 2);
        if (pos === Positioning.CENTER) {
            this._y = WWAConsts.MAP_WINDOW_HEIGHT / 2 - centerPos;
            this.update();
            return;
        }

        if (pos === Positioning.TOP) {
            this._y = Math.max(
                20,
                WWAConsts.MAP_WINDOW_HEIGHT / 4 - centerPos) + 10;
            this.update();
            return;
        }

        if (pos === Positioning.BOTTOM) {
            this._y = Math.min(
                WWAConsts.MAP_WINDOW_HEIGHT - 20 - this._element.clientHeight,
                WWAConsts.MAP_WINDOW_HEIGHT * 3 / 4 - centerPos);
            this.update();
            return;
        }

        if (pos === Positioning.SCORE) {
            this._y = 80;
            this.update();
            return;
        }

    }

    public setMessage(message: string): void {
        this._message = message;
        this.update();
    }
    public setYesNoChoice(isYesNo: boolean): boolean {
        this._isInputDisable = false;
        this._isYesno = isYesNo;
        this.update();
        return this._isYesno;
    }
    public isYesNoChoice(): boolean {
        return this._isYesno;
    }
    public setItemMenuChoice(isItemMenu: boolean): boolean {
        this._isInputDisable = false;
        this._isItemMenu = isItemMenu;
        this.update();
        return this._isItemMenu;
    }
    public isItemMenuChoice(): boolean {
        return this._isItemMenu;
    }
    public setInputDisable(): void {
        this._isInputDisable = true;
    }
    public isInputDisable(): boolean {
        return this._isInputDisable;
    }
    public show(): void {
        this._isVisible = true;
        this.update();
    }
    public hide(): void {
        this._isVisible = false;
        this.update();
    }
    public isVisible(): boolean {
        return this._isVisible;
    }
    private isWideChar(char: string): boolean {
        return (char.match(/^[^\x01-\x7E\xA1-\xDF]+$/) !== null);
    }
    public update(): void {
        var base = this._wwa.getYesNoImgCoord();
        if (this._isYesno) {
            if (this._wwa.getYesNoState() === YesNoState.YES) {
                this._divYesElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_YESP_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
                this._divNoElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_NO_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
            } else if (this._wwa.getYesNoState() === YesNoState.NO) {
                this._divYesElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_YES_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
                this._divNoElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_NOP_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
            } else {
                this._divYesElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_YES_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
                this._divNoElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_NO_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
            }
            this._ynWrapperElement.style.display = "block";
        } else {
            this._ynWrapperElement.style.display = "none";
        }
        this._msgWrapperElement.textContent = "";
        var mesArray = this._message.split("\n");
        mesArray.forEach((line, i) => {
            var lsp = document.createElement("span"); // Logical SPan
            if (this._wwa.isClassicMode()) {
                var count = 0, lineStr = "";
                for (var j = 0; j < mesArray[i].length || count != 0; j++) { // 1文字
                    if (this.isWideChar(mesArray[i].charAt(j))) {
                        count += 2; // 全角の場合
                    } else {
                        count += 1; // 半角の場合
                    }
                    lineStr += mesArray[i].charAt(j);
                    if (count + 1 > WWAConsts.MSG_STR_WIDTH * 2) {
                        if (mesArray[i].charAt(j + 1) === "。" || mesArray[i].charAt(j + 1) === "、") {
                            lineStr += mesArray[i].charAt(j + 1); // 句読点の場合は行末に入れる
                            j++;
                        }
                        var vsp = document.createElement("span"); // View SPan
                        vsp.style.display = "inline-block";
                        vsp.style.width = "100%";
                        vsp.textContent = lineStr;
                        lsp.appendChild(vsp);
                        count = 0;
                        lineStr = "";
                    }
                }
            } else {
                lsp.textContent = mesArray[i];
            }
            this._msgWrapperElement.appendChild(lsp);
            this._msgWrapperElement.appendChild(document.createElement("br"));
        });
        if (this._isVisible) {
            this._element.style.left = this._x + "px";
            this._element.style.top = this._y + "px";
        } else {
            // HACK: display: none;にしてもいいのだが、そうすると、
            // 裏方でclientHeight(プレイヤー座標から位置を決定する時に必要!!)が取得できなくなる。
            this._element.style.left = "-999999px";
            this._element.style.top = "-999999px";
        }
        this._element.style.width = this._width + "px";
        this._element.style.minHeight = this._height + "px"; // minなのでoverflowしても安心!!!
        this._dummyElement.style.display = this._isYesno ? "block" : "none";
        //            this._element.style.display = this._isVisible ? "block" : "none";
    }
}



