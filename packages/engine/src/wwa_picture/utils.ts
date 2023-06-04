import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { PictureProperties } from "@wwawing/common-interface/lib/wwa_picture";
import { PictureRegistoryParts } from "./typedef";

export const convertPictureRegistoryFromText = (partsRegistory: PictureRegistoryParts): PictureRegistory => {
    const jsonObject = JSON.parse(partsRegistory.propertiesText);
    if (Array.isArray(jsonObject)) {
        throw new Error("配列形式ではなくオブジェクト形式で記述してください。");
    }
    if (typeof jsonObject !== 'object') {
        throw new Error("オブジェクト形式で記述してください。");
    }
    return {
        ...partsRegistory,
        properties: jsonObject as PictureProperties
    };
};
