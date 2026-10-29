import { TriggerParts } from "../wwa_data";
import {
  Junction,
  Node,
  ParsedMessage,
  Page,
  PageGeneratingOption,
} from "./data";
import { normalizeMessage, splitMessageByTags, createPage } from "./_internal";
import * as ExpressionParser from "../wwa_expression";
import { Macro } from "../wwa_macro";

export * from "./data";
export * from "./typedef";

export function generatePagesByRawMessage(
  message: string,
  generatingOption: PageGeneratingOption,
  parseMacro: (macroStr: string) => Macro,
  evalScript: (script: string, triggerParts?: TriggerParts) => void,
  // HACK: expressionParser 依存を打ち切りたい (wwa_expression2 に完全移行できれば嫌でも消えるはず)
  generateTokenValuesCallback: (
    triggerParts: TriggerParts
  ) => ExpressionParser.TokenValues
): Page[] {
  const normalizedMessage = normalizeMessage(message);
  const { pageContents, script } = splitMessageByTags(normalizedMessage);

  // 空メッセージの場合は何も処理しないが、
  // スコア表示の場合はメッセージを出すのでノードなしのページを生成する必要がある 
  // (generatingOption.scoreOption があるとメッセージが出る)
  // スコア表示がなくてもスクリプトがある可能性があるのでノードなしページを作成する必要がある
  if (pageContents.length === 0) {
    return [
      {
        firstNode: ParsedMessage.createEmptyMessage(
          generateTokenValuesCallback,
          evalScript,
          script
        ),
        isLastPage: true,
        ...generatingOption,
      },
    ];
  }

  return pageContents.map((content, pageId) =>
    createPage({
      script,
      content,
      generatingOption,
      pageType: resolvePageType(pageId, pageContents.length),
      parseMacro,
      evalScript,
      // HACK: expressionParser 依存を打ち切りたい (wwa_expression2 に完全移行できれば嫌でも消えるはず)
      generateTokenValuesCallback,
    })
  );
}

function resolvePageType(
  pageId: number,
  length: number
): "first" | "last" | "other" {
  if (pageId === 0) {
    return "first";
  } else if (pageId === length - 1) {
    return "last";
  } else {
    return "other";
  }
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
