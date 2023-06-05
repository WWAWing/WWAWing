import * as Acorn from "./acorn";
import * as Wwa from "./wwa";

export function convertNodeAcornToWwaArray(node: Acorn.Node): Wwa.WWANode[] {
  if(node.type === "Program") {
    const arrayNode: Acorn.Program = <Acorn.Program>node;
    return arrayNode.body.map((oneNode) => {
      return convertNodeAcornToWwa(oneNode)
    })
  }
  return [convertNodeAcornToWwa(node)];
}

export function convertNodeAcornToWwa(node: Acorn.Node): Wwa.WWANode {
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
      case "CallExpression":
        return convertCallExpression(node as Acorn.CallExpression);
      case "IfStatement":
        return convertIfStatement(node as Acorn.IfStatement);
      case "BlockStatement":
        return convertBlockStatement(node as Acorn.BlockStatement);
      case "FunctionDeclaration":
        return convertFunctionStatement(node as Acorn.FunctionDeclaration);
      case "ForStatement":
        return convertForStatement(node as Acorn.ForStatement);
      case "BreakStatement":
        return convertBreakStatement(node as Acorn.BreakStatement);
      case "ContinueStatement":
        return convertContinueStatment(node as Acorn.ContinueStatement);
      case "UpdateExpression":
        return convertUpdateExpression(node as Acorn.UpdateExpression);
      default:
        console.log(node);
        throw new Error("未定義の AST ノードです :" + node.type);
    }
}

function convertFunctionStatement(node: Acorn.FunctionDeclaration): Wwa.WWANode {
  return {
    type: "DefinedFunction",
    functionName: node.id.name,
    body: convertNodeAcornToWwa(node.body)
  }
}

function convertUpdateExpression(node: Acorn.UpdateExpression): Wwa.WWANode {
  return {
    type: "UpdateExpression",
    operator: node.operator,
    argument: convertNodeAcornToWwa(node.argument)
  }
}

function convertContinueStatment(node: Acorn.ContinueStatement): Wwa.WWANode {
  return {
    type: "Continue",
    label: node.label
  }
}

function convertBreakStatement(node: Acorn.BreakStatement): Wwa.WWANode {
  return {
    type: "Break",
    label: node.label
  }
}

function convertForStatement(node: Acorn.ForStatement): Wwa.WWANode {
  const body = node.body.body.map((body) => {
    return convertNodeAcornToWwa(body);
  })
  return {
    type: "ForStatement",
    body: body,
    init: convertNodeAcornToWwa(node.init),
    test: convertNodeAcornToWwa(node.test),
    update: convertNodeAcornToWwa(node.update),
  }
}

function convertBlockStatement(node: Acorn.BlockStatement): Wwa.WWANode {
  return {
    type: "BlockStatement",
    value: node.body.map((body) => {
      return convertNodeAcornToWwa(body);
    })
  }
}

function convertIfStatement(node: Acorn.IfStatement): Wwa.WWANode {
  const consequent = convertNodeAcornToWwa(node.consequent);
  const test = convertNodeAcornToWwa(node.test);
  return {
    type: "IfStatement",
    consequent: consequent,
    test: test,
    alternate: node.alternate? convertNodeAcornToWwa(node.alternate): undefined
  };
}

/**
 * RANDなど特殊関数を判別して実行する
 * @param node 
 * @returns 
 */
function convertCallExpression(node: Acorn.CallExpression): Wwa.WWANode  {
  const functionName = node.callee.name;
  switch(functionName) {
    case "RAND":
      return execRandomFunction(node.arguments);
    case "JUMPGATE":
      return execJumpgateFunction(node.arguments);
    case "MSG":
    case "MESSAGE":
      return execMessageFunction(node.arguments);
    case "SOUND":
    case "SAVE":
    case "LOG":
    case "ABLE_CHANGE_SPEED":
    case "SET_SPEED":
    case "CHANGE_GAMEOVER_POS":
    case "DEL_PLAYER":
    case "RESTART_GAME":
    case "URL_JUMPGATE":
    case "HIDE_STATUS":
    case "PARTS":
    case "EFFECT":
    case "CHANGE_PLAYER_IMAGE":
    case "HAS_ITEM":
    case "GET_ITEM_NO":
      return execAnyFunction(node.arguments, functionName);
    default:
      return {
        type: "CallDefinedFunction",
        functionName: functionName
      }
  }
}

