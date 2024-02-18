import { PreprocessMacroType } from "../../wwa_data"
import { Macro } from "../../wwa_macro";
export { Node, Branch, Junction, LazyEvaluateValue, ParsedMessage, MessageSegments } from "./node";
export { Page } from "./page";

export type MessageLineType = PreprocessMacroType | "text" | "normalMacro";
export type MessageLine =
  | { type: PreprocessMacroType; text: string; macro: Macro }
  | { type: "normalMacro"; text: string; macro: Macro }
  | { type: "text"; text: string; macro?: undefined };
