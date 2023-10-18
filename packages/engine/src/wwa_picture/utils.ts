import { PictureRegistory, RawPictureRegistory, WWAData } from "@wwawing/common-interface/lib/wwa_data";
import { PictureRegistoryParts } from "./typedef";

export const convertPictureRegistoryFromText = (partsRegistory: PictureRegistoryParts): RawPictureRegistory => {
    const jsonObject = JSON.parse(partsRegistory.propertiesText);
    if (Array.isArray(jsonObject)) {
        throw new Error("配列形式ではなくオブジェクト形式で記述してください。");
    }
    if (typeof jsonObject !== 'object') {
        throw new Error("オブジェクト形式で記述してください。");
    }
    return {
        ...partsRegistory,
        properties: jsonObject
    };
};

const variableRegExp = /v\[(\d+)\]/;
export const convertVariablesFromRawRegistory = (registory: RawPictureRegistory, wwaData: WWAData): PictureRegistory => {
    const stringToNumber = (value: string): number | string => {
        // 変数参照の場合
        if (value.match(variableRegExp) === null) {
            return value;
        }
        // TODO 汎用的な解析システムを使用したい
        const matches = value.match(variableRegExp);
        const userVarNumber = matches?.[1];
        if (userVarNumber === null || userVarNumber === undefined) {
            console.warn(`ピクチャーの登録でユーザー変数番号が算出できませんでした。入った文字列は ${value} でした。`);
            // 解析エラーという扱いで 0 とする
            return 0;
        }
        return wwaData.userVar[userVarNumber] ?? 0;
    }
    const propertiesArray = Object.entries(registory.properties).map(([key, value]) => {
        if (Array.isArray(value)) {
            return [key, value.map((valueItem) => typeof valueItem === "string" ? stringToNumber(valueItem) : valueItem)]
        }
        // TODO 数値形式の想定で非数値形式が代入された場合はどうするか？
        return [key, typeof value === "string" ? stringToNumber(value) : value];
    });
    return {
        ...registory,
        properties: Object.fromEntries(propertiesArray)
    };
};
