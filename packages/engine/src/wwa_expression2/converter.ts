import * as Acorn from "./acorn";
import * as Wwa from "./wwa";

export function convertNodeAcornToWwa(node: Acorn.Node): Wwa.Node {
    switch(node.type) {
      case "Program":
        return convertProgram(node as Acorn.Program);
      case "ExpressionStatement":
        return convertExpressionStatement(node as Acorn.ExpressionStatement);
      case "AssignmentExpression":
        return convertAssignmentExpression(node as Acorn.AssignmentExpression);
      case "MemberExpression":
        return convertMemberExpression(node as Acorn.MemberExpression);
      case "UnaryExpression":
        return convertUnaryExpression(node as Acorn.UnaryExpression);
      case "BinaryExpression":
        return convertBinaryExpression(node as Acorn.BinaryExpression);
      case "Identifier":
        return convertIdentifer(node as Acorn.Identifier);
      case "Literal":
        return convertLiteral(node as Acorn.Literal);
      default:
        throw new Error("未定義の AST ノードです :" + node.type);
    }
}

function convertProgram(node: Acorn.Program): Wwa.Node {
  if (node.body.length !== 1) {
    throw new Error("bodyが1以外の場合評価できません。")
  }
  return convertNodeAcornToWwa(node.body[0]);
}

function convertExpressionStatement(node: Acorn.ExpressionStatement): Wwa.Node {
  return convertNodeAcornToWwa(node.expression);
}

function convertAssignmentExpression(node: Acorn.AssignmentExpression): Wwa.Node {
  const left = convertNodeAcornToWwa(node.left);
  const right = convertNodeAcornToWwa(node.right);
  if (!Wwa.isCalcurable(right)) {
    throw new Error("値以外を代入式の右辺に設定できません");
  }
  switch(node.operator) {
    case "=":
      if (left.type === "Array2D") {
        if (left.name === "m" || left.name === "o") {
          return {
            type: "PartsAssignment",
            partsKind: left.name === "m" ? "map" : "object",
            destinationX: left.index0,
            destinationY: left.index1,
            value: right
          }
        } else {
          throw new Error("想定していない記号が2次元配列ででてきました");
        }
      } else if (left.type === "Array1D") {
        if (left.name === "ITEM") {
          return {
            type: "ItemAssignment",
            itemBoxPosition1to12: left.index0,
            value: right
          }
        } else if (left.name === "v") {
          return {
            type: "UserVariableAssignment",
            index: left.index0,
            value: right
          }
        } else {
          throw new Error("");
        }
      } else if (left.type === "Symbol") {
        if (left.name === "m" || left.name === "o" || left.name === "v" || left.name === "ITEM") {
          throw new Error("このシンボルには代入できません");
        }
        return {
          type: "SpecialParameterAssignment",
          kind: left.name,
          value: right
        }
      } else if (left.type === "Number") {
        throw new Error("数値には代入できません");
      } else {
        throw new Error("代入できません");
      }
  }
}

function convertUnaryExpression(node: Acorn.UnaryExpression): Wwa.UnaryOperation {
  const argument = convertNodeAcornToWwa(node.argument);
  if(node.operator !== "+" && node.operator !== "-") {
    throw new Error("未定義の演算子です");
  }
  if(!Wwa.isCalcurable(argument)) {
    throw new Error("単項演算子が適用できません");
  }
  return {
    type: "UnaryOperation",
    operator: node.operator,
    argument
  }
}

function convertBinaryExpression(node: Acorn.BinaryExpression): Wwa.Node {
  const left = convertNodeAcornToWwa(node.left);
  const right = convertNodeAcornToWwa(node.right);
  if (!Wwa.isCalcurable(left) || !Wwa.isCalcurable(right)) {
    throw new Error("左辺または右辺が評価不能です");
  }
  switch(node.operator) {
    case "+":
    case "-":
    case "*":
    case "/":
    case "%":
      return {
        type: "BinaryOperation",
        operator: node.operator,
        left,
        right
      }
    default:
      throw new Error("未定義の演算子です");
  }
}

// WWA においては hoge.a というパターンはないので、配列系の処理しかない
function convertMemberExpression(node: Acorn.MemberExpression): Wwa.Array1D | Wwa.Array2D {
  const object = convertNodeAcornToWwa(node.object);
  const property = convertNodeAcornToWwa(node.property);

  if (object.type === "Symbol") {
    if (object.name !== "v" && object.name !== "m" && object.name !== "o" && object.name !== "ITEM") {
      throw new Error("このシンボルは配列にできません");
    }
    if(property.type === "Number" || property.type === "Symbol") {
      // m, o については一次元分適用
      return {
        type: "Array1D",
        name: object.name,
        index0: property
      }
    } else {
      // 数値に解決できないものが index に来てはいけない
      throw new Error("WWAでは存在しない構文です")
    }
  } else if (object.type === "Array1D") {
    // 1次元にしかできないものは排除
    if (object.name === "ITEM" || object.name === "v") {
      throw new Error("この配列は2次元以上にはできません。");
    }
    // 1次元配列 + 1次元分の index を合成
    if (property.type === "Number") {
      return {
        type: "Array2D",
        name: object.name,
        index0: object.index0,
        index1: property
      }
    } else {
      // 数値に解決できないものが index に来てはいけない
      throw new Error("WWAでは存在しない構文です")
    }
  }
}

function convertIdentifer(node: Acorn.Identifier): Wwa.Symbol | Wwa.Number {
  switch(node.name) {
    case "m":
    case "o":
    case "ITEM":
    case "X":
    case "Y":
    case "PX":
    case "PY":
      return {
        type: "Symbol",
        name: node.name
      }
    default:
      throw new Error("未定義のシンボルです");
  }
}

function convertLiteral(node: Acorn.Literal): Wwa.Number {
  // UNDONE: 小数点以下の処理をする
  // UNDONE: boolean 値の取り扱いをする. 多分 Wwa.Boolean を作ることになる.
  // typeof node.value が number でも boolean でもないならエラーにする. (nullやらundefinedやら書かれると困る)
  return {
    type: "Number",
    value: node.value
  }
}
