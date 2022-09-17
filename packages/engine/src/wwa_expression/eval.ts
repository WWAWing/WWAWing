import type { Descriminant, TokenValues, Comparable } from "./typedef";

export function evaluateDescriminant(d: Descriminant, tokenValues: TokenValues): boolean {
    if (typeof d === "boolean") {
        return d;
    }
    const left = evaluateValue(d.left, tokenValues);
    const right = evaluateValue(d.right, tokenValues);
    return compare(d.operator, left, right);
}

export function evaluateValue(comparable: Comparable, tokenValues: TokenValues): number {
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
    case 'VARIABLE':
      return tokenValues.userVars[comparable.index];
    case 'NUMBER':
      return comparable.rawValue;
    case 'TIME':
      return tokenValues.playTime;
    case 'PX':
      return tokenValues.playerCoord.x;
    case 'PY':
      return tokenValues.playerCoord.y;
    case 'RAND':
      return Math.floor(Math.random() * evaluateValue(comparable.argument, tokenValues));
    default:
      // 未定義は 0 とする
      return 0;
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
