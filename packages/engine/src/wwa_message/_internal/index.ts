import { PartsType, Coord, MacroType, TriggerParts } from "../../wwa_data";
import { parseMacro } from "../../wwa_macro";
import {
  Node,
  MessageLineType,
  ParsedMessage,
  Junction,
  MessageLine,
  MessageSegments,
} from "../data";
import * as ExpressionParser from "../../wwa_expression";

// このファイルの関数は wwa_message の外で使わないようにしてください

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
  partsID: number,
  partsType: PartsType,
  partsPosition: Coord
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
      const macro = parseMacro(
        this,
        partsID,
        partsType,
        partsPosition,
        matchInfo[1]
      );
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
  generateTokenValues: (triggerParts: TriggerParts) => ExpressionParser.TokenValues,
  option: {
    triggerParts: TriggerParts;
  }
): Node | undefined {
  switch (currentLine.type) {
    case MacroType.IF:
      return new Junction([
        {
          descriminant: ExpressionParser.parseDescriminant(
            currentLine.macro.macroArgs[0]
          ),
        },
      ]);
    case MacroType.SHOW_STR:
    case MacroType.SHOW_STR2:
      return shouldCreateParsedMessage
        ? new ParsedMessage(
            generateShowStrString(currentLine.macro.macroArgs, generateTokenValues, {
              triggerParts: option.triggerParts,
              version: currentLine.type === MacroType.SHOW_STR2 ? 2 : 1,
            })
          )
        : undefined;
    case "text":
      return shouldCreateParsedMessage
        ? new ParsedMessage(currentLine.text)
        : undefined;
    case "normalMacro":
      return shouldCreateParsedMessage
        ? new ParsedMessage("", [currentLine.macro])
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
  generateTokenValues: (triggerParts: TriggerParts) => ExpressionParser.TokenValues,
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
            endIfTargetJunction.branches[i] = newNode;
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
            generateTokenValues, {
            triggerParts: option.triggerParts,
            version: currentLine.type === MacroType.SHOW_STR2 ? 2 : 1,
          }),
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
  generateTokenValues: (triggerParts: TriggerParts) => ExpressionParser.TokenValues,
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
      }
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
