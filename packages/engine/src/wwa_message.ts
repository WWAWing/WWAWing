import { WWA } from "./wwa_main";
import {
    WWAConsts,
    WWASaveConsts,
    Coord,
    PartsType,
    Face,
    MacroType,
    MacroImgFrameIndex,
    macrotable,
    YesNoState,
    Position,
    DEVICE_TYPE,
    Direction,
    StatusSolutionKind,
    PreprocessMacroType,
} from "./wwa_data";
import {
    Monster
} from "./wwa_monster";
import {
    WWAData
} from "./wwa_data";
import {
    WWASave,
    WWASaveData
} from "./wwa_save";
import { type TokenValues, type Descriminant, evaluateDescriminant } from "./wwa_expression";

/**
 * 値が更新された時に、再評価されるべき値を返す関数の型。
 */
export type LazyEvaluateValue = () => number;
/**
 * 通常のメッセージ文字列と LazyEvaluateValue が混在した配列の型。
 * 例: ["変数 10 番の値は", () => userVar[10], "です。\n文字列中に改行も入りえます。"]
 */
export type MessageSegments = (string | LazyEvaluateValue)[];


export class Page {
    constructor(
        public firstNode?: Node,
        public isLastPage?: boolean, // 旧 endOfPartsEvent相当
        public showChoice?: boolean,
        public isSystemMessage?: boolean
    ) {

    }
}


export abstract class Node {
    constructor() {
    }
}

export interface Branch {
    /**
     * 判別式
     * 構文エラーの場合は undefined (false と同等扱い) になります。
     */
    descriminant?: Descriminant;
    next?: Node
}

/**
 * メッセージ中の分岐ノード
 */
export class Junction extends Node {
    constructor(
        public branches: Branch[] = [],
    ){
        super();        
    }
    appendBranch(branch: Branch): void {
        this.branches.push(branch);
    }
    getLastUnconnectedBranch(): Branch | undefined {
        for (let branch of this.branches) {
            if (!branch.next) {
                return branch;
            }
        }
        return undefined;
    }
    evaluateAndGetNextNode(tokenValues: TokenValues): Node | undefined {
        for (let branch of this.branches) {
            // 判別式が undefined の場合は $else 節に相当するのでそのまま次の Node を返す
            // 判別式が null の場合はエラーなので、仕方なく次の Node を返す
            if (!branch.descriminant || evaluateDescriminant(branch.descriminant, tokenValues)) {
                return branch.next;
            }
        }
        return undefined;
    }
}

/**
 * パース済メッセージ。
 * 通常のメッセージの他、マクロの情報などを持ちます。
 */
export class ParsedMessage extends Node {
    private messageArray: MessageSegments;
    constructor(
        textOrMessageSegments: string | MessageSegments,
        public macro?: Macro[],
        public next?: Node
    ) {
        super();
        this.messageArray = this.parseMessage(textOrMessageSegments);
        if (this.macro === void 0) {
            this.macro = [];
        }
    }

    /**
     * メッセージが空であれば true を返す。
     * 空配列の他、空文字列しかない1要素の配列を空とみなす。
     * マクロの有無は考慮しない。
     */
    isEmpty(): boolean {
        return (
            this.messageArray.length === 0 ||
            (this.messageArray.length === 1 && this.messageArray[0] === "")
        );
    }

    /**
     * LazyEvaluateValue を評価して、表示可能なメッセージを生成する。
     */
    generatePrintableMessage(): string {
        return this.messageArray.reduce<string>((prevMessage, item) => {
            const evaluatedItem = typeof item === "string" ? item : item();
            return `${prevMessage}${evaluatedItem}`;
        }, "")
    }

    appendMessage(message: string | MessageSegments, withNewLine: boolean = false): void {
        this.messageArray = this.messageArray.concat(withNewLine ? ["\n"] : [], this.parseMessage(message));
    }

    private parseMessage(message: string | MessageSegments): MessageSegments {
        return typeof message === "string" ? [message] : message; 
    }
}

export function isEmptyMessageTree(node: Node | undefined): boolean {
    if (node === undefined) {
        return true;
    } else if (node instanceof Junction) {
        return node.branches.reduce((prev, branch) => prev && isEmptyMessageTree(branch.next), true)
    } else if (node instanceof ParsedMessage) {
        return node.isEmpty() && isEmptyMessageTree(node.next);
    }
}

