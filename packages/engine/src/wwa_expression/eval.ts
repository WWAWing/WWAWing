import { assertNumber } from "../wwa_util";
import type { Descriminant, TokenValues, Comparable } from "./typedef";

export function evaluateDescriminant(d: Descriminant, tokenValues: TokenValues, fallbackValue: number = 0): boolean {
    if (typeof d === "boolean") {
        return d;
    }
    const left = evaluateValue(d.left, tokenValues, fallbackValue);
    const right = evaluateValue(d.right, tokenValues, fallbackValue);
    return compare(d.operator, left, right);
}

export function evaluateValue(comparable: Comparable, tokenValues: TokenValues, fallbackValue: number = 0): number {
  switch (comparable.type) {
    case 'HP':
      return tokenValues.totalStatus.energy;
    case 'HPMAX':
      return tokenValues.energyMax;
    case 'AT':
      return tokenValues.bareStatus.strength;
    case 'AT_TOTAL':
      return tokenValues.totalStatus.strength;
    case 'AT_ITEMS':
      return tokenValues.itemStatus.strength;
    case 'DF':
      return tokenValues.bareStatus.defence;
    case 'DF_TOTAL':
      return tokenValues.totalStatus.defence;
    case 'DF_ITEMS':
      return tokenValues.itemStatus.defence;
    case 'GD':
      return tokenValues.totalStatus.gold;
    case 'STEP':
      return tokenValues.moveCount;
    case 'VARIABLE': {
      const v = tokenValues.userVars[comparable.index];
      // 旧 wwa_expression は廃止予定コードなので、 string | boolean 型には対応しません。予めご了承ください。
      // $if が wwa_expression2 に移行したらコードごと消えます。
      if (!assertNumber(v, `v${comparable.index}`)) {
        return 0;
      }
      return v;
    }
    case 'MAP': 
      if (
        comparable.y < 0 ||
        comparable.y >= tokenValues.map.length ||
        comparable.x < 0 ||
        comparable.x >= tokenValues.map[comparable.y].length
      ) {
        return 0;
      }
      return tokenValues.map[comparable.y][comparable.x];
    case 'OBJECT':
      if (
        comparable.y < 0 ||
        comparable.y >= tokenValues.mapObject.length ||
        comparable.x < 0 ||
        comparable.x >= tokenValues.mapObject[comparable.y].length
      ) {
        return 0;
      }
      return tokenValues.mapObject[comparable.y][comparable.x];
    case 'ITEM':
      if (comparable.boxIndex1To12 < 1 || comparable.boxIndex1To12 > 12) {
        return 0;
      }
      return tokenValues.itemBox[comparable.boxIndex1To12 - 1];
    case 'ITEM_COUNT_ALL':
      return tokenValues.itemBox.filter(item => item !== 0).length;
    case 'NUMBER':
      return comparable.rawValue;
    case 'TIME':
      return tokenValues.playTime;
    case 'X':
      return tokenValues.partsPosition.x ?? tokenValues.playerCoord.x;
    case 'Y':
      return tokenValues.partsPosition.y ?? tokenValues.playerCoord.y;
    case 'PX':
      return tokenValues.playerCoord.x;
    case 'PY':
      return tokenValues.playerCoord.y;
    case 'PDIR':
      return tokenValues.playerDirection;
    case 'ID':
      return tokenValues.partsId ?? -1;
    case 'TYPE':
      return tokenValues.partsType ?? -1;
    case 'RAND':
      return Math.floor(Math.random() * evaluateValue(comparable.argument, tokenValues));
    case 'ITEM_COUNT':
      return tokenValues.itemBox.filter(item => item === evaluateValue(comparable.argument, tokenValues)).length;
    default:
      return fallbackValue;
  }
}


export function calc(operator: string, leftValue: number, rightValue: number) {
  switch (operator) {
    case "=":
      return rightValue;
    case '+':
    case '+=':
      return leftValue + rightValue;
    case '-':
    case '-=':
      return leftValue - rightValue;
    case '*':
    case '*=':
      return leftValue * rightValue;
    case '/':
    case '/=':
      return rightValue === 0 ? 0 : (leftValue / rightValue);
    case '%':
    case '%=':
      return rightValue === 0 ? 0 : (leftValue % rightValue);
    default:
      throw new Error("未定義の演算子です");
  }
}

export function compare(operator: string, leftValue: number, rightValue: number) {
  switch (operator) {
    case '>':
      return leftValue > rightValue;
    case '<':
      return leftValue < rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<=':
      return leftValue <= rightValue;
    case '==':
      return leftValue === rightValue;
    case '!=':
      return leftValue !== rightValue;
    default:
      return false;
  }
}
