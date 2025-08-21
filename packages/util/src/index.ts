export { convertObjectToMap, type ObjectToMap } from "./objectToMap";
export { convertMapToObject } from "./mapToObject";

export function isPrimitive(x: unknown): x is string | number | boolean | bigint | symbol | null | undefined {
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