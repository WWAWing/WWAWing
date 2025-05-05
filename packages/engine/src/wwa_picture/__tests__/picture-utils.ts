import { isAnonymousPicture, isValidLayerNumber } from "../utils";

describe("picture-utils", () => {
    describe("isValidLayerNumber", () => {
        it("正の整数のレイヤー番号を受け付ける", () => {
            expect(isValidLayerNumber(1)).toBe(true);
        });
        it("小数点付きのレイヤー番号は受け付けない", () => {
            expect(isValidLayerNumber(1.234)).toBe(false);
        });
        it("無名ピクチャのレイヤー番号を受け付ける", () => {
            expect(isValidLayerNumber(-1)).toBe(true);
        });
        it("負のレイヤー番号は受け付けない", () => {
            expect(isValidLayerNumber(-999)).toBe(false);
        });
    });
    describe("isAnonymousPicture", () => {
        it("レイヤー番号 -1 は無名ピクチャである", () => {
            expect(isAnonymousPicture(-1)).toBe(true);
        });
        it("レイヤー番号 -1 以外は無名ピクチャではない", () => {
            expect(isAnonymousPicture(10)).toBe(false);
        });
    });
});
