import { PictureRegistry } from "@wwawing/common-interface/lib/wwa_data";
import { CacheCanvas } from "../wwa_cgmanager";
import { PartsType } from "@wwawing/loader";

export type PictureItem = PictureRegistry & { canvas: CacheCanvas; displayStockTime?: number; };

export type PictureRegistryParts = Omit<PictureRegistry, 'properties'> & { propertiesText: string };

export type PictureExternalImageItem = {
    status: "loading" | "success" | "failed",
    element?: HTMLImageElement
};

export type NextPicturePartsInfo = {
    layerNumber: number,
    partsNumber: number,
    partsType: PartsType,
    connectProperties: boolean,
};

export type TimeType = "milisecond" | "frame";

/**
 * WWATimer のポイントを一意に示す名前です。
 * 時間制御のプロパティを追加した場合は、この PointNames に対応した名前を付与してください。
 */
export type TimePointName =
    | "start"
    | "end"
    | "startAnim"
    | "endAnim"
    | "wait";

export type TimePoint = {
    value: number;
    type: TimeType;
};
