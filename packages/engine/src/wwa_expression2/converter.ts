import { isPrimitive } from "@wwawing/util";
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
      case "ReturnStatement":
        return convertReturnStatement(node as Acorn.ReturnStatement)
      case "ContinueStatement":
        return convertContinueStatment(node as Acorn.ContinueStatement);
      case "UpdateExpression":
        return convertUpdateExpression(node as Acorn.UpdateExpression);
      case "LogicalExpression":
        return convertLogicalExpression(node as Acorn.LogicalExpression);
      case "TemplateLiteral":
        return convertTemplateLiteral(node as Acorn.TemplateLiteral);
      case "TemplateElement":
        return convertTemplateElement(node as Acorn.TemplateElement);
      case "ConditionalExpression":
        return convertConditionalExpression(node as Acorn.ConditionalExpression)
      case "Property":
        return convertProperty(node as Acorn.Property);
      case "ObjectExpression":
        return convertObjectExpression(node as Acorn.ObjectExpression);
      case "ArrayExpression":
        return convertArrayExpression(node as Acorn.ArrayExpression);
      default:
        console.log(node);
        throw new Error("未定義の AST ノードです :" + node.type);
    }
}

function convertFunctionStatement(node: Acorn.FunctionDeclaration): Wwa.WWANode {
  return {
    type: "UserDefinedFunction",
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

function convertLogicalExpression(node: Acorn.LogicalExpression): Wwa.WWANode {
  return {
    type: "LogicalExpression",
    operator: node.operator,
    left: convertNodeAcornToWwa(node.left),
    right: convertNodeAcornToWwa(node.right)
  }
}

function convertTemplateLiteral(node: Acorn.TemplateLiteral): Wwa.WWANode {
  return {
    type: "TemplateLiteral",
    expressions: node.expressions.map((exp) => convertNodeAcornToWwa(exp) ),
    quasis: node.quasis.map((q) => convertNodeAcornToWwa(q) )
  }
}

function convertTemplateElement(node: Acorn.TemplateElement): Wwa.WWANode {
  return {
    type: "TemplateElement",
    value: node.value
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

function convertReturnStatement(node: Acorn.ReturnStatement): Wwa.WWANode {
  return {
    type: "Return",
    argument: convertNodeAcornToWwa(node.argument)
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
  if (node.callee.type !== "Identifier") {
    // xxx.foo(), xxx().foo() のような関数呼び出しは現状サポートしない
    throw new Error("WWAでは存在しない構文です");
  }
  const functionName = node.callee.name;
  switch(functionName) {
    case "RAND":
      return execRandomFunction(node.arguments);
    case "MSG":
    case "MESSAGE":
      return execMessageFunction(node.arguments);
    case "JUMPGATE":
    case "MUSIC":
    case "SOUND":
    case "BGM_STOP":
    case "STOP_BGM":
    case "SOUND_STOP":
    case "STOP_SOUND":
    case "ALL_SOUND_STOP":
    case "STOP_ALL_SOUND":
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
    case "FACE":
    case "EFFECT":
    case "CHANGE_PLAYER_IMAGE":
    case "CHANGE_PLAYER_IMG":
    case "HAS_ITEM":
    case "REMOVE_ITEM":
    case "MOVE":
    case "PARTS_MOVE":
    case "IS_PLAYER_WAITING_MESSAGE":
    case "IS_MANUAL_PAUSE":
    case "IS_PLAYER_WAITING_ENTER":
    case "GET_UNIXTIME":
    case "GET_DATE_YEAR":
    case "GET_DATE_MONTH":
    case "GET_DATE_DAY":
    case "GET_DATE_HOUR":
    case "GET_DATE_MINUTES":
    case "GET_DATE_SECONDS":
    case "GET_DATE_MILLISECONDS":
    case "GET_DATE_WEEKDAY":
    case "CHANGE_SYSMSG":
    case "PICTURE":
    case "PICTURE_FROM_PARTS":
    case "CLEAR_ALL_PICTURES":
    case "HAS_PICTURE":
    case "SHOW_USER_DEF_VAR":
    case "DIV":
    case "FLOOR":
    case "CEIL":
    case "ROUND":
    case "ABS":
    case "POW":
    case "SQRT":
    case "SIN":
    case "COS":
    case "TAN":
    case "GET_GAMEOVER_POS_X":
    case "GET_GAMEOVER_POS_Y":
    case "ABORT_BATTLE":
    case "EXIT":
    case "GET_IMG_POS_X":
    case "GET_IMG_POS_Y":
    case "LENGTH":
    case "IS_NUMBER":
    case "IS_NAN":
    case "CLONE":
    case "MANUAL_PAUSE":
    case "WAIT_ENTER":
    case "CANCEL_MANUAL_PAUSE":
    case "CANCEL_WAIT_ENTER":
    case "COLOR":
    case "EFFITEM":
    case "CHANGE_BOM_IMG":
    case "CHANGE_BOM_IMAGE":
    case "CHANGE_CLICK_IMAGE":
    case "CHANGE_CLICK_IMG":
    case "CHANGE_FRAME_IMAGE":
    case "CHANGE_FRAME_IMG":
    case "CHANGE_YESNO_IMAGE":
    case "CHANGE_YESNO_IMG":
    case "NO_GAMEOVER":
    case "DEFAULT":
    case "DIR_MAP":
    case "CHANGE_SOUND_ATTACK":
    case "CHANGE_SOUND_DECISION":
    case "SORT":
    case "OPEN_QUICK_SAVE_WINDOW":
    case "OPEN_QUICK_LOAD_WINDOW":
    case "OPEN_RESTART_GAME_WINDOW":
      return execSystemDefinedFunctionCall(node.arguments, functionName);
    default:
      return {
        type: "UserDefinedFunctionCall",
        functionName: functionName
      }
  }
}

/**
 * システム定義関数を実行する
 * @param callee 
 * @returns 
 */
function execSystemDefinedFunctionCall(callee: Acorn.Literal[], functionName: string): Wwa.WWANode {
  return {
    type: "SystemDefinedFunctionCall",
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
    case "+=":
    case "-=":
    case "*=":
    case "/=":
      if (left.type === "ArrayOrObject2D") {
        if (left.name === "m" || left.name === "o") {
          return {
            type: "PartsAssignment",
            partsKind: left.name === "m" ? "map" : "object",
            destinationX: left.indecies[0],
            destinationY: left.indecies[1],
            value: right,
            operator: node.operator
          }
        } else if (left.name === "v") {
          return {
            type: "UserVariableAssignment",
            index: [left.indecies[0], left.indecies[1]],
            value: right,
            operator: node.operator
          }
        } else {
          throw new Error("想定していない記号が2次元配列ででてきました");
        }
      } else if (left.type === "ArrayOrObject1D") {
        if (left.name === "ITEM") {
          return {
            type: "ItemAssignment",
            itemBoxPosition1to12: left.indecies[0],
            value: right,
            operator: node.operator
          }
        } else if (left.name === "v") {
          return {
            type: "UserVariableAssignment",
            index: [left.indecies[0]],
            value: right,
            operator: node.operator
          }
        } else if (left.name === "LP") {
          return {
            type: "LoopPointerAssignment",
            index: left.indecies[0],
            value: right,
            operator: node.operator
          }
        } else {
          throw new Error(`1次元配列にて想定していないシンボルが指定されました ${left.name}`);
        }
      } else if (left.type === "Symbol") {
        if (
          left.name === "m" ||
          left.name === "o" ||
          left.name === "v" ||
          left.name === "ITEM" ||
          left.name === "X" ||
          left.name === "Y" ||
          left.name === "ID" ||
          left.name === "TYPE" ||
          left.name === "CX" ||
          left.name === "CY" ||
          left.name === "PICTURE" ||
          left.name === "PLAYER_PX" ||
          left.name === "PLAYER_PY" ||
          left.name === "MOVE_SPEED" ||
          left.name === "MOVE_FRAME_TIME" ||
          left.name === "LP" ||
          left.name === "SORT_A" ||
          left.name === "SORT_B" ||
          left.name === "undefined"
        ) {
          throw new Error("このシンボルには代入できません");
        }
        if (left.name === "AT_TOTAL") {
          throw new Error(`"装備品込みの攻撃力(AT_TOTAL)への代入はできません。"`);
        }
        if (left.name === "DF_TOTAL") {
          throw new Error(`"装備品込みの防御力(DF_TOTAL)への代入はできません。"`);
        }
        if (left.name === "ENEMY_HP" || left.name === "ENEMY_AT" || left.name === "ENEMY_DF" || left.name === "ENEMY_GD") {
          throw new Error("敵ステータス (ENEMY_HP, ENEMY_AT, ENEMY_DF, ENEMY_GD) への代入はできません。");
        }
        return {
          type: "SpecialParameterAssignment",
          kind: left.name,
          value: right,
          operator: node.operator
        }
      } else if (left.type === "Literal") {
        throw new Error("数値には代入できません");
      } else if (left.type === "ArrayOrObject3DPlus" && left.name === "v") {
        return {
          type: "UserVariableAssignment",
          index: left.indecies,
          value: right,
          operator: node.operator
        }
      } else {
        throw new Error("代入できません");
      }
    default:
      throw new Error("想定していないオペレーターです")
  }
}

function convertUnaryExpression(node: Acorn.UnaryExpression): Wwa.UnaryOperation {
  const argument = convertNodeAcornToWwa(node.argument);
  const allowOperatorList = ["+", "-", "!"];
  if(!allowOperatorList.includes(node.operator)) {
    throw new Error("未定義の演算子です :"+node.operator);
  }
  if(!Wwa.isCalcurable(argument)) {
    throw new Error("単項演算子が適用できません");
  }
  return {
    type: "UnaryOperation",
    operator: <"!"|"+"|"-">node.operator,
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

function convertMemberExpression(node: Acorn.MemberExpression): Wwa.ArrayOrObject1D | Wwa.ArrayOrObject2D | Wwa.ArrayOrObject3DPlus | Wwa.SystemDefinedFunctionCall | Wwa.UserDefinedFunctionCall {
  const objectOrFunctionCall = convertNodeAcornToWwa(node.object);
  const property = convertNodeAcornToWwa(node.property);

  if (objectOrFunctionCall.type === "Symbol") {
    if (!["v", "m", "o", "ITEM", "LP", "PICTURE", "SORT_A", "SORT_B"].includes(objectOrFunctionCall.name)) {
      throw new Error("このシンボルは配列にできません");
    }
    if (Wwa.isCalcurable(property)) {
      return {
        type: "ArrayOrObject1D",
        name: <"v"|"m"|"o"|"ITEM"|"LP"|"SORT_A"|"SORT_B">objectOrFunctionCall.name,
        indecies: [property],
      };
    } else {
      throw new Error("WWAでは存在しない構文です");
    }
  } else if (objectOrFunctionCall.type === "ArrayOrObject1D") {
    // 1次元にしかできないものは排除
    if (objectOrFunctionCall.name === "ITEM" || objectOrFunctionCall.name === "PICTURE") {
      throw new Error("この配列は2次元以上にはできません。");
    }
    if (Wwa.isCalcurable(property)) {
      return {
        type: "ArrayOrObject2D",
        name: <"m" | "o" | "SORT_A" | "SORT_B">objectOrFunctionCall.name,
        // 1次元配列 + 1次元分の index を合成
        indecies: [...objectOrFunctionCall.indecies, property]
      }
    } else {
      // 数値に解決できないものが index に来てはいけない
      throw new Error("WWAでは存在しない構文です")
    }
  } else if(objectOrFunctionCall.type === "ArrayOrObject2D" || objectOrFunctionCall.type === "ArrayOrObject3DPlus") {
    if (objectOrFunctionCall.name === "m" || objectOrFunctionCall.name === "o") {
      throw new Error("この配列は3次元以上にはできません。");
    }
    // ユーザ定義名前変数, SORT_A, SORT_B のみ3次元以上配列が使える
    if ((objectOrFunctionCall.name === "v" || objectOrFunctionCall.name === "SORT_A" || objectOrFunctionCall.name === "SORT_B") && Wwa.isCalcurable(property)) {
      return {
        type: "ArrayOrObject3DPlus",
        name: objectOrFunctionCall.name,
        indecies: [ ...objectOrFunctionCall.indecies, property]
      }
    }
  } else if (objectOrFunctionCall.type === "SystemDefinedFunctionCall") {
    if (Wwa.isCalcurable(property)) {
      return {
        type: "SystemDefinedFunctionCall",
        functionName: objectOrFunctionCall.functionName,
        value: objectOrFunctionCall.value,
        // fooFunction().barMember.bazMember... のような形
        indecies: [...(objectOrFunctionCall.indecies ?? []), property],
      };
    } else {
      throw new Error("WWAでは存在しない構文です")
    }
  } else if (objectOrFunctionCall.type === "UserDefinedFunctionCall") {
    if (Wwa.isCalcurable(property)) {
      return {
        type: "UserDefinedFunctionCall",
        functionName: objectOrFunctionCall.functionName,
        // fooFunction().barMember.bazMember... のような形
        indecies: [...(objectOrFunctionCall.indecies ?? []), property],
      }
    } else {
      throw new Error("WWAでは存在しない構文です")
    }
  }
}

function convertIdentifer(node: Acorn.Identifier): Wwa.Symbol | Wwa.Literal {
  switch(node.name) {
    case "m":
    case "o":
    case "ITEM":
    case "X":
    case "Y":
    case "ID":
    case "TYPE":
    case "PX":
    case "PY":
    case "CX":
    case "CY":
    case "v":
    case "HP":
    case "HPMAX":
    case "AT":
    case "AT_TOTAL":
    case "DF":
    case "DF_TOTAL":
    case "GD":
    case "STEP":
    case "TIME":
    case "PDIR":
    case "i":
    case "j":
    case "k":
    case "LOOPLIMIT":
    case "ITEM_ID":
    case "ITEM_POS":
    case "ENEMY_HP":
    case "ENEMY_AT":
    case "ENEMY_DF":
    case "PICTURE":
    case "PLAYER_PX":
    case "PLAYER_PY":
    case "MOVE_SPEED":
    case "MOVE_FRAME_TIME":
    case "LP":
    case "SORT_A":
    case "SORT_B":
    case "undefined":
      return {
        type: "Symbol",
        name: node.name
      }
    default:  
      return {
        type: "Literal",
        value: node.name
      };
  }
}

function convertLiteral(node: Acorn.Literal): Wwa.Literal {
  if (!isPrimitive(node.value)) {
    throw new TypeError("Literal の値が不正です");
  }
  return {
    type: "Literal",
    value: node.value
  }
}

function convertConditionalExpression(node: Acorn.ConditionalExpression): Wwa.WWANode {
  const consequent = convertNodeAcornToWwa(node.consequent);
  const alternate = convertNodeAcornToWwa(node.alternate);
  const test = convertNodeAcornToWwa(node.test);
  return {
    type: "ConditionalExpression",
    consequent: consequent,
    test: test,
    alternate: alternate
  };
}

function convertProperty(node: Acorn.Property): Wwa.Property {
  const key = convertNodeAcornToWwa(node.key);
  if (key.type === "Symbol") {
    throw new Error(`Object のキー ${key.name} は予約されているため、使用できません。`);
  }
  if (key.type !== "Literal") {
    throw new Error(`Object のキーが不正です。 Literal を期待していましたが、実際は ${key.type} でした。`);
  }
  return {
    type: "Property",
    key,
    value: convertNodeAcornToWwa(node.value),
  };
}

function convertObjectExpression(node: Acorn.ObjectExpression): Wwa.ObjectExpression {
  return {
    type: "ObjectExpression",
    properties: node.properties.map(convertProperty),
  };
}

function convertArrayExpression(node: Acorn.ArrayExpression): Wwa.ArrayExpression {
  return {
    type: "ArrayExpression",
    elements: node.elements.map(convertNodeAcornToWwa),
  }
}
