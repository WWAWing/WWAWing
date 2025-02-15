import type { ScoreOption, TriggerParts } from "../../wwa_data";
import { PageAdditionalItem } from "./additional";

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
  /** WWA Script 専用: メッセージ表示と関連して実行される処理のキュー */
  additionalItem?: PageAdditionalItem[];
}

/**
 * ページ生成のためのオプション
 */
export type PageGeneratingOption = Pick<Page, "triggerParts" | "isSystemMessage" | "showChoice" | "scoreOption" | "additionalItem">;
