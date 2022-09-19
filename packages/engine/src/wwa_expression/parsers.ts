import { regNumber, regRand, regUserVar } from "./regexp";
import type { Comparable, CValue } from "./typedef";

export function isCValue(c: Comparable): c is CValue {
  return c.type !== "RAND";
}

export function parseType(str: string): Comparable | null {
  switch (str) {
    case "HP":
    case "HPMAX":
    case "AT":
    case "AT_TOTAL":
    case "AT_ITEMS":
    case "DF":
    case "DF_TOTAL":
    case "DF_ITEMS":
    case "GD":
    case "STEP":
    case "TIME":
    case "PX":
    case "PY":
      return { type: str };
    default:
      const userVarMatch = str.match(regUserVar);
      if (userVarMatch) {
        const index = userVarMatch.length >= 2 ? parseInt(userVarMatch[1], 10) : null;
        return (index !== null && !isNaN(index)) ? { type: "VARIABLE", index } : null;
      } 
      const numberMatch = str.match(regNumber)
      if (numberMatch) {
        const rawValue = parseInt(str, 10);
        return (rawValue !== null && !isNaN(rawValue)) ? { type: "NUMBER", rawValue } : null;
      } 
      const randMatch = str.match(regRand);
      if (randMatch) {
        const argument = randMatch.length >= 2 ? parseType(randMatch[1]) : null;
        return (argument !== null && isCValue(argument)) ? { type: "RAND", argument } : null;
      } else {
        return null;
      }
  }
}
