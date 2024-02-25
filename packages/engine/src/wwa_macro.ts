import { SystemMessage } from "@wwawing/common-interface"
import { WWA } from "./wwa_main";
import {
    WWAConsts,
    Coord,
    PartsType,
    Face,
    MacroType,
    MacroImgFrameIndex,
    macrotable,
    StatusSolutionKind,
    ScoreOptions,
    PreprocessMacroType
} from "./wwa_data";

import { type TokenValues, type Descriminant, evaluateDescriminant, evaluateMacroArgExpression } from "./wwa_expression";
import { convertRelativeValue } from "./wwa_message/utils";

/**
 * 値が更新された時に、再評価されるべき値を返す関数の型。
 */
export type LazyEvaluateValue = () => number | string | boolean;
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
        public isSystemMessage?: boolean,
        // score オブジェクトがあるときスコア表示
        public scoreOptions?: ScoreOptions,
        // パーツIDと種別の情報を一応持っておく (主にデバッグ用途)
        public extraInfo?: {
            partsId: number,
            partsType: PartsType
            partsPosition: Coord
        }
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
    /**
     * $else によって生成される分岐相当でなければ undefined.
     * $else によって生成される分岐か、 $else がない $if マクロで生成される else相当の分岐ならオブジェクト.
     */
    elseBranch?: {
        /**
         * $else によって生成された分岐なら "real"
         * $else がない $if によって擬似的に生成された $else 相当の分岐なら "pesudo-else" (疑似 else)
         */
        type: "real" | "pesudo-else";
    };
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
    evaluateAndGetNextNode(generateTokenValues: () => TokenValues): Node | undefined {
        for (let branch of this.branches) {
            // 判別式が undefined の場合は $else 節に相当するのでそのまま次の Node を返す
            // 判別式が null の場合はエラーなので、仕方なく次の Node を返す
            if (!branch.descriminant || evaluateDescriminant(branch.descriminant, generateTokenValues())) {
                return branch.next;
            }
        }
        return undefined;
    }

    hasElseBranch(): boolean {
        return this.branches.filter(branch => Boolean(branch.elseBranch)).length >= 1;
    }
}

/**
 * パース済メッセージ。
 * 通常のメッセージの他、マクロの情報などを持ちます。
 */
export class ParsedMessage extends Node {
    private messageSegments: MessageSegments;
    constructor(
        textOrMessageSegments: string | MessageSegments,
        public macro?: Macro[],
        public next?: Node
    ) {
        super();
        this.messageSegments = this.parseMessage(textOrMessageSegments);
        if (this.macro === void 0) {
            this.macro = [];
        }
    }

    /**
     * メッセージが空であれば true を返す。
     */
    isEmpty(): boolean {
        // 全 messageSegment が空文字列 なら true.
        // HACK: 今のところユーザ変数は文字列が扱えないが、もし扱えるようになった場合、LazyEvaluateValue が 空文字列を
        // 返す可能性があり、その場合は実行するまで本当に空かどうかわからなくなるため、メッセージの空判定方法を根本から見直す必要がある。
        return this.messageSegments.reduce((prev, segment) => prev && segment === "", true)
    }

    /**
     * LazyEvaluateValue を評価して、表示可能なメッセージを生成する。
     */
    generatePrintableMessage(): string {
        return this.messageSegments.reduce<string>((prevMessage, item) => {
            const evaluatedItem = typeof item === "string" ? item : item();
            return `${prevMessage}${evaluatedItem}`;
        }, "")
    }

    appendMessage(message: string | MessageSegments, withNewLine: boolean = false): void {
        this.messageSegments = this.messageSegments.concat(withNewLine ? ["\n"] : [], this.parseMessage(message));
    }

    private parseMessage(message: string | MessageSegments): MessageSegments {
        return typeof message === "string" ? [message] : message; 
    }
}