export function getLastMessage(node: undefined): undefined;
export function getLastMessage(node: Node): Node;
export function getLastMessage(node: Node | undefined): Node | undefined {
    if (node === undefined) {
        return undefined;
    } else if (node instanceof Junction) {
        throw new Error("分岐が含まれているため、最後のメッセージを取得することができません。");
    } else if (node instanceof ParsedMessage) {
        return node.next === undefined ? node : getLastMessage(node.next);
    }
}

export function concatMessage(node1: Node | undefined, node2: Node | undefined): Node | undefined {
    if (node1 === undefined) {
        return node2;
    } else {
        const lastMessage = getLastMessage(node1);
        if (lastMessage instanceof ParsedMessage) {
            lastMessage.next = node2;
        }
    }
}

export type MessageLineType = PreprocessMacroType | "text" | "normalMacro";
export const messagLineIsText = (lineType: MessageLineType) => lineType === MacroType.SHOW_STR || lineType === "text" || lineType === "normalMacro";
export type MessageLine = (
    { type: PreprocessMacroType; text: string; macro: Macro; } |
    { type: "normalMacro"; text: string; macro: Macro; } |
    { type: "text"; text: string; macro?: undefined }
);



export class Macro {
    constructor(
        private _wwa: WWA,
        private _triggerPartsID: number,
        private _triggerPartsType: number,
        private _triggerPartsPosition: Coord,
        public macroType: MacroType,
        public macroArgs: string[]
    ) { }

    // 分岐関連マクロか ($if, $else_if, $else, $endif)
    public isJunction(): boolean {
        const IFElseMacroList = [MacroType.IF, MacroType.ELSE_IF, MacroType.ELSE, MacroType.END_IF];
        return IFElseMacroList.includes(this.macroType);
    }

