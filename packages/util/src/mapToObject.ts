import type { Primitive } from "./_common";

type SeenRefMap = WeakMap<Map<string, unknown> | Array<unknown>, unknown>;

// WWA ではパスワードセーブに利用されるのみであり、雑な型をつけても特に差し支えない。
// 保守コストを下げる意味でも雑な型を付けるに留める。
export function convertMapToObject<T extends Primitive>(
  input: T,
  seen?: SeenRefMap 
): T;
export function convertMapToObject<T extends ReadonlyArray<unknown>>(
  input: T,
  seen?:SeenRefMap 
): ReadonlyArray<unknown>;
export function convertMapToObject<T extends Array<unknown>>(
  input: T,
  seen?:SeenRefMap 
): Array<unknown>;
export function convertMapToObject<T extends Map<string, unknown>>(
  input: T,
  seen?:SeenRefMap
): Record<string, unknown>;
export function convertMapToObject(input: unknown, seen = new WeakMap<Map<string, unknown> | Array<unknown>, unknown>()): any {
  if (typeof input === "symbol") {
    throw new TypeError("symbol は変換対象外です")
  }

  if (input instanceof Map) {
    if (seen.has(input)) {
        return seen.get(input);
    }
    const obj: { [key: string]: unknown } = Object.create(null);
    seen.set(input, obj);
    for (const [key, value] of input.entries()) {
      obj[key] = convertMapToObject(value, seen);
    }
    return obj;
  }

  if (Array.isArray(input)) {
    if (seen.has(input)) {
      return seen.get(input);
    }
    const arr: unknown[] = [];
    seen.set(input, arr);
    for (const item of input) {
      arr.push(convertMapToObject(item, seen));
    }
    return arr;
  }

  if (typeof input === 'object' && input !== null) {
    throw new TypeError("Mapおよび配列でないオブジェクトは変換対象外です");
  } 

  // プリミティブ
  return input; 
}
