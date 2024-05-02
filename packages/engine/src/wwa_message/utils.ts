/**
 * 文字列を解析して相対値を数値に変換します。
 * 
 * # 変換の仕方
 * "+0" => baseValue の値が出力されます
 * "+1" => baseValue に 1 を追加された値が出力されます
 * "-2" => baseValue に -2 を追加された値が出力されます
 * "12" => 12 という数値で値が出力されます
 * "abc" => 解析できないため、エラーが出力されます
 *
 * @param relativeValue 相対値あるいは絶対値の文字列
 * @param baseValue 相対値を指定した場合の基本値
 * @param 相対値を指定した場合、基本値から増減した値。絶対値を指定した場合、そのままの数値。
 * @throws 相対値あるいは絶対値として解析不可能な文字列を指定した場合
 */
export const convertRelativeValue = (relativeValue: string, baseValue: number) => {
    if (relativeValue[0] === "+") {
        const add = parseInt(relativeValue.substring(1, 10));
        if (Number.isNaN(add)) {
            throw new Error("+ 以降の文字列は数値形式で記載してください。");
        }
        return baseValue + add;
        
    } else if (relativeValue[0] === "-") {
        const sub = parseInt(relativeValue.substring(1, 10));
        if (Number.isNaN(sub)) {
            throw new Error("- 以降の文字列は数値形式で記載してください。");
        }
        return baseValue - sub;
    }
    const number = parseInt(relativeValue, 10);
    if (Number.isNaN(number)) {
        throw new Error("数値形式ではないため、解析できません。");
    }
    return number;
};
