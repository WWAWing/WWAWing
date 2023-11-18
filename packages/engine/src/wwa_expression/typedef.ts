import type { EquipmentStatus, Status, Coord, PartsType, Direction } from "../wwa_data";

/**
 * AT_TOTAL: 素手攻撃力 + 所持アイテム攻撃力
 * DF_TOTAL: 素手防御力 + 所持アイテム防御力
 * AT_ITEMS: 所持アイテム攻撃力の合計
 * DF_ITEMS: 所持アイテム防御力の合計
 * X: メッセージを表示しているパーツの X 座標
 * Y: メッセージを表示しているパーツの Y 座標
 * PX: プレイヤー X 座標
 * PY: プレイヤー Y 座標
 * ID: メッセージを表示しているパーツ番号
 * TYPE: メッセージを表示しているパーツ種別 0=物体, 1=背景
 */
export type SetMacroType =
 'VARIABLE' |
 'MAP' |
 'OBJECT' |
 'ITEM' |
 'NUMBER' |
 'HP' |
 'HPMAX' |
 'AT' |
 'AT_TOTAL' |
 'AT_ITEMS' |
 'DF' |
 'DF_TOTAL' |
 'DF_ITEMS' |
 'GD' |
 'TIME' |
 'STEP' |
 'X' |
 'Y' |
 'PX' |
 'PY' |
 'PDIR' |
 'ID' |
 'TYPE' |
 'ITEM_COUNT_ALL' |
 'RAND' |
 'ITEM_COUNT';

export type CNumberKind = "NUMBER";

export type CVariableKind = "VARIABLE";

export type CPartsKind = "MAP" | "OBJECT";

export type CItemKind = "ITEM";

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
  "X" |
  "Y" |
  "PX" |
  "PY" |
  "PDIR" |
  "ID" |
  "TYPE" |
  "ITEM_COUNT_ALL";

export type CFunctionKind = "RAND" | "ITEM_COUNT"

export interface CNumber  {
  type: CNumberKind;
  rawValue: number
}

export interface CVariable {
  type: CVariableKind;
  index: number;
}

export interface CParts {
  type: CPartsKind;
  x: number;
  y: number;
}

export interface CItem {
  type: CItemKind;
  boxIndex1To12: number;
}

export interface CEnv {
  type: CEnvKind;
}

export interface CFunction {
  type: CFunctionKind;
  argument: CValue;
}

export type CValue = CNumber | CVariable | CParts | CItem | CEnv;
export type Comparable = CValue | CFunction;

export type ComparisionOperatorKind =  "<" | ">" | "<=" | ">=" | "==" | "!="; 
export type Descriminant = boolean | {
  left: Comparable;
  right: Comparable;
  operator: ComparisionOperatorKind;
}

export interface TokenValues {
  totalStatus: Status;
  bareStatus: EquipmentStatus;
  itemStatus: EquipmentStatus;
  energyMax: number;
  moveCount: number;
  playTime: number;
  userVars: (number | string | boolean)[];
  partsPosition: Coord;
  playerCoord: Coord;
  partsId: number;
  partsType: PartsType;
  map: number[][];
  mapObject: number[][];
  itemBox: number[];
  playerDirection: Direction;
}
