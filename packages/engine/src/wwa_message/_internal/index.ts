import { MacroType, type TriggerParts, type ScoreOption } from "../../wwa_data";
import type { Macro } from "../../wwa_macro";
import {
  Node,
  Page,
  MessageLineType,
  ParsedMessage,
  Junction,
  MessageLine,
  MessageSegments,
  PageGeneratingOption,
} from "../data";
import * as ExpressionParser from "../../wwa_expression";
import * as util from "../../wwa_util";

// このファイルの関数は wwa_message の外で使わないようにしてください

/**
 * メッセージを正規化します。具体的には下記の処理が実行されます。
 *
 * - コメント (`<c>`, `<C>`, `//`) の削除 (`$` によるコメントアウトはマクロ処理時に行うためここでは対応しません)
 * - `<p>`, `<P>` 周辺の改行の削除, 大文字への統一 (やるなら連続改行の削除までやるべきな気がするがそこまで対応していない。HACK: 経緯が謎なので慎重に検討して直す)
 *
 */
export function normalizeMessage(message: string): string {
  return message
    .split(/\n\<c\>/i)[0]
    .split(/\<c\>/i)[0]
    .replace(/\n\<p\>\n/gi, "<P>")
    .replace(/\n\<p\>/gi, "<P>")
    .replace(/\<p\>\n/gi, "<P>")
    .replace(/\<p\>/gi, "<P>")
    .split("\n")
    .map((line) => {
      if (line.startsWith("//")) {
        // 行の最初から // の場合はその行がなかったことにする
        return undefined;
      }
      if (!line.match(/\/\//)) {
        // 計算量削減のため、// を含まない列は何もせず終了
        return line;
      }
      /**
       * 行内の http:// https:// でない「//」以降の文字列を削除する。
       * http:///////// のようなケースは、http:/「//」以降が削除対象になるため「 http:/」 になる。
       * 本当は line.replace(/(?<!https?:)\/\/.*$/ig, "") と書きたいが、後読みにSafariが対応していないので、
       * 否定後読みを、文字列を右から左に読んだ否定先読みとして処理する。
       * 参考: https://qiita.com/yumarule/items/a37520974e39b25b7a6f#%E5%90%A6%E5%AE%9A%E5%BE%8C%E8%AA%AD%E3%81%BF%E3%81%AE%E4%BB%A3%E6%9B%BF-%E3%81%9D%E3%81%AE2
       */
      return util.reverse(
        util.reverse(line).replace(/^.*\/\/(?!:s?ptth)/gi, "")
      );
    })
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\\\/\\\//gi, "//"); // エスケープ対応: 「\/\/」 を 「//」 にする。
}

/**
 * メッセージを `<P>`, `<script>` タグで分割します。
 * 大文字と小文字は区別されません。
 * @param message
 */
export function splitMessageByTags(message: string): { pageContents: string[], script?: string } {
  if (message === "") {
    return { pageContents: [] }
  }
  const scriptTagSplitMessages = message.split(/\<script\>/i)
  const [messageMainSection, scriptSection] =
    scriptTagSplitMessages.length > 1
      ? [scriptTagSplitMessages[0], scriptTagSplitMessages[1]]
      : [scriptTagSplitMessages[0]];

  return {
    pageContents: messageMainSection.split(/\<p\>/gi),
    script: scriptSection
  }
}

export function createPage({
  content,
  script,
  generatingOption,
  pageType,
  parseMacro,
  evalScript,
  // HACK: expressionParser 依存を打ち切りたい (wwa_expression2 に完全移行できれば嫌でも消えるはず)
  generateTokenValuesCallback,

}: {
  content: string;
  script?: string
  generatingOption: PageGeneratingOption;
  pageType: "first" | "last" | "other",
  parseMacro: (macroStr: string) => Macro,
  evalScript: (script: string, triggerParts?: TriggerParts) => void,
  // HACK: expressionParser 依存を打ち切りたい (wwa_expression2 に完全移行できれば嫌でも消えるはず)
  generateTokenValuesCallback: (triggerParts: TriggerParts) => ExpressionParser.TokenValues

}): Page {
    let firstNode: Node | undefined = undefined;
    let nodeByPrevLine: Node | undefined = undefined;
    let lastPoppedJunction: Junction | undefined = undefined;

    const lines = parseMessageLines(content, parseMacro);
    const junctionNodeStack: Junction[] = [];

    lines.forEach((line, index) => {
      try {
        const previousLineType =
          index === 0 ? undefined : lines[index - 1].type;
        const parentJunction = junctionNodeStack[junctionNodeStack.length - 1];
        const newNode = createNewNode(
          line,
          !firstNode || !messageLineIsText(previousLineType),
          generateTokenValuesCallback,
          evalScript,
          { triggerParts: generatingOption.triggerParts }
        );

        const endIfPoppedJunction = processConditionalExecuteMacroLine(
          newNode,
          line,
          parentJunction,
          junctionNodeStack
        );
        if (endIfPoppedJunction) {
          lastPoppedJunction = endIfPoppedJunction;
        }
        if (previousLineType) {
          connectOrMergeToPreviousNode(
            line,
            previousLineType,
            nodeByPrevLine,
            newNode,
            parentJunction,
            lastPoppedJunction,
            generateTokenValuesCallback,
            { triggerParts: generatingOption.triggerParts }
          );
        } else {
          firstNode = newNode;
        }
        if (newNode) {
          nodeByPrevLine = newNode;
        }
      } catch (error) {
        console.error(
          `$if-$else_if-$else-$endif マクロの解析中にエラーが発生しました。ページ ${index}`
        );
        console.error(error);
      }
    });

    // ページで必ず実行されるスクリプトがある場合は先頭ノードの手前に挿入 (先頭ページに限る)
    if (script && pageType === "first") {
      const scriptNode = ParsedMessage.createEmptyMessage(generateTokenValuesCallback, evalScript, script);
      scriptNode.next = firstNode;
      firstNode = scriptNode;
    }

    return {
      firstNode,
      isLastPage: pageType === "last",
      triggerParts: generatingOption.triggerParts,
      isSystemMessage: generatingOption.isSystemMessage,
      showChoice: pageType === "first" ? generatingOption.showChoice: undefined,
      scoreOption: pageType === "first" ? generatingOption.scoreOption: undefined,
      additionalItem: generatingOption.additionalItem,
    };
  }

export const messageLineIsText = (lineType: MessageLineType) =>
  lineType === MacroType.SHOW_STR ||
  lineType === MacroType.SHOW_STR2 ||
  lineType === "text" ||
  lineType === "normalMacro";

/**
 * メッセージ行をパースして, テキスト, プリプロセスマクロ, その他のマクロに分類する。
 */
export function parseMessageLines(
  pageContent: string,
  parseMacro: (macroStr: string) => Macro
): MessageLine[] {
  return pageContent
    .split("\n")
    .map((line) => {
      const matchInfo = line.match(/(\$(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:.*))/);
      if (!matchInfo || matchInfo.length < 2) {
        return line.startsWith("$")
          ? undefined
          : { type: "text" as const, text: line };
      }
      const macro = parseMacro(matchInfo[1]);
      switch (macro.macroType) {
        case MacroType.IF:
        case MacroType.ELSE_IF:
        case MacroType.ELSE:
        case MacroType.END_IF:
        case MacroType.SHOW_STR:
        case MacroType.SHOW_STR2:
          return { type: macro.macroType, text: line, macro };
        default:
          return { type: "normalMacro" as const, text: line, macro };
      }
      // $ 始まりのコメント行 (undefined) の除去
    })
    .filter(Boolean);
}

/**
 * メッセージ行に対するノードを生成する。
 */
export function createNewNode(
  currentLine: MessageLine,
  shouldCreateParsedMessage: boolean,
  generateTokenValues: (
    triggerParts?: TriggerParts
  ) => ExpressionParser.TokenValues,
  evalScript: (script: string, triggerParts?: TriggerParts) => void,
  option: {
    triggerParts: TriggerParts;
  }
): Node | undefined {
  switch (currentLine.type) {
    case MacroType.IF:
      return new Junction(
        [
          {
            descriminant: ExpressionParser.parseDescriminant(
              currentLine.macro.macroArgs[0]
            ),
          },
        ],
        generateTokenValues
      );
    case MacroType.SHOW_STR:
    case MacroType.SHOW_STR2:
      return shouldCreateParsedMessage
        ? new ParsedMessage(
            generateShowStrString(
              currentLine.macro.macroArgs,
              generateTokenValues,
              {
                triggerParts: option.triggerParts,
                version: currentLine.type === MacroType.SHOW_STR2 ? 2 : 1,
              }
            ),
            generateTokenValues,
            evalScript,
          )
        : undefined;
    case "text":
      return shouldCreateParsedMessage
        ? new ParsedMessage(currentLine.text, generateTokenValues, evalScript)
        : undefined;
    case "normalMacro":
      return shouldCreateParsedMessage
        ? new ParsedMessage("", generateTokenValues, evalScript, [currentLine.macro])
        : undefined;
    default:
      return undefined;
  }
}

/**
 * 条件実行系マクロの行を読んだ時の処理を実行
 * END_IF の場合は junctionNodeStack の先頭を pop し、返す。
 */
export function processConditionalExecuteMacroLine(
  newNode: Node,
  currentLine: MessageLine,
  parentJunction: Junction | undefined,
  junctionNodeStack: Junction[]
): Junction | undefined {
  const isTopLevel = junctionNodeStack.length === 0;
  switch (currentLine.type) {
    case MacroType.IF:
      junctionNodeStack.push(newNode as Junction);
      return undefined;
    case MacroType.ELSE_IF:
      if (isTopLevel) {
        throw new Error("構文エラー: $if を呼ぶ前に $else_if は呼べません");
      }
      parentJunction.appendBranch({
        descriminant: ExpressionParser.parseDescriminant(
          currentLine.macro.macroArgs[0]
        ),
      });
      return undefined;
    case MacroType.ELSE:
      if (isTopLevel) {
        throw new Error("構文エラー: $if を呼ぶ前に $else は呼べません");
      }
      // else の場合、該当する分岐は必ず実行されるべき
      parentJunction.appendBranch({
        descriminant: true,
        elseBranch: { type: "real" },
      });
      return undefined;
    case MacroType.END_IF:
      if (isTopLevel) {
        throw new Error("構文エラー: $if を呼ぶ前に $endif は呼べません");
      }
      return junctionNodeStack.pop();
  }
}

/**
 * ノードをこれまでのメッセージの適切な箇所に連結する。
 */
export function connectOrMergeToPreviousNode(
  currentLine: MessageLine,
  previousLineType: MessageLineType,
  nodeByPrevLine: Node | undefined,
  newNode: Node | undefined,
  parentJunction: Junction,
  endIfTargetJunction: Junction | undefined,
  generateTokenValues: (
    triggerParts: TriggerParts
  ) => ExpressionParser.TokenValues,
  option: {
    triggerParts: TriggerParts;
  }
) {
  const prevLineIsText = messageLineIsText(previousLineType);
  switch (previousLineType) {
    case MacroType.IF:
    case MacroType.ELSE_IF:
    case MacroType.ELSE: {
      if (!newNode || !parentJunction) {
        return;
      }

      const target = parentJunction.getLastUnconnectedBranch();
      if (target) {
        target.next = newNode;
      } else {
        throw new Error("lastUnconnectedBranchが見つかりませんでした。");
      }
      return;
    }
    case MacroType.END_IF:
      {
        if (!newNode || !(endIfTargetJunction instanceof Junction)) {
          return;
        }
        for (let i = 0; i < endIfTargetJunction.branches.length; i++) {
          let node: Node | undefined = endIfTargetJunction.branches[i].next;
          if (!node) {
            endIfTargetJunction.branches[i].next = newNode;
            continue;
          }
          connectToFinalNode(node, newNode);
        }
        /*
         * $else がない $if について、実行されなかった場合の次のノードを与えるため、
         * 擬似的な $else 相当の分岐を作成する。
         * 例えば次の場合に、条件Aを満たさなかった場合に $if=(B) 相当の Juntion ノードが次に評価されるようにする。
         *
         * ```
         * $if=(A)
         * 条件Aの処理
         * $endif
         * $if=(B)
         * 条件Bの処理
         * $endif
         * ```
         */
        if (!endIfTargetJunction.hasElseBranch()) {
          endIfTargetJunction.branches.push({
            next: newNode,
            descriminant: true,
            elseBranch: {
              type: "pesudo-else",
            },
          });
        }
      }
      return;
    default: {
      if (!prevLineIsText || !(nodeByPrevLine instanceof ParsedMessage)) {
        return;
      }
      // 前の行までのメッセージ表示内容がない場合は、改行を挿入しない
      const shouldInsertNewLine = !nodeByPrevLine.isEmpty();
      // 1つ前の行がテキストや通常マクロの場合は1つ前のParsedMessageにマージ
      if (
        currentLine.type === MacroType.SHOW_STR ||
        currentLine.type === MacroType.SHOW_STR2
      ) {
        nodeByPrevLine.appendMessage(
          generateShowStrString(
            currentLine.macro.macroArgs,
            generateTokenValues,
            {
              triggerParts: option.triggerParts,
              version: currentLine.type === MacroType.SHOW_STR2 ? 2 : 1,
            }
          ),
          shouldInsertNewLine
        );
      } else if (currentLine.type === "text") {
        nodeByPrevLine.appendMessage(currentLine.text, shouldInsertNewLine);
      } else if (currentLine.type === "normalMacro") {
        nodeByPrevLine.macro.push(currentLine.macro);
      } else {
        // if などの場合は単純に接続する
        nodeByPrevLine.next = newNode;
      }
    }
  }
}

/**
 * targetNode を firstNode から続く最後のノードに連結する。
 * 途中にJunctionが含まれる場合は、どの分岐を辿ったときも同じノードにたどり着くことが前提。
 */
export function connectToFinalNode(firstNode: Node, targetNode: Node) {
  let finalNode: Node | undefined = firstNode;
  // 分かれた処理を合流させるために必要な終端ノードを、Junctionノードから順に走査
  // TODO: 規定回数のループを超えたら止めるとかした方がいい
  while (true) {
    if (finalNode instanceof Junction) {
      // どの分岐を選んでも最終的には同じ結果になるので、確実に存在する分岐を選ぶ。
      // 理想を言えば Junction ノードは合流地点のノードを覚えていれば処理が高速化されるが
      // WWAのメッセージで何百行も書くことは想定しないので、処理を簡単にする。必要なら今後考える。
      finalNode = finalNode.branches[0].next;
    }
    if (finalNode instanceof ParsedMessage) {
      if (!finalNode.next) {
        finalNode.next = targetNode;
        return;
      }
      finalNode = finalNode.next;
    }
  }
}

// $show_str, $show_str2 マクロで表示される文字列を組み立てる。
// 変数, ステータスは表示する時に評価される。
// 評価される値はifなどと同じ方法(例: v[210], RAND(2)).
// バージョン1 の場合は、整数値は添字として認識される。 例: 210 と書かれていると v[210] と扱われる。
export function generateShowStrString(
  macroArgs: string[],
  generateTokenValues: (
    triggerParts?: TriggerParts
  ) => ExpressionParser.TokenValues,
  option: {
    triggerParts: TriggerParts;
    version: 1 | 2;
  }
): MessageSegments {
  return macroArgs.map((macroArg) => {
    const parsedNumber = Number(macroArg);
    if (!isNaN(parsedNumber)) {
      // バージョン1 かつ 数値の場合は、該当するユーザ変数の添字と解釈する
      // バージョン2 の場合は数値をそのまま出力する
      return () => {
        const userVars = generateTokenValues(option.triggerParts).userVars;
        return option.version === 1 ? userVars[parsedNumber] : parsedNumber;
      };
    }
    // ExpressionParser で解釈できる表現 (HPMAX, RAND(x)など)を解釈する。
    // なお、数値の場合は前段で弾かれているので、定数になることはない。
    const parsedType = ExpressionParser.isValidMacroArgExpression(macroArg);
    if (parsedType) {
      return () =>
        ExpressionParser.evaluateMacroArgExpression(
          macroArg,
          generateTokenValues(option.triggerParts)
        );
    }
    // 引数を文字列として解釈する場合
    // \n は改行扱いされる。
    return macroArg.replace(/\\n/g, "\n");
  });
}
