import {
    Coord,
    PartsType,
    ScoreOptions as ScoreOptions,
} from "../wwa_data";
import { Node } from "./node";

export class Page {
    constructor(
        public firstNode?: Node,
        public isLastPage?: boolean, // 旧 endOfPartsEvent相当
        public showChoice?: boolean,
        public isSystemMessage?: boolean,
        // score オブジェクトがあるときスコア表示
        public scoreOptions?: ScoreOptions,
        // パーツIDと種別の情報を一応持っておく (主にデバッグ用途)
        public extraInfo?: {
            partsId: number,
            partsType: PartsType
            partsPosition: Coord
        }
    ) {

    }
}
