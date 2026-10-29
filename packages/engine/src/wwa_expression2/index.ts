import * as Acorn from "./acorn";
export * from "./converter";
export * from "./eval";
export * from "./typedef";

export function parse(rawMessage: string): Acorn.Node {
  return Acorn.parse(rawMessage, {ecmaVersion: 2020});
}