    public execute(): {isGameOver?: true} {
        try {
            switch (this.macroType) {
                case MacroType.IMGPLAYER: {
                    this._executeImgPlayerMacro();
                    return {};
                }
                case MacroType.IMGYESNO: {
                    this._executeImgYesNoMacro();
                    return {};
                }
                case MacroType.HPMAX: {
                    this._executeHPMaxMacro();
                    return {};
                }
                case MacroType.SAVE: {
                    this._executeSaveMacro();
                    return {};
                }
                case MacroType.ITEM: {
                    this._executeItemMacro();
                    return {};
                }
                case MacroType.DEFAULT: {
                    this._executeDefaultMacro();
                    return {};
                }
                case MacroType.OLDMAP: {
                    this._executeOldMapMacro();
                    return {};
                }
                case MacroType.PARTS: {
                    this._executePartsMacro();
                    return {};
                }
                case MacroType.MOVE: {
                    this._executeMoveMacro();
                    return {};
                }
                case MacroType.MAP: {
                    this._executeMapMacro();
                    return {};
                }
                case MacroType.DIRMAP: {
                    this._executeDirMapMacro();
                    return {};
                }
                case MacroType.IMGFRAME: {
                    this._executeImgFrameMacro();
                    return {};
                }
                case MacroType.IMGBOM: {
                    this._executeImgBomMacro();
                    return {};
                }
                case MacroType.DELPLAYER: {
                    this._executeDelPlayerMacro();
                    return {};
                }
                case MacroType.FACE: {
                    this._executeFaceMacro();
                    return {};
                }
                case MacroType.EFFECT: {
                    this._executeEffectMacro();
                    return {};
                }
                case MacroType.GAMEOVER: {
                    this._executeGameOverMacro();
                    return {};
                }
                case MacroType.IMGCLICK: {
                    this._executeImgClickMacro();
                    return {};
                }
                case MacroType.STATUS: {
                    const { isGameOver } = this._executeStatusMacro();
                    return {isGameOver};
                }
                case MacroType.EFFITEM: {
                    this._executeEffItemMacro();
                    return {};
                }
                case MacroType.COLOR: {
                    this._executeColorMacro();
                    return {};
                }
                case MacroType.WAIT: {
                    this._executeWaitMacro();
                    return {};
                }
                case MacroType.SOUND: {
                    this._executeSoundMacro();
                    return {};
                }
                case MacroType.GAMEPAD_BUTTON: {
                    this._executeGamePadButtonMacro();
                    return {};
                }
                case MacroType.OLDMOVE: {
                    this._executeOldMoveMacro();
                    return {};
                }
                case MacroType.JUMPGATE: {
                    this._executeJumpGateMacro();
                    return {};
                }
                // 現在の座標を記憶
                case MacroType.RECPOSITION: {
                    this._executeRecPositionMacro();
                    return {};
                }
                // 記憶していた座標にジャンプ
                case MacroType.JUMPRECPOSITION: {
                    this._executeJumpRecPositionMacro();
                    return {};
                }
                // 変数デバッグ出力
                case MacroType.CONSOLE_LOG: {
                    this._executeConsoleLogMacro();
                    return {};
                }
                // 変数 <- HP
                case MacroType.COPY_HP_TO: {
                    this._executeCopyHpToMacro();
                    return {};
                }
                // HP <- 変数
                case MacroType.SET_HP: {
                    const { isGameOver } = this._executeSetHPMacro();
                    return { isGameOver };
                }
                // 変数 <- HPMAX
                case MacroType.COPY_HPMAX_TO: {
                    this._executeCopyHpMaxToMacro();
                    return {};
                }
                // HPMAX <- 変数
                case MacroType.SET_HPMAX: {
                    this._executeSetHpMaxMacro();
                    return {};
                }
                // 変数 <- AT
                case MacroType.COPY_AT_TO: {
                    this._executeCopyAtToMacro();
                    return {};
                }
                // AT <- 変数
                case MacroType.SET_AT: {
                    this._executeSetAtMacro();
                    return {};
                }
                // 変数 <- DF
                case MacroType.COPY_DF_TO: {
                    this._executeCopyDfToMacro();
                    return {};
                }
                // DF <- 変数
                case MacroType.SET_DF: {
                    this._executeSetDfMacro();
                    return {};
                }
                // 変数 <- MONEY
                case MacroType.COPY_MONEY_TO: {
                    this._executeCopyMoneyToMacro();
                    return {};
                }
                // MONEY <- 変数
                case MacroType.SET_MONEY: {
                    this._executeSetMoneyMacro();
                    return {};
                }
                // 歩数カウント代入
                case MacroType.COPY_STEP_COUNT_TO: {
                    this._executeSetStepCountMacro();
                    return {};
                }
                // 変数に定数代入
                case MacroType.VAR_SET_VAL: {
                    this._executeVarSetValMacro();
                    return {};
                }
                // 変数に変数代入
                case MacroType.VAR_SET: {
                    this._executeVarSetMacro();
                    return {};
                }
                // 足し算代入
                case MacroType.VAR_ADD: {
                    this._executeVarAddMacro();
                    return {};
                }
                // 引き算代入
                case MacroType.VAR_SUB: {
                    this._executeVarSubMacro();
                    return {};
                }
                // 掛け算代入
                case MacroType.VAR_MUL: {
                    this._executeVarMulMacro();
                    return {};
                }
                // 割り算代入
                case MacroType.VAR_DIV: {
                    this._executeVarDivMacro();
                    return {};
                }
                // 割り算の余り代入
                case MacroType.VAR_MOD: {
                    this._executeVarModMacro();
                    return {};
                }
                // 変数Xに1からYまでの乱数を代入
                case MacroType.VAR_SET_RAND: {
                    this._executeVarSetRandMacro();
                    return {};
                }
                // 速度変更禁止マクロ
                case MacroType.GAME_SPEED: {
                    this._executeGameSpeedMacro();
                    return {};
                }
                // 変数付きのメッセージ表示
                case MacroType.SHOW_STR: {
                    // $show_str マクロは、キューの組み立て時に処理されていて、既に存在しないはず
                    return {};
                }
                // IF文
                case MacroType.IF: {
                    // $if マクロ (新実装) は、キューの組み立て時に処理されていて、既に存在しないはず
                    return {};
                }
                // IF文 (旧実装)
                case MacroType.LEGACY_IF: {
                    this._executeLegacyIfMacro();
                    return {};
                }
                // ELSE-IF文
                case MacroType.ELSE_IF: {
                    // $else_if マクロは、キューの組み立て時に処理されていて、既に存在しないはず
                    return {};
                }
                // ELSE文
                case MacroType.ELSE: {
                    // $else マクロは、キューの組み立て時に処理されていて、既に存在しないはず
                    return {};
                }
                // END-IF文
                case MacroType.END_IF: {
                    // $endif マクロは、キューの組み立て時に処理されていて、既に存在しないはず
                    return {};
                }
                // 速度設定
                case MacroType.SET_SPEED: {
                    this._executeSetSpeedMacro();
                    return {};
                }
                // プレイ時間変数代入
                case MacroType.COPY_TIME_TO: {
                    this._executeCopyTimeToMacro();
                    return {};
                }
                // ステータスを隠す
                case MacroType.HIDE_STATUS: {
                    this._executeHideStatusMacro();
                    return {};
                }
                // $map の変数対応版
                case MacroType.VAR_MAP: {
                    this._executeVarMapMacro();
                    return {};
                }
                case MacroType.NO_GAMEOVER: {
                    this._executeNoGameOverMacro();
                    return {};
                }
                case MacroType.SET: {
                    const { isGameOver } = this._executeSetMacro();
                    return { isGameOver }
                }
                default: {
                    console.log("不明なマクロIDが実行されました:" + this.macroType);
                    return {};
                }
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
        this._concatEmptyArgs(2);
        const num = this._parseInt(0);
        const kind = this._parseStatusKind(this._parseInt(1));
        this._wwa.setUserVarAT(num, kind);
    }
    // copy_df_toマクロ実行部
    private _executeCopyDfToMacro(): void {
        this._concatEmptyArgs(2);
        const num = this._parseInt(0);
        const kind = this._parseStatusKind(this._parseInt(1));
        this._wwa.setUserVarDF(num, kind);
    }
    private _parseStatusKind(kind: number): StatusSolutionKind {
        switch (kind) {
            case 0:
                return "all";
            case 1:
                return "bare"
            case 2:
                return "equipment";
            default:
                return "all";
        }
    }
    // copy_money_toマクロ実行部
    private _executeCopyMoneyToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarMONEY(num);
    }
    // set_hpマクロ実行部
    private _executeSetHPMacro(): { isGameOver?: true } {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        return this._wwa.setHPUserVar(num, true);
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
    // var_modマクロ実行部
    private _executeVarModMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._parseInt(0);
        var y = this._parseInt(1);
        this._wwa.setUserValMod(x, y);
    }
    // var_set_randマクロ実行部
    private _executeVarSetRandMacro(): void {
        this._concatEmptyArgs(3);
        const x = this._parseInt(0);
        const y = this._parseInt(1);
        const n = this._parseInt(2, 0);
        this._wwa.setUserValRandNum(x, y, n);
    }
    // game_speedマクロ実行部
    private _executeGameSpeedMacro(): void {
        this._concatEmptyArgs(1);
        var speedChangeFlag = !!this._parseInt(0);
        this._wwa.speedChangeJudge(speedChangeFlag);
    }

    // IFマクロ(旧実装)実行部
    private _executeLegacyIfMacro(): void {
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
        // マクロのスピードは 1...6 だが、内部では 0...5 なので変換
        this._wwa.setPlayerSpeedIndex(num - 1);
    }
    // COPY_TO_TIMEマクロ実行部
    private _executeCopyTimeToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._parseInt(0);
        this._wwa.setUserVarPlayTime(num);
    }
    // HIDE_STATUS マクロ実行部
    private _executeHideStatusMacro(): void {
        this._concatEmptyArgs(2);
        var no = this._parseInt(0);
        var isHideNumber = this._parseInt(1);
        var isHide = (isHideNumber === 0) ? false : true;
        this._wwa.hideStatus(no, isHide);
    }
    // VAR_MAP マクロ実行部
    private _executeVarMapMacro(): void {
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

        if (posX < 0 || posY < 0) {
            throw new Error("座標は正でなければなりません。");
        }
        if (type === MacroImgFrameIndex.ENERGY ||
            type === MacroImgFrameIndex.STRENGTH ||
            type === MacroImgFrameIndex.DEFENCE ||
            type === MacroImgFrameIndex.GOLD) {
            this._wwa.setStatusIconCoord(type, new Coord(posX, posY));

        } else if (type === MacroImgFrameIndex.WIDE_CELL_ROW) {
            this._wwa.setWideCellCoord(new Coord(posX, posY));

        } else if (type === MacroImgFrameIndex.ITEM_BG) {
            this._wwa.setItemboxBackgroundPosition({ x: posX, y: posY });

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
            return;
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

    private _executeStatusMacro(): { isGameOver?: true } {
        this._concatEmptyArgs(2);
        var type = this._parseInt(0);
        var value = this._parseInt(1);

        if (type < 0 || 4 < type) {
            throw new Error("ステータス種別が範囲外です。");
        }
        return this._wwa.setPlayerStatus(type, value, true);
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
    private _executeGamePadButtonMacro(): void {
        this._concatEmptyArgs(2);
        var buttonID: number = this._parseInt(0);
        var itemNo: number = this._parseInt(1);

        if (buttonID < 0 || itemNo < 0) {
            throw new Error("各引数は0以上の整数でなければなりません。");
        }

        if (itemNo > WWAConsts.ITEMBOX_SIZE) {
            throw new Error("アイテムボックス上限を超えた数値が指定されました。");
        }
        this._wwa.setGamePadButtonItemTable(buttonID, itemNo);
    }

    private _executeOldMoveMacro(): void {
        this._concatEmptyArgs(1);
        const oldMoveFlag = !!this._parseInt(0);
        this._wwa.setOldMove(oldMoveFlag);
    }

    private _executeNoGameOverMacro(): void {
        this._concatEmptyArgs(1);
        const isGameOverDisabled = this._parseInt(0);
        this._wwa.setGameOverPolicy(isGameOverDisabled);
    }

    private _executeSetMacro(): { isGameOver?: true } {
        return this._wwa.execSetMacro(this.macroArgs[0]);
    }
}

export function parseMacro(
    wwa: WWA,
    partsID: number,
    partsType: PartsType,
    position: Coord,
    macroStr: string
): Macro {

    let matchInfo = macroStr.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)$/);
    if (matchInfo === null || matchInfo.length !== 3) {
        // イコールがつかないタイプのマクロ
        matchInfo = macroStr.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (matchInfo === null || matchInfo.length !== 2) {
            throw new Error("マクロではありません");
        }
    }
    const macroType = matchInfo[1];
    const macroName = `$${macroType.toLowerCase()}`;
    // カンマがある場合の $if は旧実装とみなす
    const macroIndex = macroName === "$if" && macroStr.match(/,/) ? MacroType.LEGACY_IF : macrotable[macroName];
    const macroRightSide = matchInfo[2]? matchInfo[2]: "";
    if (macroIndex === void 0) {
        // undefined macro
        return new Macro(wwa, partsID, partsType, position, MacroType.UNDEFINED, macroRightSide.split(","));
    }
    return new Macro(wwa, partsID, partsType, position, macroIndex, macroRightSide.split(",").map((e) => { return e.trim(); }));
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
        this._wwa.wwaCustomEvent('wwa_window_show', {
            name: this.windowName,
            element: this._element,
            text: this._element.textContent
        });
    }
    public hide(): void {
        this._isVisible = false;
        this._element.style.display = "none";
        this.update();
        this._wwa.wwaCustomEvent('wwa_window_hide', { name: this.windowName });
    }
    public isVisible(): boolean {
        return this._isVisible;
    }

