import { PictureRegistry, RawPictureRegistry } from "@wwawing/common-interface/lib/wwa_data";
import { PictureRegistryParts } from "./typedef";
import { PicturePropertyDefinitions, PicturePropertyName, propertySnakeCaseTable } from "./config";
import { TokenValues, evaluateMacroArgExpression, regPictureTemplate } from "../wwa_expression";

export const convertPictureRegistryFromText = (partsRegistry: PictureRegistryParts): RawPictureRegistry => {
    try {
        const jsonObject = JSON.parse(partsRegistry.propertiesText);
        if (Array.isArray(jsonObject)) {
            throw new Error("配列形式ではなくオブジェクト形式で記述してください。");
        }
        if (typeof jsonObject !== 'object') {
            throw new Error("オブジェクト形式で記述してください。");
        }
        return {
            ...partsRegistry,
            properties: jsonObject
        };
    } catch (e) {
        console.error(`JSON パースエラーが発生しました！: ${e.message}`);
    }
};

const validatePropertyValue = (key: string, value: unknown): boolean => {
    const definitions = PicturePropertyDefinitions.find(({ name }) => name === key);
    if (!definitions) {
        // 本来ならエラーにすべきだが、あらかじめバリデーションを通している関係でそのままスルーする。ただし警告は出す。
        // TODO フィルターをかけて定義街のプロパティを排除してもいいかもしれない
        console.warn(`定義外のプロパティ ${key} を見つけました。`);
        return false;
    }
    switch (definitions.type) {
        case "numberArray2D": {
            if (!Array.isArray(value)) {
                console.warn(`プロパティ ${key} は配列形式である必要がありますが、配列形式になっていません。`);
                return false;
            }
            const invalidValueIndexes = value
                .map((xValue, index) => !Array.isArray(xValue) ? index + 1 : null)
                .filter((index) => index !== null)
            if (invalidValueIndexes.length > 0) {
                console.warn(`プロパティ ${key} は配列の配列である必要がありますが、 ${invalidValueIndexes.join(", ")} の要素が配列形式になっていません。`);
                return false;
            }
            break;
        }
        case "string":
            // TODO "text" プロパティのように文字列も数値も受け付けるプロパティと、 "textAlign" プロパティのように文字列しか受け付けないプロパティで種類を分けたい
            if (typeof value !== "string") {
                if (typeof value === "number") {
                    console.warn(`プロパティ ${key} は文字列形式を推奨しています。実際に入った値は ${value} です。`);
                } else {
                    console.warn(`プロパティ ${key} では文字列形式である必要があります。実際に入った値は ${value} です。`);
                    return false;
                }
            }
    }
    return true;
};

const matchToSnakeCaseProperty = (propertyName: PicturePropertyName) => {
    return propertySnakeCaseTable[propertyName] ?? propertyName;
};

export const isValidLayerNumber = (layerNumber: number) =>
    Number.isInteger(layerNumber) && (layerNumber > 0 || isAnonymousPicture(layerNumber));

export const isAnonymousPicture = (layerNumber: number) => layerNumber === -1;

export const checkValuesFromRawRegistry = (registry: RawPictureRegistry): PictureRegistry => {
    const propertiesArray = Object.entries(registry.properties).map(([key, value]) => {
        const camelCaseKey = matchToSnakeCaseProperty(key as PicturePropertyName);
        if (!validatePropertyValue(camelCaseKey, value)) {
            return [camelCaseKey, value];
        }
        // "v[10]" のような文字列からの変換はしないものの、 string であるはずなのに number で来た場合は string に変えるなど、最低限変換は行うようにする。
        const definitions = PicturePropertyDefinitions.find(({ name }) => name === camelCaseKey);
        switch (definitions.type) {
            case "string":
                if (typeof value !== "string") {
                    return [camelCaseKey, value.toString()];
                }
        }
        return [camelCaseKey, value];
    })
    return {
        ...registry,
        properties: Object.fromEntries(propertiesArray)
    };
};

