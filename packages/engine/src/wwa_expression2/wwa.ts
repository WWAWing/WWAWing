export type Calcurable = Array1D | Array2D | Literal | Symbol | UnaryOperation | BinaryOperation;

export function isCalcurable(node: WWANode): node is Calcurable {
  // ObjectExpression と ArrayExpression はピクチャ機能でしか使用しないためサポート対象外
  const supportType = ["Array1D", "Array2D", "Literal", "Symbol", "UnaryOperation", "BinaryOperation", "Random", "CallDefinedFunction", "AnyFunction", "ConditionalExpression", "ArrayExpression", "ObjectExpression"];
  return supportType.includes(node.type);
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
  value: Calcurable[];
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
  name: "ITEM" | "m" | "o" | "v" | "X" | "Y" | "ID" | "TYPE" | "PX" | "PY" | "HP" | "HPMAX" | "AT" | "AT_TOTAL" | "DF" | "DF_TOTAL" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "ITEM_ID" | "ITEM_POS" | "ENEMY_HP" | "ENEMY_AT" | "ENEMY_DF" | "ENEMY_GD" | "MOVE_SPEED" | "MOVE_FRAME_TIME";
}

export interface Array1D {
  type: "Array1D";
  name: "ITEM" | "m" | "o" | "v"; // 2次元配列の1次元分が返ってくる可能性がある
  index0: Calcurable;
}

export interface Array2D {
  type: "Array2D";
  name: "m" | "o" | "v";
  index0: Calcurable;
  index1: Calcurable;
}

export interface Array3D {
  type: "Array3D";
  name: "v";
  index0: Calcurable;
  index1: Calcurable;
  index2: Calcurable;
}

export interface Literal {
  type: "Literal";
  value: number | string;
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

// TODO: Array1DまたはArray2Dと統合が望ましい
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
  Array1D |
  Array2D |
  Array3D |
  Literal |
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
  Return |
  UpdateExpression |
  LogicalExpression |
  TemplateLiteral |
  TemplateElement |
  ConditionalExpression |
  Property |
  ObjectExpression |
  ArrayExpression;
