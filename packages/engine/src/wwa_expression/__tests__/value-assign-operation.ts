import {
     generateValueAssignOperation,
     type CoordAssignOperation,
     type ItemAssignOperation,
     type VariableAssignOperation,
     type NoExtraArgumentValueeAssignOperation
 } from "../value-assign-operation";

describe("generateValueAssignOperation", () => {
    it("ユーザ変数への代入操作オブジェクトを生成できる", () => {
        const result = generateValueAssignOperation(2100, "v[140]") as VariableAssignOperation;
        expect(result.assignee).toBe("variable");
        expect(result.index).toBe(140);
        expect(result.rawValue).toBe(2100);
    });
    it("範囲外のユーザ変数への代入操作オブジェクトもここでは生成できる", () => {
        const result = generateValueAssignOperation(2100, "v[300]") as VariableAssignOperation;
        expect(result.assignee).toBe("variable");
        expect(result.index).toBe(300);
        expect(result.rawValue).toBe(2100);
    });

    it("数値に解決できない添字は使用できない", () => {
        expect(() => generateValueAssignOperation(2100, "v[hogehoge]")).toThrow(Error);
    });
    it("背景パーツへの代入操作オブジェクトを生成できる", () => {
        const result = generateValueAssignOperation(10, "m[140][200]") as CoordAssignOperation;
        expect(result.assignee).toBe("map");
        expect(result.x).toBe(140);
        expect(result.y).toBe(200);
        expect(result.rawValue).toBe(10);

    });
    it("物体パーツへの代入操作オブジェクトを生成できる", () => {
        const result = generateValueAssignOperation(33, "o[10][20]") as CoordAssignOperation;
        expect(result.assignee).toBe("mapObject");
        expect(result.x).toBe(10);
        expect(result.y).toBe(20);
        expect(result.rawValue).toBe(33);
    });
    it("アイテムボックスへの代入操作オブジェクトを生成できる", () => {
        const result = generateValueAssignOperation(100, "ITEM[10]") as ItemAssignOperation;
        expect(result.assignee).toBe("item");
        expect(result.boxIndex1to12).toBe(10);
    });
    it("所持アイテム数への代入オブジェクトは生成できない", () => {
        expect(() => generateValueAssignOperation(10, "ITEM_COUNT_ALL")).toThrow(Error);
    });
    it("定数への代入オブジェクトは生成できない", () => {
        expect(() => generateValueAssignOperation(10, "500")).toThrow(Error);
        expect(() => generateValueAssignOperation(10, "-12345")).toThrow(Error);
    });
    it("ステータスへの代入操作オブジェクトを生成できる", () => {
        const expressionAndTypePairs = [
            ["HP", "energy"],
            ["HPMAX", "energyMax"],
            ["AT", "strength"],
            ["DF", "defence"],
            ["GD", "gold"],
            ["STEP", "moveCount"],
            ["PDIR", "playerDirection"]
        ];
        expressionAndTypePairs.forEach(pair => {
            const result = generateValueAssignOperation(0, pair[0]) as NoExtraArgumentValueeAssignOperation;
            expect(result).toMatchObject({ assignee: pair[1], rawValue: 0 });
        });
    });
    it("変更不可能な値への代入操作オブジェクトは生成できない", () => {
        const expressions = [
            "ITEM_COUNT_ALL", "AT_TOTAL", "AT_ITEMS", "DF_TOTAL", "DF_ITEMS",
            "TIME", "PX", "PY", "X", "Y", "ID", "TYPE", "ITEM_COUNT"];
        expressions.forEach(expression => {
            expect(() => generateValueAssignOperation(111, expression)).toThrowError(Error);
        });
    });
    it("関数への代入操作オブジェクトは生成できない", () => {
        expect(() => generateValueAssignOperation(100, "RAND(100)")).toThrowError(Error);
    });
});