/**
 * 任意の関数型
 * @param callee 
 * @returns 
 */
function execAnyFunction(callee: Acorn.Literal[], functionName: string): Wwa.WWANode {
  return {
    type: "AnyFunction",
    functionName: functionName,
    value: callee.map((v) => {
      return convertNodeAcornToWwa(v)
    })
  }
}

/**
 * Message関数を実行する
 * @param callee 
 * @returns 
 */
function execMessageFunction(callee: Acorn.Literal[]): Wwa.WWANode {
  return {
    type: "Msg",
    value: convertNodeAcornToWwa(callee[0])
  }
}

/**
 * JUMPGATE関数を実行する
 * JUMPGATEを実行するための識別子を返す
 */
function execJumpgateFunction(callee: Acorn.Literal[]): Wwa.WWANode {
  if(callee.length < 2) {
    throw new Error("RAND関数には引数が2つ必要です。")
  }
  const pos = {
    x: callee[0],
    y: callee[1]
  }
  return {
    type: "Jumpgate",
    x: convertNodeAcornToWwa(pos.x),
    y: convertNodeAcornToWwa(pos.y)
  }
}

/**
 * RAND関数を実行する
 * @param callee 
 * @returns 
 */
function execRandomFunction(callee: Acorn.Literal[]): Wwa.WWANode {
  if(callee.length < 1) {
    throw new Error("RAND関数には引数が必要です。")
  }
  // TODO: 後でAcorn.LiteralからAcorn.Nodeに変換させるようにする
  return {
    type: "Random",
    value: convertNodeAcornToWwa(callee[0])
  }
}

function convertProgram(node: Acorn.Program): Wwa.WWANode {
  if (node.body.length !== 1) {
    throw new Error("bodyが1以外の場合評価できません。")
  }
  return convertNodeAcornToWwa(node.body[0]);
}

function convertExpressionStatement(node: Acorn.ExpressionStatement): Wwa.WWANode {
  return convertNodeAcornToWwa(node.expression);
}

function convertAssignmentExpression(node: Acorn.AssignmentExpression): Wwa.WWANode {
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
    throw new Error("未定義の演算子です :"+node.operator);
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

function convertBinaryExpression(node: Acorn.BinaryExpression): Wwa.WWANode {
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
    case ">":
    case "<":
    case ">=":
    case "<=":
    case "==":
    case "!=":
      return {
        type: "BinaryOperation",
        operator: node.operator,
        left,
        right
      }
    default:
      throw new Error("未定義の演算子です :"+node.operator);
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
    if(property.type === "Number" || property.type === "Symbol" || property.type === "BinaryOperation" || property.type === "Array1D") {
      // m, o については一次元分適用
      return {
        type: "Array1D",
        name: object.name,
        index0: property
      }
    } else {
      throw new Error("WWAでは存在しない構文です")
    }
  } else if (object.type === "Array1D") {
    // 1次元にしかできないものは排除
    if (object.name === "ITEM" || object.name === "v") {
      throw new Error("この配列は2次元以上にはできません。");
    }
    // 1次元配列 + 1次元分の index を合成
    if (property.type === "Number" || property.type === "Symbol" || property.type === "BinaryOperation" || property.type === "Array1D") {
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
    case "v":
    case "HP":
    case "HPMAX":
    case "AT":
    case "DF":
    case "GD":
    case "STEP":
    case "TIME":
    case "PRID":
    case "i":
    case "j":
    case "k":
    case "LOOPLIMIT":
      return {
        type: "Symbol",
        name: node.name
      }
    default:  
      throw new Error("未定義のシンボルです :\n"+ node.name);
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
