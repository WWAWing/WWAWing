import { Primitive } from "@wwawing/util";

export type Calcurable = ArrayOrObject1D | ArrayOrObject2D | ArrayOrObject3DPlus | Literal | Symbol | UnaryOperation | BinaryOperation | Random | UserDefinedFunctionCall | SystemDefinedFunctionCall | ConditionalExpression | ArrayExpression | ObjectExpression;

export type FunctionCall = UserDefinedFunctionCall | SystemDefinedFunctionCall;

export function isCalcurable(node: WWANode): node is Calcurable {
  // ObjectExpression と ArrayExpression はピクチャ機能でしか使用しないためサポート対象外
  const supportType = ["ArrayOrObject1D", "ArrayOrObject2D", "ArrayOrObject3DPlus", "Literal", "Symbol", "UnaryOperation", "BinaryOperation", "Random", "UserDefinedFunctionCall", "SystemDefinedFunctionCall", "ConditionalExpression", "ArrayExpression", "ObjectExpression"];
  return supportType.includes(node.type);
}

export function isFunctionCall(node: WWANode): node is FunctionCall {
  return node.type === "UserDefinedFunctionCall" || node.type === "SystemDefinedFunctionCall";
}

export interface PartsAssignment {
  type: "PartsAssignment"
  partsKind: "map" | "object";
  operator?: "+" | "-" | "*" | "/" | "%" | "+=" | "=" | "-=" | "*=" | "/="; // 複合代入で使う
  destinationX: Calcurable;
  destinationY: Calcurable;
  value: Calcurable;
}

export interface ItemAssignment {
  type: "ItemAssignment";
  itemBoxPosition1to12: Calcurable;
  value: Calcurable;
  operator?: "=" | "+=" | "-=" | "*=" | "/=";
}

export interface UserVariableAssignment {
  type: "UserVariableAssignment";
  index: Calcurable[];
  value: Calcurable;
  operator?: "=" | "+=" | "-=" | "*=" | "/=";
}


export interface LoopPointerAssignment {
  type: "LoopPointerAssignment";
  index: Calcurable;
  value: Calcurable;
  operator?: "=" | "+=" | "-=" | "*=" | "/=";
}

export interface SpecialParameterAssignment {
  type: "SpecialParameterAssignment";
  kind: "PX" | "PY" | "HP" | "HPMAX" | "AT" | "DF" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "ITEM_ID" | "ITEM_POS";
  value: Calcurable;
  operator?: "=" | "+=" | "-=" | "*=" | "/=";
}

export interface UnaryOperation {
  type: "UnaryOperation";
  operator: "+" | "-" | "!";
  argument: Calcurable;
}

export interface BinaryOperation {
  type: "BinaryOperation";
  operator: "+" | "-" | "*" | "/" | "%" | ">" | "<" | ">=" | "<=" | "==" | "!=";
  left: Calcurable;
  right: Calcurable;
}

export interface Symbol {
  type: "Symbol";
  name: "ITEM" | "m" | "o" | "v" | "X" | "Y" | "ID" | "TYPE" | "PX" | "PY" | "CX" | "CY" | "HP" | "HPMAX" | "AT" | "AT_TOTAL" | "DF" | "DF_TOTAL" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "ITEM_ID" | "ITEM_POS" | "ENEMY_HP" | "ENEMY_AT" | "ENEMY_DF" | "ENEMY_GD" | "PICTURE" | "PLAYER_PX" | "PLAYER_PY" | "MOVE_SPEED" | "MOVE_FRAME_TIME" | "LP" | "SORT_A" | "SORT_B" | "undefined";
}

export interface ArrayOrObject1D {
  type: "ArrayOrObject1D";
  name: "ITEM" | "m" | "o" | "v" | "PICTURE" | "LP" | "SORT_A" | "SORT_B"; // 2次元配列の1次元分が返ってくる可能性がある
  indecies: Calcurable[];
}

export interface ArrayOrObject2D {
  type: "ArrayOrObject2D";
  name: "m" | "o" | "v" | "SORT_A" | "SORT_B";
  indecies: Calcurable[];
}

// 3次元以上の配列
export interface ArrayOrObject3DPlus {
  type: "ArrayOrObject3DPlus";
  name: "v" | "SORT_A" | "SORT_B";
  indecies: Calcurable[];
}

export interface Literal {
  type: "Literal";
  value: Primitive;
}

export interface Random {
  type: "Random";
  value: WWANode;
}

export interface Jumpgate {
  type: "Jumpgate";
  x: WWANode;
  y: WWANode;
  direction?: WWANode;
}

export interface Msg {
  type: "Msg";
  value: WWANode
}

export interface IfStatement {
  type: "IfStatement",
  consequent: WWANode,
  test: WWANode,
  alternate?: WWANode
}

export interface BlockStatement {
  type: "BlockStatement",
  value: WWANode[]
}

export interface ForStatement {
  type: "ForStatement";
  body: WWANode[];
  init: WWANode;
  test: WWANode;
  update: WWANode;
}

export interface UserDefinedFunction {
  type: "UserDefinedFunction",
  functionName: string,
  body: WWANode
}

export interface SystemDefinedFunctionCall {
  type: "SystemDefinedFunctionCall",
  functionName: string,
  value: WWANode[],
  // foo().bar.baz ... のような場合に使う
  indecies?: WWANode[]
}

export interface UserDefinedFunctionCall {
  type: "UserDefinedFunctionCall",
  functionName: string
  // foo().bar.baz ... のような場合に使う
  indecies?: WWANode[]
  // 現在のところ、ユーザー定義関数には引数を定義できません（スコープの取り扱いが必要なので）
}

export interface Break {
  type: "Break",
  label: string
}

export interface Return {
  type: "Return",
  argument: WWANode
}

export interface Continue {
  type: "Continue",
  label: string
}

export interface UpdateExpression {
  type: "UpdateExpression",
  operator: string,
  argument: WWANode
}

export interface LogicalExpression {
  type: "LogicalExpression",
  operator: string,
  left: WWANode,
  right: WWANode
}

export interface TemplateLiteral {
  type: "TemplateLiteral",
  expressions: WWANode[],
  quasis: WWANode[]
}

export interface TemplateElement {
  type: "TemplateElement",
  value: {
    cooked: string,
    raw: string
  }
}

export interface ConditionalExpression {
  type: "ConditionalExpression",
  consequent: WWANode,
  test: WWANode,
  alternate: WWANode
}

export interface Property {
  type: "Property",
  key: Literal,
  value: WWANode,
  // TODO 他にもありそう
}

export interface ObjectExpression {
  type: "ObjectExpression",
  properties: Property[],
}

export interface ArrayExpression {
  type: "ArrayExpression",
  elements: WWANode[]
}

export type WWANode = |
  PartsAssignment |
  ItemAssignment |
  UserVariableAssignment |
  SpecialParameterAssignment |
  UnaryOperation |
  BinaryOperation |
  ArrayOrObject1D |
  ArrayOrObject2D |
  ArrayOrObject3DPlus |
  Literal |
  Symbol |
  Random |
  Msg |
  IfStatement |
  BlockStatement |
  UserDefinedFunction |
  SystemDefinedFunctionCall |
  UserDefinedFunctionCall |
  ForStatement |
  Break |
  Continue |
  Return |
  UpdateExpression |
  LogicalExpression |
  TemplateLiteral |
  TemplateElement |
  ConditionalExpression |
  Property |
  ObjectExpression |
  ArrayExpression |
  LoopPointerAssignment;
