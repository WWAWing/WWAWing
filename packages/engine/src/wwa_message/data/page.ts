import type { ScoreOption, TriggerParts } from "../../wwa_data";

import { Node } from "./node";

export interface Page {
  /** ページの最初のノード */
  firstNode?: Node,
  /** このページが最後のページか */
  isLastPage: boolean,
  /** 実行元パーツ情報 */
  triggerParts: TriggerParts;
  /** システムメッセージかどうか */
  isSystemMessage: boolean;
  /** 二者択一ページかどうか */
  showChoice: boolean;
  /** オブジェクトがあるときスコア表示ページ */
  scoreOption?: ScoreOption;
}

/**
 * ページ生成のためのオプション
 */
export type PageGeneratingOption = Pick<Page, "triggerParts" | "isSystemMessage" | "showChoice" | "scoreOption">;
