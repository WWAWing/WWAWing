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

export interface FunctionDeclaration extends Node {
  type: "FunctionDeclaration",
  body: BlockStatement,
  id: Identifier
}

export interface ForStatement extends Node {
  type: "ForStatement";
  body: BlockStatement;
  init: Node;
  test: Node;
  update: Node;
}

export interface UpdateExpression extends Node {
  type: "UpdateExpression",
  operator: string,
  argument: Node
}

export interface LogicalExpression extends Node {
  type: "LogicalExpression",
  operator: string,
  left: Node,
  right: Node
}

export interface BreakStatement extends Node {
  label: string;
  type: "BreakExpression"
}

export interface ReturnStatement extends Node {
  type: "ReturnStatement";
  argument?: Node;
}

export interface ContinueStatement extends Node {
  label: string;
  type: "ContinueExpression"
}

export interface TemplateLiteral extends Node {
  label: string;
  type: "TemplateLiteral";
  expressions: Node[];
  quasis: Node[];
}

export interface TemplateElement extends Node {
  label: string;
  type: "TemplateElement";
  value: {
    cooked: string,
    raw: string
  }
}

export interface ConditionalExpression extends Node {
  label: string;
  type: "ConditionalExpression";
  test: Node;
  consequent: Node;
  alternate: Node;
}

export interface Property extends Node {
  label: string;
  type: "Property";
  key: Identifier | Literal;
  value: Node;
}

export interface ObjectExpression extends Node {
  label: string;
  type: "ObjectExpression";
  properties: Property[]
}

export interface ArrayExpression extends Node {
  label: string;
  type: "ArrayExpression";
  elements: Node[]
}
