import type { Primitive } from "./_common";

type SeenRefMap = WeakMap<object, unknown>;
export type ObjectToMap<T> = UnionToIntersection<
  T extends Primitive
    ? T
    : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<ObjectToMap<U>>
    : T extends Array<infer U>
    ? Array<ObjectToMap<U>>
    : T extends object
    ? Record<never, never> extends T
      ? Map<string, never>
      : {
          [K in keyof T]: Map<K, ObjectToMap<T[K]>>;
        }[keyof T]
    : never
>;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer R
) => void
  ? R
  : never;

export function convertObjectToMap<T extends Primitive>(
  input: T,
  seen?: SeenRefMap
): T;
export function convertObjectToMap<T extends Array<unknown>>(
  input: T,
  seen?: SeenRefMap
): T;
export function convertObjectToMap<T extends Exclude<object, null>>(
  input: T,
  seen?: SeenRefMap
): ObjectToMap<T>;
export function convertObjectToMap(
  input: unknown,
  seen = new WeakMap<object, unknown>()
): unknown {
  if (typeof input === "symbol") {
    throw new TypeError("symbol は変換対象外です")
  }
  if (typeof input !== "object" || input === null) {
    return input;
  }
  if (seen.has(input)) {
    return seen.get(input);
  }
  if (Array.isArray(input)) {
    const arr: unknown[] = [];
    seen.set(input, arr);
    for (const item of input) {
      arr.push(convertObjectToMap(item, seen));
    }
    return arr;
  }

  const map = new Map<string, unknown>();
  seen.set(input, map);
  for (const [key, value] of Object.entries(input)) {
    if (typeof key !== "string") {
      throw new TypeError("文字列以外のキーは変換できません");
    }
    map.set(key, convertObjectToMap(value, seen));
  }
  return map;
}
