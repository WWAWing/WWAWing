import { PictureRegistory, RawPictureRegistory, WWAData } from "@wwawing/common-interface/lib/wwa_data";
import { PictureRegistoryParts } from "./typedef";
import { PicturePropertyDefinitions } from "./config";
import { TokenValues, evaluateMacroArgExpression, regPictureTemplate } from "../wwa_expression";

export const convertPictureRegistoryFromText = (partsRegistory: PictureRegistoryParts): RawPictureRegistory => {
    try {
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
    } catch (e) {
        console.error(`JSON パースエラーが発生しました！: ${e.message}`);
    }
};

export const convertVariablesFromRawRegistory = (registory: RawPictureRegistory, tokenValues: TokenValues): PictureRegistory => {
    // 数値専用形式で数値あるいは文字列が来た場合、正規表現で置き換えて処理する関数
    const stringToNumberForNumericValue = (value: string | number): number | string => {
        // 数値そのままの場合
        if (typeof value === "number") {
            return value;
        }
        // 変数参照などの場合
        return evaluateMacroArgExpression(value, tokenValues);
    }
    const propertiesArray = Object.entries(registory.properties).map(([key, value]) => {
        const definitions = PicturePropertyDefinitions.find(({ name }) => name === key);
        if (!definitions) {
            // 本来ならエラーにすべきだが、あらかじめバリデーションを通している関係でそのままスルーする。ただし警告は出す。
            // TODO フィルターをかけて定義街のプロパティを排除してもいいかもしれない
            console.warn(`定義外のプロパティ ${key} を見つけました。`);
            return [key, value];
        }
        switch (definitions.type) {
            case "number":
                return [key, stringToNumberForNumericValue(value)];
            case "numberArray":
                return [key, value.map(stringToNumberForNumericValue)]
            case "string":
                if (typeof value !== "string") {
                    if (typeof value !== "number") {
                        console.warn(`プロパティ ${key} では文字列形式である必要があります。実際に入った値は ${value} です。`);
                    }
                    return [key, value];
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
                return [key, evaluatedString];
            default:
                return [key, value];
        }
    });
    return {
        ...registory,
        properties: Object.fromEntries(propertiesArray)
    };
};
