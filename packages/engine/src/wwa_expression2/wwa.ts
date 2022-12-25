export type Calcurable = Array1D | Array2D | Number | Symbol | UnaryOperation | BinaryOperation;
export function isCalcurable(node: Node): node is Calcurable {
  return (node.type === "Array1D" ||
   node.type === "Array2D" ||
   node.type === "Number" ||
   node.type === "Symbol" ||
   node.type === "UnaryOperation" ||
    node.type === "BinaryOperation"
  );
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
  kind: "X" | "Y" | "PX" | "PY";
  value: Calcurable;
}

export interface UnaryOperation {
  type: "UnaryOperation";
  operator: "+" | "-";
  argument: Calcurable;
}

export interface BinaryOperation {
  type: "BinaryOperation";
  operator: "+" | "-" | "*" | "/" | "%";
  left: Calcurable;
  right: Calcurable;
}

export interface Symbol {
  type: "Symbol";
  name: "ITEM" | "m" | "o" | "v" | "X" | "Y" | "PX" | "PY";
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
  Symbol;
