import { parse, type Node } from "acorn";
export { parse, Node };

export interface Program extends Node {
  type: "Program";
  body: Node[];
}

export interface ExpressionStatement extends Node {
  type: "ExpressionStatement";
  expression: Node
}

export interface AssignmentExpression extends Node {
  type: "AssignmentExpression";
  operator: string; // =
  left: Node;
  right: Node;
}

export interface MemberExpression extends Node {
  type: "MemberExpression";
  object: Node;
  property: Node;
}

export interface UnaryExpression extends Node {
  type: "UnaryExpression";
  operator: string; // + -
  argument: Node;
}

export interface BinaryExpression extends Node {
  type: "BinaryExpression";
  operator: string; // + - * / %
  left: Node;
  right: Node
}

export interface Identifier extends Node {
  type: "Identifier",
  name: string;
}

export interface Literal extends Node {
  type: "Literal",
  value: number;
}

export interface CallExpression extends Node {
  type: "CallExpression",
  arguments: Literal[],
  callee: Identifier
}

export interface IfStatement extends Node {
  type: "IfStatement",
  consequent: Node,
  test: Node,
  alternate?: IfStatement
}

export interface BlockStatement extends Node {
  type: "BlockStatement",
  body: Node[]
}

export interface ForStatement extends Node {
  type: "ForStatement";
  body: BlockStatement;
  init: Node;
  test: Node;
  update: Node;
}

export interface UpdateExpression extends Node {
  type: "UpdateExpression"
}

export interface BreakStatement extends Node {
  label: string;
  type: "BreakExpression"
}
