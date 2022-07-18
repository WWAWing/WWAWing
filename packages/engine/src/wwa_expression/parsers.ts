import { EquipmentStatus, Status, Coord } from "../wwa_data";
import { regNumber, regRand, regRandCapture, regUserVar, regUserVarCapture } from "./regexp";

export interface TokenValues {
  totalStatus: Status;
  bareStatus: EquipmentStatus;
  itemStatus: EquipmentStatus;
  energyMax: number;
  moveCount: number;
  playTime: number;
  userVars: number[];
  playerCoord: Coord;
}

/**
 * AT_TOTAL: 素手攻撃力 + 所持アイテム攻撃力
 * DF_TOTAL: 素手防御力 + 所持アイテム防御力
 * AT_ITEMS: 所持アイテム攻撃力の合計
 * DF_ITEMS: 所持アイテム防御力の合計
 */
export type SetMacroType = 'VARIABLE' | 'NUMBER' | 'HP' | 'HPMAX' | 'AT' | 'AT_TOTAL' | 'AT_ITEMS' | 'DF' | 'DF_TOTAL' | 'DF_ITEMS' | 'GD' | 'TIME' | 'STEP' | 'PX' | 'PY' |'RAND';

export type CNumberKind = "NUMBER";

export type CVariableKind = "VARIABLE";

export type CEnvKind =
  "HP" |
  "HPMAX" |
  "AT" |
  "AT_TOTAL" |
  "AT_ITEMS" |
  "DF" |
  "DF_TOTAL" |
  "DF_ITEMS" |
  "GD" |
  "STEP" |
  "TIME" |
  "PX" |
  "PY";

export type CFunctionKind = "RAND"

export interface CNumber  {
  type: CNumberKind;
  rawValue: number
}

export interface CVariable {
  type: CVariableKind;
  index: number;
}

export interface CEnv {
  type: CEnvKind;
}

export interface CFunction {
  type: CFunctionKind;
  argument: CValue;
}

export type CValue = CNumber | CVariable | CEnv;
export type Comparable = CValue | CFunction;

export function isCValue(c: Comparable): c is CValue {
  return c.type !== "RAND";
}

export type ComparisionOperatorKind =  "<" | ">" | "<=" | ">=" | "==" | "!="; 
export type Descriminant = boolean | {
  left: Comparable;
  right: Comparable;
  operator: ComparisionOperatorKind;
}


export function parseType(str: string): SetMacroType | null {
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
      return str;
    default:
      if (regUserVar.test(str)) {
        return 'VARIABLE';
      } else if (regNumber.test(str)) {
        return 'NUMBER';
      } else if (regRand.test(str)) {
        return 'RAND';
      } else {
        return null;
      }
  }
}

export function parseType2(str: string): Comparable | null {
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
      const userVarMatch = str.match(regUserVarCapture);
      if (userVarMatch) {
        const index = userVarMatch.length >= 2 ? parseInt(userVarMatch[1], 10) : null;
        return (index !== null && !isNaN(index)) ? { type: "VARIABLE", index } : null;
      } 
      const numberMatch = str.match(regNumber)
      if (numberMatch) {
        const rawValue = parseInt(str, 10);
        return (rawValue !== null && !isNaN(rawValue)) ? { type: "NUMBER", rawValue } : null;
      } 
      const randMatch = str.match(regRandCapture);
      if (randMatch) {
        const argument = randMatch.length >= 2 ? parseType2(randMatch[1]) : null;
        return (argument !== null && isCValue(argument)) ? { type: "RAND", argument } : null;
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
      return parseVariable(value, tokenValues);
    case 'NUMBER':
      return parseNumber(value);
    case 'TIME':
      return tokenValues.playTime;
    case 'PX':
      return tokenValues.playerCoord.x;
    case 'PY':
      return tokenValues.playerCoord.y;
    case 'RAND':
      const randMaxList = value.match(regRandCapture);
      const target = randMaxList[1];
      const randMax = parseValue(target, tokenValues);
      return Math.floor(Math.random() * randMax);
    default:
      // 未定義は 0 とする
      return 0;
  }
}

/**
 * 変数か定数かを判断し、該当する値を返す
 * @param value 変数か定数を表す文字列 0, 10, v[100] など
 */
export function parseValue2(comparable: Comparable, tokenValues: TokenValues): number {
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
      return Math.floor(Math.random() * parseValue2(comparable.argument, tokenValues));
    default:
      // 未定義は 0 とする
      return 0;
  }
}

export function parseVariable(value: string, tokenValues: TokenValues): number {
  const variable = value.match(regUserVarCapture);
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
