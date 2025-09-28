import type { Primitive } from "./_common";
export { convertObjectToMap, type ObjectToMap } from "./objectToMap";
export { convertMapToObject } from "./mapToObject";

export type { Primitive }

export function isPrimitive(x: unknown): x is Primitive {
  return (
    typeof x === "string" ||
    typeof x === "number" ||
    typeof x === "boolean" ||
    typeof x === "bigint" || 
    typeof x === "symbol" ||
    x === null ||
    x === undefined
  );
}
