import { convertRelativeValue } from "../utils";

describe("relativeValue", () => {
    it("+0 で baseValue が出力される", () => {
        const result = convertRelativeValue("+0", 123);
        expect(result).toBe(123);
    });
    it("+1 で baseValue + 1 が出力される", () => {
        const result = convertRelativeValue("+1", 123);
        expect(result).toBe(124);
    });
    it("-2 で baseValue -2 が出力される", () => {
        const result = convertRelativeValue("-2", 123);
        expect(result).toBe(121);
    });
    it("数値が出力される", () => {
        const result = convertRelativeValue("0", 123);
        expect(result).toBe(0);
    });
    it("解析できない文字列は使用できない", () => {
        expect(() => convertRelativeValue("hoge", 123)).toThrow(Error);
    });
    it("解析できない文字列は使用できない (+相対値)", () => {
        expect(() => convertRelativeValue("+hoge", 123)).toThrow(Error);
    });
    it("解析できない文字列は使用できない (-相対値)", () => {
        expect(() => convertRelativeValue("+fuga", 123)).toThrow(Error);
    });
});
