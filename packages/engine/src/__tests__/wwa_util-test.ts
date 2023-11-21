import { formatUserVarForDisplay } from "../wwa_util";

describe("wwa_util", () => {
    describe("formatUserVarForDisplay", () => {
        it("数値をフォーマットできる", () => {
            expect(formatUserVarForDisplay(1)).toBe("1");
            expect(formatUserVarForDisplay(123456789)).toBe("123456789");
        });
        it("booleanをフォーマットできる", () => {
            expect(formatUserVarForDisplay(true)).toBe("true");
            expect(formatUserVarForDisplay(false)).toBe("false");
        });
        it("10文字以下の文字列は二重引用符でくくられる", () => {
            expect(formatUserVarForDisplay("hogehoge")).toBe("\"hogehoge\"");
        });
        it("11文字以上の文字列は省略される", () => {
            expect(formatUserVarForDisplay("012345678901")).toBe("\"0123456789…");
        });
        it("サロゲートペアで構成される文字はコードポイントの数で文字数が計算される", () => {
            expect(formatUserVarForDisplay("🍣".repeat(20))).toBe("\"🍣🍣🍣🍣🍣🍣🍣🍣🍣🍣…");
            // サンプルは https://blog.jxck.io/entries/2017-03-02/unicode-in-javascript.html より引用させていただきました。
            expect(formatUserVarForDisplay("𠮷野屋で𩸽頼んで𠮟られる😭")).toBe("\"𠮷野屋で𩸽頼んで𠮟ら…");
        })
    });
});
