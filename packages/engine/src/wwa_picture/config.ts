import { PictureProperties } from "@wwawing/common-interface/lib/wwa_picture";

export const MAX_PICTURE_LAYERS_COUNT = 16;

type PicturePropertyType = "number" | "numberArray" | "string";

type PicturePropertyDefinitionItem = {
    name: keyof PictureProperties,
    type: PicturePropertyType,
};

/**
 * ピクチャで使用可能なプロパティの詳細定義です。
 * type は処理するプロパティの種類です。
 */
export const PicturePropertyDefinitions: PicturePropertyDefinitionItem[] = [
    { name: "pos", type: "numberArray" },
    { name: "time", type: "number" },
    { name: "size", type: "numberArray" },
    { name: "repeat", type: "numberArray" },
    { name: "img", type: "numberArray" },
    { name: "crop", type: "numberArray" },
    { name: "text", type: "string" },
    { name: "font", type: "string" },
    { name: "color", type: "numberArray" },
    { name: "textAlign", type: "string" },
];
