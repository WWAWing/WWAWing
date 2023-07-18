import {
    Coord,
    PartsType,
    MacroType,
    PreprocessMacroType,
    ScoreOptions as ScoreOptions,
} from "./wwa_data";
import { Macro } from "./wwa_macro";
import { type TokenValues, type Descriminant, evaluateDescriminant } from "./wwa_expression";

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
