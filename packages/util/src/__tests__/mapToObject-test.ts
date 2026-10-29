import { convertMapToObject } from "../mapToObject";

describe("convertMapToObject", () => {
  it("プリミティブを変換すると、同じ内容のプリミティブになる", () => {
    expect(convertMapToObject(true)).toStrictEqual(true);
    expect(convertMapToObject(false)).toStrictEqual(false);
    expect(convertMapToObject(42)).toStrictEqual(42);
    expect(convertMapToObject(1e99)).toStrictEqual(1e99);
    expect(convertMapToObject(BigInt("12345678909876543210"))).toStrictEqual(
      BigInt("12345678909876543210")
    );
    expect(convertMapToObject("🍣")).toStrictEqual("🍣");
    expect(convertMapToObject(undefined)).toBeUndefined();
    expect(convertMapToObject(null)).toBeNull();
  });
  it("配列を変換すると、同じ内容の配列になる", () => {
    expect(convertMapToObject([1, 2, 3])).toStrictEqual([1, 2, 3]);
  });
  it("Mapを変換すると、オブジェクトになる", () => {
    const result = convertMapToObject(
      new Map<string, unknown>([
        ["foo", "bar"],
        ["hoge", 31415],
      ])
    );
    expect(result).toMatchObject({
      foo: "bar",
      hoge: 31415,
    });
  });
  it("Mapを変換したとき、オブジェクトになっても同じ参照は維持される", () => {
    const refA = new Map<string, unknown>([
      ["foo", new Map<string, unknown>([["bar", null]])],
    ]);
    const result = convertMapToObject(
      new Map<string, unknown>([
        ["ref1", refA],
        ["ref2", refA],
        [
          "ref3",
          new Map<string, unknown>([
            ["foo", new Map<string, unknown>([["bar", null]])],
          ]),
        ], // 異なる参照
      ])
    );
    expect(result.ref1 === result.ref2).toBeTruthy();
    expect(result.ref1 === result.ref3).toBeFalsy();
    expect(result.ref2 === result.ref3).toBeFalsy();
  });
  it("循環参照を変換できる", () => {
    const refA = new Map();
    refA.set("next", refA);
    const result = convertMapToObject(refA);
    expect(result.next === result).toBeTruthy();
  });
  it("空Mapを変換できる", () => {
    const result = convertMapToObject(new Map());
    expect(result).toMatchObject({});
  });
  it("配列とMapネストしていても変換できる", () => {
    const refA = new Map<"foo", Map<"bar", unknown>>([
      ["foo", new Map([["bar", null]])],
    ]);
    const refB = [
      new Map<"ref1" | "ref2" | "ref3" | "ref4", unknown>([
        ["ref1", refA],
        ["ref2", refA],
        [
          "ref3",
          new Map<string, unknown>([
            ["foo", new Map([["bar", null]])],
          ]),
        ],
        [
          "ref4",
          [
            new Map<"test1", Map<"test2", Map<"test3", unknown>>>([
              [
                "test1",
                new Map([
                  ["test2", new Map([["test3", new Map()]])],
                ]),
              ],
            ]),
          ],
        ],
      ]),
      refA,
    ];
    refA.get("foo")?.set("bar", refB);
    const result = convertMapToObject(refB);
    expect(result).toBeInstanceOf(Array);
    // convertMapToObject の戻り値の型は妥協しているので仕方ない
    // また、Map に一度変換している関係で, 値は Optional になる
    // 本来は値を評価する前にバリデーションをするのが望ましいが、まぁテストなので...
    const result0 = result[0] as {
      ref1?: { foo?: { bar?: unknown } };
      ref2?: { foo?: { bar?: unknown } };
      ref3?: { foo?: { bar?: unknown } };
      ref4?: unknown;
    };
    expect(result0.ref1 === result0.ref2).toBeTruthy();
    expect(result0.ref1 === result0.ref3).toBeFalsy();
    expect(result0.ref2 === result0.ref3).toBeFalsy();
    expect(result0.ref1 === result[1]).toBeTruthy();
    expect(result0.ref1?.foo?.bar === result).toBeTruthy();
    expect(result0.ref4).toMatchObject([{
      test1: {
        test2: {
          test3: {},
        },
      },
    }]);
  });
});
