import { EquipmentStatus, Status } from "../wwa_data";
import { regNumber, regRand, regRandCapture, regUserVar, regUserVarCapture } from "./regexp";

export interface TokenValues {
  totalStatus: Status;
  bareStatus: EquipmentStatus;
  itemStatus: EquipmentStatus;
  energyMax: number;
  moveCount: number;
  playTime: number;
  userVars: number[];
}

/**
 * AT_TOTAL: 素手攻撃力 + 所持アイテム攻撃力
 * DF_TOTAL: 素手防御力 + 所持アイテム防御力
 * AT_ITEMS: 所持アイテム攻撃力の合計
 * DF_ITEMS: 所持アイテム防御力の合計
 */
export type SetMacroType = 'VARIABLE' | 'NUMBER' | 'HP' | 'HPMAX' | 'AT' | 'AT_TOTAL' | 'AT_ITEMS' | 'DF' | 'DF_TOTAL' | 'DF_ITEMS' | 'GD' | 'TIME' | 'STEP' | 'RAND';

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
    case 'RAND':
      const randMaxList = value.match(regRandCapture);
      const randMax = parseInt(randMaxList[1], 10);
      return Math.floor(Math.random() * randMax);
    default:
      return NaN;
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
