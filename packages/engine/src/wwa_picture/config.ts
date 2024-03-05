import { PictureProperties } from "@wwawing/common-interface/lib/wwa_picture";

type PicturePropertyType = "number" | "numberArray" | "string";

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
    { name: "time", type: "number" },
    { name: "size", type: "numberArray" },
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
    { name: "next", type: "numberArray" },
    { name: "map", type: "numberArray" },
    { name: "script", type: "string" },
];

/**
 * ピクチャのプロパティ名のスネークケースとキャメルケースの対応オブジェクトです。
 * スネークケースとキャメルケースが混在する場合はこのオブジェクトにプロパティを追加してください。
 */
export const propertySnakeCaseTable: { [key: string]: PicturePropertyName } = {
    "img_file": "imgFile",
    "font_size": "fontSize",
    "font_family": "fontFamily",
    "text_align": "textAlign",
    "line_height": "lineHeight"
};
