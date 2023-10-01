export type Calcurable = Array1D | Array2D | Number | Symbol | UnaryOperation | BinaryOperation;

export function isCalcurable(node: WWANode): node is Calcurable {
  const supportType = ["Array1D", "Array2D", "Number", "Symbol", "UnaryOperation", "BinaryOperation", "Random", "CallDefinedFunction", "AnyFunction"];
  return supportType.includes(node.type);
}

export interface PartsAssignment {
  type: "PartsAssignment"
  partsKind: "map" | "object";
  operator?: "+" | "-" | "*" | "/" | "%"; // 複合代入で使う
  destinationX: Calcurable;
  destinationY: Calcurable;
  value: Calcurable;
}

export interface ItemAssignment {
  type: "ItemAssignment";
  itemBoxPosition1to12: Calcurable;
  value: Calcurable;
}

export interface UserVariableAssignment {
  type: "UserVariableAssignment";
  index: Calcurable;
  value: Calcurable;
}

export interface SpecialParameterAssignment {
  type: "SpecialParameterAssignment";
  kind: "X" | "Y" | "PX" | "PY" | "HP" | "HPMAX" | "AT" | "DF" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "item_id" | "item_pos";
  value: Calcurable;
}

export interface UnaryOperation {
  type: "UnaryOperation";
  operator: "+" | "-";
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
  name: "ITEM" | "m" | "o" | "v" | "X" | "Y" | "PX" | "PY" | "HP" | "HPMAX" | "AT" | "AT_TOTAL" | "DF" | "DF_TOTAL" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "item_id" | "item_pos";
}

export interface Array1D {
  type: "Array1D";
  name: "ITEM" | "m" | "o" | "v"; // 2次元配列の1次元分が返ってくる可能性がある
  index0: Calcurable;
}

export interface Array2D {
  type: "Array2D";
  name: "m" | "o";
  index0: Calcurable;
  index1: Calcurable;
}

export interface Number {
  type: "Number";
  value: number;
}

export interface Random {
  type: "Random";
  value: WWANode;
}

export interface Jumpgate {
  type: "Jumpgate";
  x: WWANode;
  y: WWANode;
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

export interface AnyFunction {
  type: "AnyFunction",
  functionName: string,
  value: WWANode[]
}

export interface DefinedFunction {
  type: "DefinedFunction",
  functionName: string,
  body: WWANode
}

export interface CallDefinedFunction {
  type: "CallDefinedFunction",
  functionName: string
}

export interface Break {
  type: "Break",
  label: string
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

export type WWANode = |
  PartsAssignment |
  ItemAssignment |
  UserVariableAssignment |
  SpecialParameterAssignment |
  UnaryOperation |
  BinaryOperation |
  Array1D |
  Array2D |
  Number |
  Symbol |
  Random |
  Jumpgate |
  Msg |
  IfStatement |
  BlockStatement |
  AnyFunction |
  DefinedFunction |
  CallDefinedFunction |
  ForStatement |
  AnyFunction |
  Break |
  Continue |
  UpdateExpression;
