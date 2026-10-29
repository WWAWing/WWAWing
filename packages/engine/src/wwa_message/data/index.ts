import { PreprocessMacroType } from "../../wwa_data"
import { Macro } from "../../wwa_macro";
export { Node, type Branch, Junction, type LazyEvaluateValue, ParsedMessage, type MessageSegments } from "./node";
export type { Page, PageGeneratingOption } from "./page";

export type MessageLineType = PreprocessMacroType | "text" | "normalMacro";
export type MessageLine =
  | { type: PreprocessMacroType; text: string; macro: Macro }
  | { type: "normalMacro"; text: string; macro: Macro }
  | { type: "text"; text: string; macro?: undefined };
