import * as Acorn from "./acorn";
export * from "./converter";
export * from "./eval";

export function parse(rawMessage: string): Acorn.Node {
  return Acorn.parse(rawMessage, {ecmaVersion: 2020});
}
