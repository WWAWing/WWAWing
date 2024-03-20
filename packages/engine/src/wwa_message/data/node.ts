import type { TriggerParts } from "../../wwa_data";
import {
  type TokenValues,
  type Descriminant,
  evaluateDescriminant,
} from "../../wwa_expression";
import { Macro } from "../../wwa_macro";

export abstract class Node {
  constructor(protected generateTokenValues: (triggerParts?: TriggerParts) => TokenValues) {}
  abstract execute(triggerParts?: TriggerParts): ParsedMessage[];

  static executeNodes(
    firstNode: Node | undefined,
    triggerParts?: TriggerParts
  ): { isError: false; messages: ParsedMessage[] } | { isError: true } {
    try {
      return {
        isError: false,
        messages: firstNode?.execute(triggerParts) ?? [],
      };
    } catch (error) {
      console.error(error);
      // ゲームオーバーなど、ページの実行が継続できなくなった場合
      return { isError: true };
    }
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
  next?: Node;
}

/**
 * メッセージ中の分岐ノード
 */
export class Junction extends Node {
  constructor(
    public branches: Branch[] = [],
    generateTokenValues: (triggerParts?: TriggerParts) => TokenValues
  ) {
    super(generateTokenValues);
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
  evaluateAndGetNextNode(triggerParts?: TriggerParts): Node | undefined {
    for (let branch of this.branches) {
      // 判別式が undefined の場合は $else 節に相当するのでそのまま次の Node を返す
      // 判別式が null の場合はエラーなので、仕方なく次の Node を返す
      if (
        !branch.descriminant ||
        evaluateDescriminant(branch.descriminant, this.generateTokenValues(triggerParts))
      ) {
        return branch.next;
      }
    }
    return undefined;
  }

  hasElseBranch(): boolean {
    return (
      this.branches.filter((branch) => Boolean(branch.elseBranch)).length >= 1
    );
  }

  override execute(triggerParts?: TriggerParts): ParsedMessage[] {
    if (!triggerParts) {
      // HACK: 理想は、tokenValues のパーツ起因パラメータが optional になるべき。
      // システムメッセージなどが Junction ノードを含んでいいようになるのが望ましい。
      throw new Error(
        "パーツ起因ページによる実行ではないため、Junctionノードの利用を想定していません。"
      );
    }
    const next = this.evaluateAndGetNextNode(triggerParts);
    return next ? next.execute(triggerParts) : [];
  }
}

/**
 * 値が更新された時に、再評価されるべき値を返す関数の型。
 */
export type LazyEvaluateValue = () => number | string | boolean;
/**
 * 通常のメッセージ文字列と LazyEvaluateValue が混在した配列の型。
 * 例: ["変数 10 番の値は", () => userVar[10], "です。\n文字列中に改行も入りえます。"]
 */
export type MessageSegments = (string | LazyEvaluateValue)[];

/**
 * パース済メッセージ。
 * 通常のメッセージの他、マクロの情報などを持ちます。
 */
export class ParsedMessage extends Node {
  private messageSegments: MessageSegments;
  constructor(
    textOrMessageSegments: string | MessageSegments,
    generateTokenValues: () => TokenValues,
    public macro?: Macro[],
    public next?: Node
  ) {
    super(generateTokenValues);
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
    return this.messageSegments.reduce(
      (prev, segment) => prev && segment === "",
      true
    );
  }

  /**
   * LazyEvaluateValue を評価して、表示可能なメッセージを生成する。
   */
  generatePrintableMessage(): string {
    return this.messageSegments.reduce<string>((prevMessage, item) => {
      const evaluatedItem = typeof item === "string" ? item : item();
      return `${prevMessage}${evaluatedItem}`;
    }, "");
  }

  appendMessage(
    message: string | MessageSegments,
    withNewLine: boolean = false
  ): void {
    this.messageSegments = this.messageSegments.concat(
      withNewLine ? ["\n"] : [],
      this.parseMessage(message)
    );
  }

  private parseMessage(message: string | MessageSegments): MessageSegments {
    return typeof message === "string" ? [message] : message;
  }

  override execute(triggerParts?: TriggerParts): ParsedMessage[] {
    this.macro?.forEach((macro) => {
      const result = macro.execute();
      if (result.isGameOver) {
        throw new Error(
          "ゲームオーバーのため、メッセージ・マクロの実行を打ち切ります。"
        );
      }
    });

    return this.next ? [this, ...this.next.execute(triggerParts)] : [this];
  }
}
