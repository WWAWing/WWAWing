import { evalLengthFunction } from "../functions/length";

describe("functions-test", () => {
  describe("length", () => {
    it("文字列形式の場合はその文字の長さが出力される", () => {
      expect(evalLengthFunction("wwa wing")).toBe(8);
    });
    it("配列形式の場合はその項目数が出力される", () => {
      expect(evalLengthFunction([123, 456, 7890])).toBe(3);
    });
    it("Object 形式の場合はそのキーの数が出力される", () => {
      expect(evalLengthFunction({ wwa: "hogehoge", wing: "fugafuga" })).toBe(2);
    });
    it("数値形式の場合は取り扱えない", () => {
      expect(() => evalLengthFunction(12345)).toThrowError();
    });
    it("null の場合は取り扱えない", () => {
      expect(() => evalLengthFunction(null)).toThrowError();
    });
    it("boolean 形式の場合は取り扱えない", () => {
      expect(() => evalLengthFunction(true)).toThrowError();
      expect(() => evalLengthFunction(false)).toThrowError();
    });
  })
});
