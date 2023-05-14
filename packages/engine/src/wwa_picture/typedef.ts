import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { CacheCanvas } from "../wwa_cgmanager";

export type PictureMacroArgs = {
    destPosX: number;
    destPosY: number;
    srcPosX: number;
    srcPosY: number;
    srcWidth: number;
    srcHeight: number;
    layerNumber: number;
    displayTimeMs: number;
};

export type TextMacroArgs = {
    destPosX: number;
    destPosY: number;
    text: string;
    sizePt: number;
    layerNumber: number;
    displayTimeMs: number;
};

export type PictureItem = (PictureRegistory & { canvas: CacheCanvas; layerNumber: number; }) | null;
