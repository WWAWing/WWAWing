import { TriggerParts } from "../wwa_data";
import { Junction, Node, ParsedMessage, Page, PageOption } from "./data";
import {
  normalizeMessage,
  splitMessageByPTag,
  createPage,
} from "./_internal";
import * as ExpressionParser from "../wwa_expression";
import { Macro } from "../wwa_macro";

export * from "./data";

export function generatePagesByRawMessage(
  message: string,
  pageOption: PageOption,
  parseMacro: (macroStr: string) => Macro,
  // HACK: WWA Script 呼び出し順変更が完了したらこのコールバックは消せる
  execEvalStringCallback: (scriptSettings: string) => void,
  // HACK: expressionParser 依存を打ち切りたい (wwa_expression2 に完全移行できれば嫌でも消えるはず)
  generateTokenValuesCallback: (
    triggerParts: TriggerParts
  ) => ExpressionParser.TokenValues
): Page[] {
  /**
   * <script> タグ仮対応
   * UNDONE: script タグは各ページで処理されるようになるためここでは何もしなくなります。
   **/
  const messageMainSplit = normalizeMessage(message).split("<script>");
  const messageMain = messageMainSplit[0];

  /** <script> タグが含まれる場合中身を実行する。 */
  if (messageMainSplit.length > 1) {
    execEvalStringCallback(messageMainSplit[1]);
  }

  // 空メッセージの場合は何も処理しないが、スコア表示の場合はメッセージを出すのでノードなしのページを生成
  if (messageMain === "") {
    return pageOption.scoreOption
      ? [Page.createEmptyPage(pageOption)]
      : [];
  }
  const pageContents = splitMessageByPTag(messageMain);

  return pageContents.map((pageContent, pageId) =>
    createPage({
      pageContent,
      pageOption,
      pageType: resolvePageType(pageId, pageContents.length),
      parseMacro,
      // HACK: expressionParser 依存を打ち切りたい (wwa_expression2 に完全移行できれば嫌でも消えるはず)
      generateTokenValuesCallback,
    })
  );
}

function resolvePageType(pageId: number, length: number): "first" | "last" | "other" {
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
