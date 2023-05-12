import { WWA } from "../wwa_main";
import * as Wwa from "./wwa";

// UNDONE: boolean 値の取り扱い方法については未定

export function evalWwaNode(node: Wwa.Node, wwa?: WWA) {
  switch (node.type) {
    case "UnaryOperation":
      return evalUnaryOperation(node);
    case "BinaryOperation":
      return evalBinaryOperation(node);
    case "Symbol":
      return evalSymbol(node);
    case "Array1D":
      return evalArray1D(node);
    case "Array2D":
      return evalArray2D(node);
    case "Number":
      return evalNumber(node);
    case "UserVariableAssignment":
      return evalSetUserVariable(node, wwa);
    default:
      throw new Error("未定義または未実装のノードです:\n"+node.type);
  }
}

export function evalSetUserVariable(node: Wwa.UserVariableAssignment, wwa?: WWA) {
  const right = evalWwaNode(node.value);
  if(wwa && !isNaN(right)) {
    // TODO: TypeScriptでエラーになるのでどうにかしたい
    const userVarIndex: number = node.index?.value;
    wwa.setUserVar(userVarIndex, right);
  }
  return 0;
}

export function evalUnaryOperation(node: Wwa.UnaryOperation) {
  switch(node.operator) {
    case "+":
      return evalWwaNode(node.argument);
    case "-":
      return - evalWwaNode(node.argument);
    default:
        throw new Error("存在しない単項演算子です");
  }
}

export function evalBinaryOperation(node: Wwa.BinaryOperation) {
  const left = evalWwaNode(node.left);
  const right = evalWwaNode(node.right);
  switch(node.operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? 0 : Math.floor(left / right);
    case "%":
      return right === 0 ? 0 :left % right;
    default:
      throw new Error("存在しない単項演算子です");
  }
}

export function evalSymbol(node: Wwa.Symbol) {
  switch(node.name) {
    case "ITEM":
    case "X":
    case "Y":
    case "PX":
    case "PY":
      // UNDONE: WWAから値を取得する
      return 0;
    default:
      throw new Error("このシンボルは取得できません")
  }
}

export function evalArray1D(node: Wwa.Array1D) {
  switch (node.name) {
    case "v":
    case "ITEM":
      // UNDONE: WWAから値を取得する
      return 0;
    default:
      throw new Error("このシンボルは取得できません")
  }
}

export function evalArray2D(node: Wwa.Array2D) {
  switch(node.name) {
    case "m":
    case "o":
    default:
      throw new Error("このシンボルは取得できません")
  }
}

export function evalNumber(node: Wwa.Number) {
  return node.value;
}
