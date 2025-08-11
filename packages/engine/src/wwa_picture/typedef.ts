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

/**
 * ピクチャの描画方法を一意に識別する文字列です。
 * `"minimum"` は最低限のサイズで描画します。負荷が軽いので、サイズが決まっている場合はこちらの使用をおすすめします。
 * `"maximum"` は描画範囲内、最大のサイズで描画します。テキストの描画など、サイズが分からない場合はこちらをご利用ください。
 */
export type DrawCoordType = "minimum" | "minimumWithMargin" | "maximum";
