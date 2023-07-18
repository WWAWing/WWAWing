import { MacroType, PreprocessMacroType } from "../wwa_data";
import { Macro } from "../wwa_macro";
import { Junction, Node, ParsedMessage } from "./node";

export * from "./node";
export * from "./page";


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

export type MessageLineType = PreprocessMacroType | "text" | "normalMacro";
export const messagLineIsText = (lineType: MessageLineType) =>
  lineType === MacroType.SHOW_STR ||
  lineType === MacroType.SHOW_STR2 ||
  lineType === "text" ||
  lineType === "normalMacro";
export type MessageLine =
  | { type: PreprocessMacroType; text: string; macro: Macro }
  | { type: "normalMacro"; text: string; macro: Macro }
  | { type: "text"; text: string; macro?: undefined };