export const convertVariablesFromRawRegistry = (registry: RawPictureRegistry, tokenValues: TokenValues): PictureRegistry => {
    // 数値専用形式で数値あるいは文字列が来た場合、正規表現で置き換えて処理する関数
    const stringToNumberForNumericValue = (value: string | number): number | string => {
        // 数値そのままの場合
        if (typeof value === "number") {
            return value;
        }
        // 変数参照などの場合
        return evaluateMacroArgExpression(value, tokenValues);
    }
    const propertiesArray = Object.entries(registry.properties).map(([key, value]) => {
        const camelCaseKey = matchToSnakeCaseProperty(key as PicturePropertyName);
        if (!validatePropertyValue(camelCaseKey, value)) {
            return [camelCaseKey, value];
        }
        const definitions = PicturePropertyDefinitions.find(({ name }) => name === camelCaseKey);
        switch (definitions.type) {
            case "number":
                return [camelCaseKey, stringToNumberForNumericValue(value)];
            case "numberArray":
                return [camelCaseKey, value.map(stringToNumberForNumericValue)];
            case "numberOrArray":
                if (Array.isArray(value)) {
                    return [camelCaseKey, value.map(stringToNumberForNumericValue)];
                }
                return [camelCaseKey, [stringToNumberForNumericValue(value)]];
            case "numberArray2D":
                // 細かいバリデーションは validatePropertyValue で実行済みなのでここでは簡潔に
                if (!Array.isArray(value) || value.some(Array.isArray)) {
                    return [camelCaseKey, value];
                }
                return [camelCaseKey, value.map((xValue) => xValue.map(stringToNumberForNumericValue))];
            case "string":
                if (typeof value !== "string") {
                    return [camelCaseKey, value.toString()];
                }
                let evaluatedString = String(value);
                // spread 構文の使用には tsconfig の変更が必要
                // 正規表現の扱いについてはまだエラーを発することが多いので、 try-catch を囲んでもいいかもしれない
                const targetValues = Array.from(value.matchAll(regPictureTemplate));
                targetValues.forEach((matchedExpression) => {
                    if (matchedExpression.length < 2) {
                        console.warn(`テンプレート文字列で合致した文字列の中の値を取り出すことができませんでした。文字列そのものの値は ${value} です。`);
                    }
                    const targetExpression = matchedExpression[0];
                    const evaluateExpression = matchedExpression[1];
                    const evaluatedValue = stringToNumberForNumericValue(evaluateExpression);
                    evaluatedString = evaluatedString.replace(
                        targetExpression,
                        typeof evaluatedValue === "number" ? evaluatedValue.toString() : evaluatedValue
                    );
                });
                return [camelCaseKey, evaluatedString];
            default:
                return [camelCaseKey, value];
        }
    });
    return {
        ...registry,
        properties: Object.fromEntries(propertiesArray)
    };
};

/**
 * 配列か単体の値かわからない値から項目を取得します。
 * @param value 対象の配列、あるいは値単体
 * @param index 配列の場合、何番を取得するか？
 * @param isDefaultValue 単体の場合、そのまま返してよいか？
 */
export const getArrayItemFromSingleOrArray = <T>(value: T | T[], index: number, isDefaultValue: boolean) => {
    if (!Array.isArray(value)) {
        if (isDefaultValue) {
            return value;
        }
        return undefined;
    }
    return value[index];
};

export const canDrawChip = (imgPosX: number, imgPosY: number, imgPosX2: number, imgPosY2: number) =>
    imgPosX > 0 || imgPosY > 0 || imgPosX2 > 0 || imgPosY2 > 0;

export const adjustPositiveValue = (value: number) => {
    if (value < 0) {
        return 0;
    }
    return value;
}

/**
 * anchor の値に応じて拡大時の X 座標を補正します。
 * @param x 現在の X 座標
 * @param width 横幅 (ピクセル単位)
 * @param anchor 軸 (テンキーの位置と連動)
 */
export const getHorizontalCorrectionBySizeAnchor = (x: number, width: number, anchor: number) => {
    switch (anchor) {
        // 左
        case 1:
        case 4:
        case 7:
            return x;
        // 中
        case 2:
        case 5:
        case 8:
            return x - (width / 2);
        // 右
        case 3:
        case 6:
        case 9:
            return x - width;
        default:
            return x;
    }
};

/**
 * 円運動の X 座標を算出します。
 * @param x 現在の X 座標
 * @param radius 半径
 * @param angle 角度
 */
export const getHorizontalCirclePosition = (x: number, radius: number, angle: number) => {
    if (radius === 0) {
        return x;
    }
    const rad = angle * Math.PI / 180.0;
    return x + (radius * Math.cos(rad));
};

/**
 * anchor の値に応じて拡大時の Y 座標を補正します。
 * @param y 現在の Y 座標
 * @param height 縦幅 (ピクセル単位)
 * @param anchor 軸 (テンキーの位置と連動)
 */
export const getVerticalCorrectionBySizeAnchor = (y: number, height: number, anchor: number) => {
    switch (anchor) {
        // 下
        case 1:
        case 2:
        case 3:
            return y - height;
        // 中
        case 4:
        case 5:
        case 6:
            return y - (height / 2);
        // 上
        case 7:
        case 8:
        case 9:
        default:
            return y;
    }
};

/**
 * 円運動の Y 座標を算出します。
 * @param y 現在の Y 座標
 * @param radius 半径
 * @param angle 角度
 */
export const getVerticalCirclePosition = (y: number, radius: number, angle: number) => {
    if (radius === 0) {
        return y;
    }
    const rad = angle * Math.PI / 180.0;
    return y + (radius * Math.sin(rad));
};

/**
 * 指定した横幅を、 Canvas で使用可能な横幅に変換します。
 * 横幅が 0 以下になると OffscreenCanvas では ImageBitmap が正しく出力されないため、1以上の値に調整します。
 * @param width 横幅 (px 単位)
 * @returns Canvas で設定しても安全な状態の横幅 (px 単位)
 */
export const convertAppliableCanvasWidth = (width: number) => Math.max(width, 1);
export const convertAppliableCanvasHeight = (height: number) => Math.max(height, 1);
