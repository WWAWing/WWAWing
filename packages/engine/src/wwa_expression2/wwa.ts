export type Calcurable = ArrayOrObject1D | ArrayOrObject2D | ArrayOrObject3DPlus | Literal | Symbol | UnaryOperation | BinaryOperation | Random | CallDefinedFunction | AnyFunction | ConditionalExpression | ArrayExpression | ObjectExpression;

export function isCalcurable(node: WWANode): node is Calcurable {
  // ObjectExpression と ArrayExpression はピクチャ機能でしか使用しないためサポート対象外
  const supportType = ["ArrayOrObject1D", "ArrayOrObject2D", "ArrayOrObject3DPlus", "Literal", "Symbol", "UnaryOperation", "BinaryOperation", "Random", "CallDefinedFunction", "AnyFunction", "ConditionalExpression", "ArrayExpression", "ObjectExpression"];
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
  kind: "PX" | "PY" | "HP" | "HPMAX" | "AT" | "DF" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "ITEM_ID" | "ITEM_POS" | "SOUND_ID" ;
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
  name: "ITEM" | "m" | "o" | "v" | "X" | "Y" | "ID" | "TYPE" | "PX" | "PY" | "CX" | "CY" | "HP" | "HPMAX" | "AT" | "AT_TOTAL" | "DF" | "DF_TOTAL" | "GD" | "STEP" | "TIME" | "PDIR" | "i" | "j" | "k" | "LOOPLIMIT" | "ITEM_ID" | "ITEM_POS" | "SOUND_ID" | "ENEMY_HP" | "ENEMY_AT" | "ENEMY_DF" | "ENEMY_GD" | "PICTURE" | "PLAYER_PX" | "PLAYER_PY" | "MOVE_SPEED" | "MOVE_FRAME_TIME" | "LP";
}

export interface ArrayOrObject1D {
  type: "ArrayOrObject1D";
  name: "ITEM" | "m" | "o" | "v" | "PICTURE" | "LP"; // 2次元配列の1次元分が返ってくる可能性がある
  indecies: Calcurable[];
}

export interface ArrayOrObject2D {
  type: "ArrayOrObject2D";
  name: "m" | "o" | "v";
  indecies: Calcurable[];
}

// 3次元以上の配列
export interface ArrayOrObject3DPlus {
  type: "ArrayOrObject3DPlus";
  name: "v";
  indecies: Calcurable[];
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
  ArrayExpression |
  LoopPointerAssignment;
