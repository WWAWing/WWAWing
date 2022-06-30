import { Status } from "../wwa_data";

export interface TokenValues {
  status: Status;
  energyMax: number;
  moveCount: number;
  playTime: number;
  userVars: number[];
}

export type SetMacroType = 'VARIABLE' | 'NUMBER' | 'HP' | 'HPMAX' | 'AT' | 'DF' | 'GD' | 'TIME' | 'STEP' | 'RAND';

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
      return leftValue / rightValue;
    case '%':
    case '%=':
      return leftValue % rightValue;
    default:
      throw new Error("未定義の演算子です");
  }
}

export function parseType(str: string): SetMacroType | null {
  switch (str) {
    case "HP":
    case "HPMAX":
    case "AT":
    case "DF":
    case "GD":
    case "STEP":
    case "TIME":
      return str;
    default:
      if (/v\[(\d+)\]/.test(str)) {
        return 'VARIABLE';
      } else if (/^\d+$/.test(str)) {
        return 'NUMBER';
      } else if (/^RAND\(\d+\)$/.test(str)) {
        return 'RAND';
      } else {
        return null;
      }
  }
}

/**
 * 変数か定数かを判断し、該当する値を返す
 * @param value 変数か定数を表す文字列 0, 10, v[100] など
 */
export function parseValue(value: string, tokenValues: TokenValues): number {
  switch (parseType(value)) {
    case 'HP':
      return tokenValues.status.energy;
    case 'HPMAX':
      return tokenValues.energyMax;
    case 'AT':
      return tokenValues.status.strength;
    case 'DF':
      return tokenValues.status.defence;
    case 'GD':
      return tokenValues.status.gold;
    case 'STEP':
      return tokenValues.moveCount;
    case 'VARIABLE':
      return parseVariable(value, tokenValues);
    case 'NUMBER':
      return parseNumber(value);
    case 'TIME':
      return tokenValues.playTime;
    case 'RAND':
      const randMaxList = value.match(/^RAND\((\d+)\)$/);
      const randMax = parseInt(randMaxList[1], 10);
      return Math.floor(Math.random() * randMax);
    default:
      return NaN;
  }
}

export function parseVariable(value: string, tokenValues: TokenValues): number {
  const variable = value.match(/^v\[(\d+)\]$/);
  if (variable === null) {
    throw new Error("変数のフォーマットではありません。");
  }
  const index = parseInt(variable[1], 10);
  return tokenValues.userVars[index];
}

export function parseNumber(value: string): number {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new Error(`数値として解釈できません: ${value}`);
  }
  return parsedValue;
}
