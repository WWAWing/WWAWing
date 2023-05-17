export type Calcurable = Array1D | Array2D | Number | Symbol | UnaryOperation | BinaryOperation;

export function isCalcurable(node: Node): node is Calcurable {
  const supportType = ["Array1D", "Array2D", "Number", "Symbol", "UnaryOperation", "BinaryOperation", "Random"];
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
  kind: "X" | "Y" | "PX" | "PY" | "HP" | "HPMAX" | "AT" | "DF" | "GD" | "STEP" | "TIME" | "PRID" | "i" | "j" | "k";
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
  name: "ITEM" | "m" | "o" | "v" | "X" | "Y" | "PX" | "PY" | "HP" | "HPMAX" | "AT" | "DF" | "GD" | "STEP" | "TIME" | "PRID" | "i" | "j" | "k";
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
  value: Node;
}

export interface Jumpgate {
  type: "Jumpgate";
  x: Node;
  y: Node;
}

export interface Msg {
  type: "Msg";
  value: Node
}

export interface IfStatement {
  type: "IfStatement",
  consequent: Node,
  test: Node,
  alternate?: Node
}

export interface BlockStatement {
  type: "BlockStatement",
  value: Node[]
}

export interface ForStatement {
  type: "ForStatement";
  body: Node[];
  init: Node;
  test: Node;
  update: Node;
}

export interface AnyFunction {
  type: "AnyFunction",
  functionName: string,
  value: Node[]
}

export interface Break {
  type: "Break",
  label: string
}

export interface Continue {
  type: "Continue",
  label: string
}

export type Node = |
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
  ForStatement |
  AnyFunction |
  Break |
  Continue;
