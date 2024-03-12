import type { ScoreOption, TriggerParts } from "../../wwa_data";

import { Node } from "./node";

export interface PageOption {
  // パーツIDと種別の情報
  triggerParts: TriggerParts;
  isSystemMessage: boolean;
  showChoice: boolean;
  // score オブジェクトがあるときスコア表示
  scoreOption?: ScoreOption;
}

export type PartialPageOption = Partial<PageOption>;

export class Page {
  constructor(
    public firstNode: Node,
    public isLastPage: boolean,
    public option: PartialPageOption
  ) {}


  static createEmptyPage(pageOption: PageOption): Page {
    return new Page(undefined, true, pageOption);
  }
}
