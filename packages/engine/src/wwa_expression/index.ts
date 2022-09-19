import type { TokenValues, Descriminant, ComparisionOperatorKind } from "./typedef";
import { parseType } from "./parsers";
import { evaluateValue, calc } from "./eval";
import { regAdvance, regNormal, regIf, regMacroArg } from "./regexp";
import { generateValueAssignOperation, type ValueAssignOperation } from "./value-assign-operation";

export * from "./typedef";
export * from "./parsers";
export * from "./eval";
export * from "./regexp";

function removeSpaces(rawString: string): string {
  return rawString.replace(/\s/g, "");
}

export function parseAndEvaluateValue(value: string, tokenValues: TokenValues, fallbackValue = 0): number {
  return evaluateValue(parseType(value), tokenValues, fallbackValue);
}

/** 
  set マクロ式を評価して、結果を返します。
*/
export function evaluateSetMacroExpression(expression: string, tokenValues: TokenValues): ValueAssignOperation {
  const noSpaceStr = removeSpaces(expression);
  const advanceMatch = noSpaceStr.match(regAdvance);
  if (advanceMatch !== null) {
    const leftValue = parseAndEvaluateValue(advanceMatch[2], tokenValues);
    const rightValue = parseAndEvaluateValue(advanceMatch[4], tokenValues);
    const operator = advanceMatch[3];
    const calcResult = calc(operator, leftValue, rightValue);
    return generateValueAssignOperation(calcResult, advanceMatch[1]);
  }

  const normalMatch = noSpaceStr.match(regNormal);
  if (normalMatch !== null) {
    const leftValue = parseAndEvaluateValue(normalMatch[1], tokenValues);
    const rightValue = parseAndEvaluateValue(normalMatch[3], tokenValues);
    const operator = normalMatch[2];
    const calcResult = calc(operator, leftValue, rightValue);
    return generateValueAssignOperation(calcResult, normalMatch[1])
  }

  throw new Error('setMacroのフォーマットを満たしていません: ' + expression)
}

/** 
  マクロ引数の式を評価して、結果を返します。
*/
export function evaluateMacroArgExpression(expression: string, tokenValues: TokenValues, fallbackValue: number = 0): number {
  const noSpaceStr = removeSpaces(expression);
  const normalMatch = noSpaceStr.match(regMacroArg);
  if (normalMatch !== null) {
    const leftValue = parseAndEvaluateValue(normalMatch[1], tokenValues, fallbackValue);
    const rightValue = normalMatch[3] ? parseAndEvaluateValue(normalMatch[3], tokenValues, fallbackValue) : undefined;
    const operator = normalMatch[2];
    return operator && rightValue ? calc(operator, leftValue, rightValue) : leftValue;
  }
  throw new Error('マクロ引数のフォーマットを満たしていません: ' + expression)
}


/**
 * if 判別式をパースします。 (評価は行いません)
 */
export function parseDescriminant(expression: string): Descriminant | undefined {
  const descriminant = removeSpaces(expression).match(regIf);
  if (descriminant === null || descriminant.length <= 3) {
    console.error(`判定式が異常です: ${expression}`)
    return undefined;
  }
  const left = parseType(descriminant[1]);
  const right = parseType(descriminant[3]);
  if (!left || !right) {
    console.error(`判定式が異常です: ${expression}`)
    return undefined;
  }
  return {
    left,
    right,
    operator: descriminant[2] as ComparisionOperatorKind, // 既に正規表現は通っているのでこの型をつけて問題ない
  }
}