    protected get windowName(): string {
        return "TextWindow";
    }
}

export class MonsterWindow extends TextWindow {
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

    protected get windowName(): string {
        return "MonsterWindow";
    }
}

export class ScoreWindow extends TextWindow {
    protected static WINDOW_NAME: string = "ScoreWindow";
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

    protected get windowName(): string {
        return "ScoreWindow";
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
    private _isSave: boolean;
    private _isItemMenu: boolean;
    private _isInputDisable: boolean;

    private _element: HTMLElement;
    private _msgWrapperElement: HTMLElement;

    private _dummyElement: HTMLElement;
    private _saveElement: HTMLElement;
    private _ynWrapperElement: HTMLElement;

    private _divYesElement: HTMLElement;
    private _divNoElement: HTMLElement;
    private _parentElement: HTMLElement;
    private _wwaSave: WWASave = void 0;
    private _save_select_id: number = 0;
    private _save_counter: number = 0;
    private _save_close: boolean = false;

    constructor(
        wwa: WWA,
        x: number,
        y: number,
        width: number,
        height: number,
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
        this._message = "";
        this._isVisible = isVisible;
        this._isYesno = isYesno;
        this._isItemMenu = isItemMenu;

        this._element = document.createElement("div");
        this._element.id = "wwa-text-message-window";
        this._element.classList.add("wwa-message-window");

        this._msgWrapperElement = document.createElement("div");
        this._msgWrapperElement.style.textAlign = "left";
        this._msgWrapperElement.style.wordWrap = "break-word";
        this._msgWrapperElement.style.margin = wwa.isClassicMode() ? "8px 0 8px 16px" : "0";
        this._msgWrapperElement.style.padding = wwa.isClassicMode() ? "0" : "7px";
        this._element.appendChild(this._msgWrapperElement);
        this._saveElement = document.createElement("div");
        this._saveElement.style.padding = "0";
        this._saveElement.style.margin = "0";
        this._element.appendChild(this._saveElement);
        this._dummyElement = document.createElement("div");
        this._dummyElement.style.display = "none";
        this._dummyElement.style.padding = "0";
        this._dummyElement.style.margin = "0";
        this._dummyElement.style.height = "55px";
        this._element.appendChild(this._dummyElement);
        this._ynWrapperElement = document.createElement("div");
        this._ynWrapperElement.classList.add("wwa-yesno-wrapper");
        this._element.appendChild(this._ynWrapperElement);

        this._parentElement = parentElement;
        this._parentElement.appendChild(this._element);

        /**
         * @todo YesNo ボタンは可能であればCSSに収めたい
         */
        this._divYesElement = document.createElement("div");
        this._divYesElement.classList.add("wwa-yes-button");
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
        this._divNoElement.classList.add("wwa-no-button");
        this._divNoElement.style.background =
            "url(" + escapedFilename + ")";
        this._divNoElement.onclick = function () {
            if (!thisA._isInputDisable) {
                wwa.setYesNoInput(YesNoState.NO);
                thisA.update();
            }
        };
        this._ynWrapperElement.appendChild(this._divYesElement);
        this._ynWrapperElement.appendChild(this._divNoElement);

        thisA._isInputDisable = false;
        switch (wwa.userDevice.device) {
            case DEVICE_TYPE.SP:
            case DEVICE_TYPE.VR:
                //スマートフォン用に拡大
                this._parentElement.classList.add("useScaleUp");
                break;
        }
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
        var pos: Positioning;
        if (existsFaces) {
            pos = Positioning.BOTTOM;
        } else if (existsScoreWindow) {
            pos = Positioning.SCORE;
        } else if (displayCenter) {
            pos = Positioning.CENTER;
        } else if (playerInScreenY >= Math.ceil(WWAConsts.V_PARTS_NUM_IN_WINDOW / 2)) {
            pos = Positioning.TOP;
        } else {
            pos = Positioning.BOTTOM;
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
    public clear(): void {
        this._message = "";
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
    public isSaveChoice(): boolean {
        return this._isSave;
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
    /**
     * クラシックモード用: 1行分のテキストを表示する要素を構築します。
     * @param message 挿入したいメッセージ
     * @returns {HTMLSpanElement} 1行分のテキストが含まれている span 要素
     */
    private createClassicTextElement(message: string): HTMLSpanElement {
        var lsp = document.createElement("span");
        let count = 0;
        let lineStr = "";

        for (let j = 0; j < message.length || count != 0; j++) { // 1文字
            if (this.isWideChar(message.charAt(j))) {
                count += 2; // 全角の場合
            } else {
                count += 1; // 半角の場合
            }
            lineStr += message.charAt(j);
            if (count + 1 > WWAConsts.MSG_STR_WIDTH * 2) {
                if (message.charAt(j + 1) === "。" || message.charAt(j + 1) === "、") {
                    lineStr += message.charAt(j + 1); // 句読点の場合は行末に入れる
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
        return lsp;
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
            let lsp: HTMLSpanElement; // Logical SPan
            if (this._wwa.isClassicMode()) {
                lsp = this.createClassicTextElement(line);
            } else {
                lsp = document.createElement("span");
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
        if (this._isSave) {
            this._saveElement.style.display = "block";
        } else {
            this._saveElement.style.display = "none";
        }
        this._element.style.width = this._width + "px";
        this._element.style.minHeight = this._height + "px"; // minなのでoverflowしても安心!!!
    }
    setWWASave(wwaSave: WWASave) {
        this._wwaSave = wwaSave;
    }

    createSaveDom(): void {
        var loadWWAData: WWASaveData;
        var owner_div, savedata_main_div, ss_div, energy_div, span, energy_icon_div, energy_original_dom, energy_status_value_div, backgroundPositionText, backgroundImageText;
        owner_div = document.createElement("div");
        energy_original_dom = document.getElementById("disp-energy");
        backgroundPositionText = energy_original_dom.style["backgroundPosition"];
        backgroundImageText = energy_original_dom.style["backgroundImage"];
        var len: number = this._wwaSave.list.length;
        for (var i = 0; i < len; i++) {
            loadWWAData = this._wwaSave.list[i];

            savedata_main_div = document.createElement("div");
            savedata_main_div.classList.add("savedata");
            savedata_main_div.setAttribute("save_id", i);
            savedata_main_div.addEventListener("click", (e): void => {
                this.setSaveID(e.currentTarget.getAttribute("save_id") | 0);
                this._save_close = true;
                e.preventDefault();
            });

            ss_div = document.createElement("div");
            ss_div.classList.add("ss");
            savedata_main_div.appendChild(ss_div);

            energy_div = document.createElement("div");
            energy_div.classList.add("wide-cell-row");
            energy_div.style["backgroundPosition"] = backgroundPositionText;
            energy_div.style["backgroundImage"] = backgroundImageText;
            savedata_main_div.appendChild(energy_div);
            owner_div.appendChild(savedata_main_div);


            if (loadWWAData.flag) {
                //セーブデータあり
                ss_div.appendChild(loadWWAData.cvs);

                span = document.createElement("span");
                span.textContent = loadWWAData.getDateText();//時刻の表示
                if (loadWWAData.isLastSaveData()) {
                    span.style.color = WWASaveConsts.DATE_LAST_SAVE_TEXT_COLOR;//最後にセーブした箇所の色を変更
                }

                ss_div.appendChild(span);

                energy_icon_div = document.createElement("div");
                energy_icon_div.classList.add("status-icon");
                energy_icon_div.style["backgroundImage"] = backgroundImageText;
                energy_icon_div.style["backgroundPosition"] = "-120px -80px";
                energy_div.appendChild(energy_icon_div);

                energy_status_value_div = document.createElement("div");
                energy_status_value_div.classList.add("status-value-box");
                energy_status_value_div.textContent = loadWWAData.getStatusEnergy();
                energy_div.appendChild(energy_status_value_div);
            }
        }
        this._saveElement.textContent = "";
        this._saveElement.appendChild(owner_div);
        this.setSaveID(this._save_select_id);
        this._isSave = true;
        this._save_counter = 0;
        this._save_close = false;
    }
    deleteSaveDom(): void {
        this._saveElement.textContent = "";
        this._isSave = false;
    }
    setSaveID(save_select_id: number): void {
        this._save_select_id = save_select_id;
        var domList = document.querySelectorAll(".savedata");
        var dom;
        var len: number = domList.length;
        for (var i = 0; i < len; i++) {
            dom = domList[i];
            if (save_select_id === i) {
                dom.classList.add("select");
            } else {
                dom.classList.remove("select");
            }

        }
    }
    save(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData): boolean {
        return this._wwaSave.save(gameCvs, _quickSaveData, this._save_select_id);
    }
    load(): WWAData {
        return this._wwaSave.load(this._save_select_id);
    }
    public saveUpdate(): void {
        if (this._save_counter > 0) {
            this._save_counter--;
        }
    }
    public isSaveClose(): boolean {
        return this._save_close;
    }
    private cursor_wait() {
        this._save_counter = WWAConsts.CONTROLL_WAIT_FRAME;
    }
    public saveControll(moveDir: Direction): void {
        if (this._save_counter > 0) {
            //カーソルリピート待機
            return;
        }
        if (this._isInputDisable) {
            //受付しないタイミング
            return;
        }
        switch (moveDir) {
            case Direction.DOWN:
                this._save_select_id -= 2;
                this.cursor_wait();
                break;
            case Direction.UP:
                this._save_select_id += 2;
                this.cursor_wait();
                break;
            case Direction.LEFT:
                this._save_select_id--;
                this.cursor_wait();
                break;
            case Direction.RIGHT:
                this._save_select_id++;
                this.cursor_wait();
                break;
        }
        this.setSaveID((this._save_select_id + WWASaveConsts.QUICK_SAVE_MAX) % WWASaveConsts.QUICK_SAVE_MAX);
    }
    protected get windowName(): string {
        return "MessageWindow";
    }
}
