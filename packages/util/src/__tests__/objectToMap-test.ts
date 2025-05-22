import { convertObjectToMap } from "../objectToMap"

describe("convertObjectToMap", () => {
    it("プリミティブを変換すると、同じ内容のプリミティブになる", () => {
        expect(convertObjectToMap(true)).toStrictEqual(true);
        expect(convertObjectToMap(false)).toStrictEqual(false);
        expect(convertObjectToMap(42)).toStrictEqual(42);
        expect(convertObjectToMap(1e+99)).toStrictEqual(1e+99);
        expect(convertObjectToMap(BigInt("12345678909876543210"))).toStrictEqual(BigInt("12345678909876543210"));
        expect(convertObjectToMap("🍣")).toStrictEqual("🍣");
        expect(convertObjectToMap(undefined)).toBeUndefined();
        expect(convertObjectToMap(null)).toBeNull();
    });
    it("配列を変換すると、同じ内容の配列になる", () => {
        expect(convertObjectToMap([1, 2, 3])).toStrictEqual([1, 2, 3])
    });
    it("オブジェクトを変換すると、Mapになる", () => {
        const result = convertObjectToMap({
            foo: "bar",
            hoge: 31415
        });
        expect(result).toBeInstanceOf(Map);
        expect(result.get("foo")).toEqual("bar");
        expect(result.get("hoge")).toEqual(31415);
    });
    it("オブジェクトを変換したとき、Mapになっても同じ参照は維持される", () => {
        const refA = { foo: { bar: null } };
        const result = convertObjectToMap({
          ref1: refA,
          ref2: refA,
          ref3: { foo: { bar: null } }, // 異なる参照
        });
        expect(result).toBeInstanceOf(Map);
        expect(result.get("ref1") === result.get("ref2")).toBeTruthy();
        expect(result.get("ref1") === result.get("ref3")).toBeFalsy();
        expect(result.get("ref2") === result.get("ref3")).toBeFalsy();
    });
    it("循環参照を変換できる", () => {
        const refA: { next: unknown } = { next: null };
        refA.next = refA;
        const result = convertObjectToMap(refA);
        expect(result).toBeInstanceOf(Map);
        expect(result.get("next") === result).toBeTruthy();
    })
    it("空オブジェクトを変換できる", () => {
        const result = convertObjectToMap({});
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
    })
    it("配列とオブジェクトがネストしていても変換できる", () => {
        const refA = { foo: { bar: null as unknown } };
        const refB = [{
                ref1: refA,
                ref2: refA,
                ref3: { foo: { bar: null } }, 
                ref4: [{test1: { test2: { test3: {} }}}]
            }, refA] as const;
        refA.foo.bar = refB;
        const result = convertObjectToMap(refB)
        expect(result).toBeInstanceOf(Array);
        expect(result[0]).toBeInstanceOf(Map);
        expect(result[0]).toBeInstanceOf(Map);
        expect(result[0].get("ref1") === result[0].get("ref2")).toBeTruthy();
        expect(result[0].get("ref1") === result[0].get("ref3")).toBeFalsy();
        expect(result[0].get("ref2") === result[0].get("ref3")).toBeFalsy();
        expect(result[0].get("ref1") === result[1]).toBeTruthy();
        const resultRef1 = result[0].get("ref1");
        if (!(resultRef1 instanceof Map)) {
            fail("変換結果の ref1 が Map になっていません！");
        }
        const resultFoo = resultRef1.get("foo");
        if (!(resultFoo instanceof Map)) {
            fail("変換結果の foo が Map になっていません！");
        }
        expect(resultFoo.get("bar") === result).toBeTruthy();
        const resultRef4 = result[0].get("ref4");
        if (!(resultRef4 instanceof Array)) {
            fail("変換結果の ref4 が Map になっていません！");
        }
        const resultRef4_0 = resultRef4[0];
        if (!(resultRef4_0 instanceof Map)) {
            fail("変換結果の ref4[0] が Map になっていません！");
        }
        const maybeEmptyMap = resultRef4_0.get("test1")?.get("test2")?.get("test3");
        if (!(maybeEmptyMap instanceof Map)) {
            fail("変換結果の ref4[0].test1.test2.test3 が Map になっていません！");
        }
        expect(maybeEmptyMap.size).toBe(0);
    })

})