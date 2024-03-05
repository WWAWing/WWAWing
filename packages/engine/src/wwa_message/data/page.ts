import { ScoreOptions as ScoreOptions, TriggerParts } from "../../wwa_data";
import { Node } from "./node";

export class Page {
  constructor(
    public firstNode?: Node,
    public isLastPage?: boolean, // 旧 endOfPartsEvent相当
    public showChoice?: boolean,
    public isSystemMessage?: boolean,
    // score オブジェクトがあるときスコア表示
    public scoreOptions?: ScoreOptions,
    // パーツIDと種別の情報
    public triggerParts?: TriggerParts
  ) {}

  static createSystemMessagePage(firstNode?: Node): Page {
      return new Page(firstNode, true, false, true)
  }
}
