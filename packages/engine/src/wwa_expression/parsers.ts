import { regItemByBoxId, regMapByCoord, regNumber, regObjectByCoord, regRand, regUserVar } from "./regexp";
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
    case "X":
    case "Y":
    case "PX":
    case "PY":
    case "PDIR":
    case "ID":
    case "TYPE":
      return { type: str };
    default:
      const userVarMatch = str.match(regUserVar);
      if (userVarMatch) {
        const index = parseArg1Value(userVarMatch)
        return index === null ? null : { type: "VARIABLE", index };
      }
      const mapMatch = str.match(regMapByCoord);
      if(mapMatch) {
        const coord = parseArg2Values(mapMatch);
        return coord === null ? null : { type: "MAP", x: coord[0], y: coord[1] };
      }
      const objectMatch = str.match(regObjectByCoord);
      if (objectMatch) {
        const coord = parseArg2Values(objectMatch);
        return coord === null ? null : { type: "OBJECT", x: coord[0], y: coord[1] };
      }
      const itemMatch = str.match(regItemByBoxId);
      if (itemMatch) {
        const index = parseArg1Value(itemMatch)
        return index === null ? null : { type: "ITEM", boxIndex1To12: index };
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

function parseArg1Value(regExpMatchArray: RegExpMatchArray): number | null {
    const arg = regExpMatchArray.length >= 2 ? parseInt(regExpMatchArray[1], 10) : null;
    return (arg !== null && !isNaN(arg)) ? arg : null;
}

function parseArg2Values(regExpMatchArray: RegExpMatchArray): [number, number] | null {
    if(regExpMatchArray.length < 3) {
      return null;
    }
    const arg1 =  parseInt(regExpMatchArray[1], 10) ;
    const arg2 =  parseInt(regExpMatchArray[2], 10) ;
    if(isNaN(arg1) || isNaN(arg2)) {
      return null;
    }
    return [arg1, arg2];
}