export function isEmptyMessageTree(node: Node | undefined): boolean {
    if (node === undefined) {
        return true;
    } else if (node instanceof Junction) {
        // HACK: node に id を振って、メモ化するとかしないと大きい node が与えられた場合にパフォーマンス影響が発生しそう
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
export const messagLineIsText = (lineType: MessageLineType) => lineType === MacroType.SHOW_STR || lineType === MacroType.SHOW_STR2 || lineType === "text" || lineType === "normalMacro";
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
                    this._executeMapMacro(1);
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
                    this._executeConsoleLogMacro(1);
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
                // 変数付きのメッセージ表示
                case MacroType.SHOW_STR2: {
                    // $show_str2 マクロは、キューの組み立て時に処理されていて、既に存在しないはず
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
                case MacroType.MAP2: {
                    this._executeMapMacro(2);
                    return {}
                }
                case MacroType.CONSOLE_LOG2: {
                    this._executeConsoleLogMacro(2);
                    return {}
                }
                case MacroType.DELAYBGM: {
                    this._executeDelayBgmMacro();
                    return {};
                }
                case MacroType.SYSMSG: {
                    this._executeSysMsgMacro();
                    return {}
                }
                case MacroType.PICTURE: {
                    this._executePictureMacro();
                    return {};
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

    private _evaluateIntValue(argIndex: number, fallbackValue: number = 0): number {
        const targetString = this.macroArgs[argIndex];
        if (targetString === "") {
            return fallbackValue;
        }
        const parsedRawNumber = Number(targetString);
        // 小数点以下を無視する (正数の場合は切り捨て、負数の場合は切り上げ)
        const intParsedValue = parsedRawNumber >= 0 ? Math.floor(parsedRawNumber) : Math.ceil(parsedRawNumber);
        if (!isNaN(intParsedValue)) {
            return intParsedValue;
        }
        return evaluateMacroArgExpression(targetString, this._wwa.generateTokenValues({
            id: this._triggerPartsID,
            type: this._triggerPartsType,
            position: this._triggerPartsPosition
        }), fallbackValue);
    }

    // JumpGateマクロ実行部
    private _executeJumpGateMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.forcedJumpGate(x, y);
    }
    // RecPositionマクロ実行部
    private _executeRecPositionMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.recUserPosition(x, y);
    }
    // JumpRecPositionマクロ実行部
    private _executeJumpRecPositionMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.jumpRecUserPosition(x, y);
    }
    // consoleLogマクロ実行部
    private _executeConsoleLogMacro(version: 1 | 2): void {
        this._concatEmptyArgs(1);
        const num = this._evaluateIntValue(0);
        switch(version) {
            case 1: {
                this._wwa.outputUserVar(num);
                return;
            }
            case 2: {
                console.log(`${this.macroArgs[0]} = ${num}`);
                return ;
            }
        }
    }
    // copy_hp_toマクロ実行部
    private _executeCopyHpToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setUserVarHP(num);
    }
    // copy_hpmax_toマクロ実行部
    private _executeCopyHpMaxToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setUserVarHPMAX(num);
    }
    // copy_at_toマクロ実行部
    private _executeCopyAtToMacro(): void {
        this._concatEmptyArgs(2);
        const num = this._evaluateIntValue(0);
        const kind = this._parseStatusKind(this._evaluateIntValue(1));
        this._wwa.setUserVarAT(num, kind);
    }
    // copy_df_toマクロ実行部
    private _executeCopyDfToMacro(): void {
        this._concatEmptyArgs(2);
        const num = this._evaluateIntValue(0);
        const kind = this._parseStatusKind(this._evaluateIntValue(1));
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
        var num = this._evaluateIntValue(0);
        this._wwa.setUserVarMONEY(num);
    }
    // set_hpマクロ実行部
    private _executeSetHPMacro(): { isGameOver?: true } {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        return this._wwa.setHPUserVar(num, true);
    }
    // set_hpmaxマクロ実行部
    private _executeSetHpMaxMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setHPMAXUserVar(num);
    }
    // set_atマクロ実行部
    private _executeSetAtMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setATUserVar(num);
    }
    // set_dfマクロ実行部
    private _executeSetDfMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setDFUserVar(num);
    }
    // set_moneyマクロ実行部
    private _executeSetMoneyMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setMONEYUserVar(num);
    }
    // copy_step_count_toマクロ実行部
    private _executeSetStepCountMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setUserVarStep(num);
    }
    // var_set_valマクロ実行部
    private _executeVarSetValMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var num = this._evaluateIntValue(1);
        this._wwa.setUserVarVal(x, num);
    }
    // var_setマクロ実行部
    private _executeVarSetMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setUserValOtherUserVal(x, y);
    }
    // var_addマクロ実行部
    private _executeVarAddMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setUserValAdd(x, y);
    }
    // var_subマクロ実行部
    private _executeVarSubMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setUserValSub(x, y);
    }
    // var_mulマクロ実行部
    private _executeVarMulMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setUserValMul(x, y);
    }
    // var_divマクロ実行部
    private _executeVarDivMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setUserValDiv(x, y);
    }
    // var_modマクロ実行部
    private _executeVarModMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setUserValMod(x, y);
    }
    // var_set_randマクロ実行部
    private _executeVarSetRandMacro(): void {
        this._concatEmptyArgs(3);
        const x = this._evaluateIntValue(0);
        const y = this._evaluateIntValue(1);
        const n = this._evaluateIntValue(2, 0);
        this._wwa.setUserValRandNum(x, y, n);
    }
    // game_speedマクロ実行部
    private _executeGameSpeedMacro(): void {
        this._concatEmptyArgs(1);
        var speedChangeFlag = !!this._evaluateIntValue(0);
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
        var num = this._evaluateIntValue(0);
        // マクロのスピードは 1...6 だが、内部では 0...5 なので変換
        this._wwa.setPlayerSpeedIndex(num - 1);
    }
    // COPY_TO_TIMEマクロ実行部
    private _executeCopyTimeToMacro(): void {
        this._concatEmptyArgs(1);
        var num = this._evaluateIntValue(0);
        this._wwa.setUserVarPlayTime(num);
    }
    // HIDE_STATUS マクロ実行部
    private _executeHideStatusMacro(): void {
        this._concatEmptyArgs(2);
        var no = this._evaluateIntValue(0);
        var isHideNumber = this._evaluateIntValue(1);
        var isHide = (isHideNumber === 0) ? false : true;
        this._wwa.hideStatus(no, isHide);
    }
    // VAR_MAP マクロ実行部
    private _executeVarMapMacro(): void {
        this._concatEmptyArgs(4);
        var partsID = this._evaluateIntValue(0);
        var xstr = this.macroArgs[1];
        var ystr = this.macroArgs[2];
        var partsType = this._evaluateIntValue(3, PartsType.OBJECT);

        if (partsID < 0) {
            throw new Error("入力変数が不正です");
        }
        this._wwa.varMap(this._triggerPartsPosition, xstr, ystr, partsID, partsType);
        // this._wwa.appearPartsEval( this._triggerPartsPosition, xstr, ystr, partsID, partsType);
    }
    // executeImgPlayerMacro
    private _executeImgPlayerMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setPlayerImgCoord(new Coord(x, y));
    }

    private _executeImgYesNoMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        this._wwa.setYesNoImgCoord(new Coord(x, y));
    }

    private _executeHPMaxMacro(): void {
        this._concatEmptyArgs(1);
        var hpmax = Math.max(0, this._evaluateIntValue(0));
        this._wwa.setPlayerEnergyMax(hpmax);
    }

    private _executeSaveMacro(): void {
        this._concatEmptyArgs(1);
        var disableSaveFlag = !!this._evaluateIntValue(0);
        this._wwa.disableSave(disableSaveFlag);
    }

    private _executeItemMacro(): void {
        this._concatEmptyArgs(2);
        var pos = this._evaluateIntValue(0);
        var id = this._evaluateIntValue(1);
        this._wwa.setPlayerGetItem(pos, id);
    }

    private _executeDefaultMacro(): void {
        this._concatEmptyArgs(1);
        var defaultFlag = !!this._evaluateIntValue(0);
        this._wwa.setObjectNotCollapseOnPartsOnPlayer(defaultFlag);
    }

    private _executeOldMapMacro(): void {
        this._concatEmptyArgs(1);
        var oldMapFlag = !!this._evaluateIntValue(0);
        this._wwa.setOldMap(oldMapFlag);
    }

    private _executePartsMacro(): void {
        this._concatEmptyArgs(4);
        var srcID = this._evaluateIntValue(0);
        var destID = this._evaluateIntValue(1);
        var partsType = this._evaluateIntValue(2, PartsType.OBJECT);
        var onlyThisSight = this._evaluateIntValue(3);

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
        var moveNum = this._evaluateIntValue(0);
        this._wwa.setMoveMacroWaitingToPlayer(moveNum);
    }

    private _executeMapMacro(version: 1 | 2): void {
        this._concatEmptyArgs(4);
        const partsId = this._evaluateIntValue(0);
        var partsType = this._evaluateIntValue(3, PartsType.OBJECT);

        if (partsId < 0) {
            throw new Error("パーツ番号が不正です");
        }
        if (partsType === PartsType.OBJECT) {
            if (partsId >= this._wwa.getObjectPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        } else {
            if (partsId >= this._wwa.getMapPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        }
        if (version === 1) {
            const xstr = this.macroArgs[1];
            const ystr = this.macroArgs[2];
            // バージョン 1 では符号がある場合に相対指定, Pの場合にプレイヤー座標での出現が可能
            // $map=75,+10,-10,1
            // $map=75,P,P,1
            this._wwa.appearPartsEval(this._triggerPartsPosition, xstr, ystr, partsId, partsType);
        } else if (version === 2) {
            // バージョン 2 では X, Y の絶対指定のみ対応
            // 相対指定は下記のように行われるべき
            // $map2=75,X+10,Y-10,1
            // プレイヤー座標配置は下記のように行われるべき
            // $map2=75,PX,PY,1
            const x = this._evaluateIntValue(1);
            const y = this._evaluateIntValue(2);
            if (isNaN(x) || isNaN(y)) {
                throw new Error("出現先座標が不正です")
            }
            // x, y の範囲外判定は appearPartsEval に任せる
            this._wwa.appearPartsEval(this._triggerPartsPosition, `${x}`, `${y}`, partsId, partsType);
        }
    }

    private _executeDirMapMacro(): void {
        this._concatEmptyArgs(3);
        var partsID = this._evaluateIntValue(0);
        var dist = this._evaluateIntValue(1);
        var partsType = this._evaluateIntValue(2, PartsType.OBJECT);
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
        var type = this._evaluateIntValue(0);
        var posX = this._evaluateIntValue(1);
        var posY = this._evaluateIntValue(2);

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
        var posX = this._evaluateIntValue(0);
        var posY = this._evaluateIntValue(1);
        if (posX < 0 || posY < 0) {
            throw new Error("座標は正でなければなりません。");
        }
        this._wwa.setBattleEffectCoord(new Coord(posX, posY));
    }

    private _executeDelPlayerMacro(): void {
        this._concatEmptyArgs(1);
        const flag = this._evaluateIntValue(0);
        this._wwa.setDelPlayer(!!flag);
    }
    private _executeFaceMacro(): void {
        this._concatEmptyArgs(6);
        var destPosX = this._evaluateIntValue(0);
        var destPosY = this._evaluateIntValue(1);
        var srcPosX = this._evaluateIntValue(2);
        var srcPosY = this._evaluateIntValue(3);
        var srcWidth = this._evaluateIntValue(4);
        var srcHeight = this._evaluateIntValue(5);
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
        var waitTime = this._evaluateIntValue(0);
        if (waitTime < 0) {
            throw new Error("待ち時間は0以上の整数でなければなりません。");
        }
        if (waitTime === 0) {
            this._wwa.stopEffect();
            return;
        }
        var coords: Coord[] = [];
        for (var i = 1; i < this.macroArgs.length; i += 2) {
            var cropX = this._evaluateIntValue(i);
            var cropY = 0;
            if (cropX < 0) {
                throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
            }
            if (i + 1 === this.macroArgs.length) {
                throw new Error("画像のパーツ座標指定で、Y座標が指定されていません。");
            }
            cropY = this._evaluateIntValue(i + 1);
            if (cropY < 0) {
                throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
            }
            coords.push(new Coord(cropX, cropY));
        }
        this._wwa.setEffect(waitTime, coords);
    }

    private _executeGameOverMacro(): void {
        this._concatEmptyArgs(2);
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);

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
        var x = this._evaluateIntValue(0);
        var y = this._evaluateIntValue(1);
        if (x < 0 || y < 0) {
            throw new Error("引数が0以上の整数ではありません");
        }
        this._wwa.setImgClick(new Coord(x, y));
    }

    private _executeEffItemMacro(): void {
        if (this.macroArgs.length < 1) {
            throw new Error("引数が少なすぎます");
        }
        var mode = this._evaluateIntValue(0);
        this._wwa.updateItemEffectEnabled(!!mode);
    }

    private _executeStatusMacro(): { isGameOver?: true } {
        this._concatEmptyArgs(2);
        var type = this._evaluateIntValue(0);
        var value = this._evaluateIntValue(1);

        if (type < 0 || 4 < type) {
            throw new Error("ステータス種別が範囲外です。");
        }
        return this._wwa.setPlayerStatus(type, value, true);
    }

    private _executeColorMacro(): void {
        this._concatEmptyArgs(4);
        var type = this._evaluateIntValue(0);
        var r = this._evaluateIntValue(1);
        var g = this._evaluateIntValue(2);
        var b = this._evaluateIntValue(3);
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
        this._concatEmptyArgs(2);
        // 注) $sound マクロは、マップデータ読み込み時に全メッセージ解析でロードする音源を決定しているため
        // 変数などによるサウンド番号指定を受け付けない
        const id = parseInt(this.macroArgs[0]);
        const bgmDelayMs = parseInt(this.macroArgs[1]);
        this._wwa.playSound(id, bgmDelayMs);
    }
    private _executeGamePadButtonMacro(): void {
        this._concatEmptyArgs(2);
        var buttonID: number = this._evaluateIntValue(0);
        var itemNo: number = this._evaluateIntValue(1);

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
        const oldMoveFlag = !!this._evaluateIntValue(0);
        this._wwa.setOldMove(oldMoveFlag);
    }

    private _executeNoGameOverMacro(): void {
        this._concatEmptyArgs(1);
        const isGameOverDisabled = this._evaluateIntValue(0);
        this._wwa.setGameOverPolicy(isGameOverDisabled);
    }

    private _executeSetMacro(): { isGameOver?: true } {
        return this._wwa.execSetMacro(this.macroArgs[0], 
            {
                triggerParts: {
                    position: this._triggerPartsPosition,
                    id: this._triggerPartsID,
                    type: this._triggerPartsType
                }
            }
        );
    }

    private _executePictureMacro(): void {
        this._concatEmptyArgs(3);
        if (this.macroArgs.length < 1) {
            throw new Error("引数が少なすぎます");
        }
        const layerNumber = this._evaluateIntValue(0);
        // 未指定の場合は "+0" (パーツそのまま)
        const definePartsNumberString = this.macroArgs[1].length > 0 ? this.macroArgs[1] : "+0";
        // 0: パーツを消去
        if (definePartsNumberString === "0") {
            this._wwa.deletePictureRegistry(layerNumber);
            return;
        }
        const definePartsNumber = convertRelativeValue(definePartsNumberString, this._triggerPartsID);
        if (definePartsNumber === 0) {
            throw new Error("パーツ番号の相対値算出で0が検出されました。ピクチャを消去する場合は0のまま指定してください。");
        }
        if (definePartsNumber < 0) {
            throw new Error("パーツ番号は0以上の整数でなければなりません。");
        }
        const definePartsType = this._evaluateIntValue(2, PartsType.OBJECT);
        this._wwa.setPictureRegistry(layerNumber, definePartsNumber, definePartsType, this._triggerPartsPosition);
    }

    private _executeDelayBgmMacro(): void {
        this._concatEmptyArgs(1);
        const delayMs = this._evaluateIntValue(0);
        this._wwa.setBgmDelay(delayMs);
    }

    private _executeSysMsgMacro(): void {
        this._concatEmptyArgs(2);
        const key = this.resolveSystemMessageKeyFromMacroArg(this.macroArgs[0]);
        if (!key) {
            throw new Error("該当するシステムメッセージの定義がありません");
        }
        const message = this.macroArgs[1] === "" ? undefined : this.macroArgs[1].replaceAll("\\n", "\n");
        this._wwa.overwriteSystemMessage(key, message);
    }

    private resolveSystemMessageKeyFromMacroArg(rawValue: string): SystemMessage.Key | undefined {
        // メッセージコードとして解決しようとする
        if (SystemMessage.stringIsKey(rawValue)) {
          return rawValue;
        }

        // 通常のマクロ引数として解決しようとする
        const value = this._evaluateIntValue(0);
        return SystemMessage.findKeyByCode(value);
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
    // show_str 系マクロでは、文字列手前のカンマを除去しないようにする
    // (メッセージ文字列にスペースを含められるようにするため。数値系の文字列のスペースは、パース時に除去されるのでここでは除去しなくてよい）
    const shouldTrimWhiteSpace = Boolean(macroIndex !== MacroType.SHOW_STR && macroIndex !== MacroType.SHOW_STR2);
    const macroArgs = (matchInfo[2] ?? "").split(",").map(arg => shouldTrimWhiteSpace ? arg.trim() : arg);
    return new Macro(
        wwa,
        partsID,
        partsType,
        position,
        macroIndex === undefined ? MacroType.UNDEFINED : macroIndex,
        macroArgs
    );
}
