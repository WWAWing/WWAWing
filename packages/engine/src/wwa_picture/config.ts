import { PictureProperties } from "@wwawing/common-interface/lib/wwa_picture";

// numberOrArray は numberArray と同じ扱いだが、無配列で記入した場合は配列に変換して使用する。
type PicturePropertyType = "number" | "numberArray" | "numberOrArray" | "numberArray2D" | "string";

export type PicturePropertyName = keyof PictureProperties;

type PicturePropertyDefinitionItem = {
    name: PicturePropertyName,
    type: PicturePropertyType,
};

/**
 * ピクチャで使用可能なプロパティの詳細定義です。
 * type は処理するプロパティの種類です。
 * プロパティ名はキャメルケースのみの記載してください。
 */
export const PicturePropertyDefinitions: PicturePropertyDefinitionItem[] = [
    { name: "pos", type: "numberArray" },
    { name: "time", type: "numberOrArray" },
    { name: "timeFrame", type: "numberOrArray" },
    { name: "size", type: "numberArray" },
    { name: "animTime", type: "numberArray" },
    { name: "animTimeFrame", type: "numberArray" },
    { name: "move", type: "numberArray" },
    { name: "accel", type: "numberArray" },
    { name: "zoom", type: "numberArray" },
    { name: "zoomAccel", type: "numberArray" },
    { name: "anchor", type: "number" },
    { name: "circle", type: "numberArray" },
    { name: "repeat", type: "numberArray" },
    { name: "img", type: "numberArray" },
    { name: "imgFile", type: "string" },
    { name: "sound", type: "number" },
    { name: "crop", type: "numberArray" },
    { name: "text", type: "string" },
    { name: "font", type: "string" },
    { name: "fontSize", type: "number" },
    { name: "fontFamily", type: "string" },
    { name: "italic", type: "number" },
    { name: "bold", type: "number" },
    { name: "color", type: "numberArray" },
    { name: "textAlign", type: "string" },
    { name: "lineHeight", type: "number" },
    { name: "opacity", type: "number" },
    { name: "fade", type: "number" },
    { name: "angle", type: "number" },
    { name: "rotate", type: "number" },
    { name: "wait", type: "number" },
    { name: "waitFrame", type: "number" },
    { name: "next", type: "numberArray" },
    { name: "create", type: "numberArray2D" },
    { name: "map", type: "numberArray" },
    { name: "script", type: "string" },
];

/**
 * ピクチャのプロパティ名のスネークケースとキャメルケースの対応オブジェクトです。
 * スネークケースとキャメルケースが混在する場合はこのオブジェクトにプロパティを追加してください。
 */
export const propertySnakeCaseTable: { [key: string]: PicturePropertyName } = {
    "time_frame": "timeFrame",
    "zoom_accel": "zoomAccel",
    "img_file": "imgFile",
    "font_size": "fontSize",
    "font_family": "fontFamily",
    "text_align": "textAlign",
    "line_height": "lineHeight",
    "wait_frame": "waitFrame",
};
