import { calc, parseValue, type TokenValues } from "./parsers"
import { generateValueAssignOperation, type ValueAssignOperation } from "./value-assign-operation";

export { TokenValues, ValueAssignOperation };

// Setマクロを実装
export function parseSetMacroExpression(macroStr: string, tokenValues: TokenValues): ValueAssignOperation {
  const noSpaceStr = macroStr.replace(/\s/g, "");
  /**
    * v[x] = v[y] + v[z] のフォーマットの時
    * 左辺値は変数のみ，中央値・右辺値は変数・定数両方受け取る
    * 演算子は+, -, *, /, % を受け付ける
    **/
  const regAdvance = /^\((v\[\d+\]|HP|HPMAX|AT|DF|GD)=(v\[\d+\]|\d+|HP|HPMAX|AT|DF|GD|STEP|TIME|RAND\(\d+\))(\+|\-|\*|\/|%)(v\[\d+\]|\d+|HP|HPMAX|AT|DF|GD|STEP|TIME|RAND\(\d+\))\)$/
  const advanceMatch = noSpaceStr.match(regAdvance);
  if (advanceMatch !== null) {
    const leftValue = parseValue(advanceMatch[2], tokenValues);
    const rightValue = parseValue(advanceMatch[4], tokenValues);
    const operator = advanceMatch[3];
    const calcResult = calc(operator, leftValue, rightValue);
    return generateValueAssignOperation(calcResult, advanceMatch[1]);
  }

  /**
   * v[x] = v[y] のフォーマット
   * 左辺値は変数のみ，右辺値は変数・定数両方受け取る
   * 演算子は=, +=, -=, *=, /=, %= を受け付ける
   **/
  const regNormal = /^\((v\[\d+\]|\d+|HP|HPMAX|AT|DF|GD)(=|\+=|\-=|\*=|\/=|%=)(v\[\d+\]|\d+|HP|HPMAX|AT|DF|GD|STEP|TIME|RAND\((\d+)\))\)$/;
  const normalMatch = noSpaceStr.match(regNormal);
  if (normalMatch !== null) {
    const leftValue = parseValue(normalMatch[1], tokenValues);
    const rightValue = parseValue(normalMatch[3], tokenValues);
    const operator = normalMatch[2];
    const calcResult = calc(operator, leftValue, rightValue);
    return generateValueAssignOperation(calcResult, normalMatch[1])
  }

  throw new Error('setMacroのフォーマットを満たしていません: ' + macroStr)
}

// 条件式を引数に取ってtrueかを判定する
export function checkCondition(descriminant: string, tokenValues: TokenValues): boolean {
  const parsedDescriminant = descriminant.replace(/\s/g, "")
    .match(/^\((v\[\d+\]|\d+)(>|<|<=|>=|==|!=)(v\[\d+\]|\d+)\)$/);
  if (parsedDescriminant === null || parsedDescriminant.length <= 3) {
    console.error(`判定式が異常です: ${descriminant}`)
    return false;
  }
  const left = parseValue(parsedDescriminant[1], tokenValues);
  const right = parseValue(parsedDescriminant[3], tokenValues);
  const operator = parsedDescriminant[2];
  switch (operator) {
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    default:
      return false;
  }
}
