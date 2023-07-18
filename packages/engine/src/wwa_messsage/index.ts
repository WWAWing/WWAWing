import {
  PartsType,
  Coord,
  ScoreOptions,
  TriggerParts,
} from "../wwa_data";
import * as util from "../wwa_util";
import { Junction, Node, ParsedMessage, Page, } from "./data";
import { parseMessageLines, createNewNode, processConditionalExecuteMacroLine, connectOrMergeToPreviousNode, messageLineIsText } from "./_internal";

export * from "./data";

export function generatePagesByRawMessage(
  message: string,
  partsId: number,
  partsType: PartsType,
  partsPosition: Coord,
  isSystemMessage: boolean,
  showChoice: boolean,
  scoreOption: ScoreOptions
): Page[] {
  // コメント削除
  const messageMain = message
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

  if (messageMain === "") {
    // 空メッセージの場合は何も処理しないが、スコア表示の場合はメッセージを出すのでノードなしのページを生成
    return scoreOption
      ? [
          new Page(undefined, true, false, false, scoreOption, {
            partsId,
            partsType,
            partsPosition,
          }),
        ]
      : [];
  }
  const pageContents = messageMain.split(/\<p\>/gi);

  return pageContents.map((pageContent, pageId) => {
    let firstNode: Node | undefined = undefined;
    let nodeByPrevLine: Node | undefined = undefined;
    let lastPoppedJunction: Junction | undefined = undefined;
    const triggerParts: TriggerParts = {
      id: partsId,
      type: partsType,
      position: partsPosition,
    };
    const lines = parseMessageLines(
      pageContent,
      partsId,
      partsType,
      partsPosition
    );
    const junctionNodeStack: Junction[] = [];

    lines.forEach((line, index) => {
      try {
        const previousLineType =
          index === 0 ? undefined : lines[index - 1].type;
        const parentJunction = junctionNodeStack[junctionNodeStack.length - 1];
        const newNode = createNewNode(
          line,
          !firstNode || !messageLineIsText(previousLineType),
          { triggerParts }
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
            { triggerParts }
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

    return new Page(
      firstNode,
      pageId === pageContents.length - 1,
      pageId === 0 && showChoice,
      isSystemMessage,
      pageId === 0 && scoreOption,
      {
        partsId,
        partsType,
        partsPosition,
      }
    );
  });
}

export function isEmptyMessageTree(node: Node | undefined): boolean {
  if (node === undefined) {
    return true;
  } else if (node instanceof Junction) {
    // HACK: node に id を振って、メモ化するとかしないと大きい node が与えられた場合にパフォーマンス影響が発生しそう
    return node.branches.reduce(
      (prev, branch) => prev && isEmptyMessageTree(branch.next),
      true
    );
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
    throw new Error(
      "分岐が含まれているため、最後のメッセージを取得することができません。"
    );
  } else if (node instanceof ParsedMessage) {
    return node.next === undefined ? node : getLastMessage(node.next);
  }
}

// 使われてない？
export function concatMessage(
  node1: Node | undefined,
  node2: Node | undefined
): Node | undefined {
  if (node1 === undefined) {
    return node2;
  } else {
    const lastMessage = getLastMessage(node1);
    if (lastMessage instanceof ParsedMessage) {
      lastMessage.next = node2;
    }
  }
}
