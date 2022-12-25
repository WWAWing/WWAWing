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
