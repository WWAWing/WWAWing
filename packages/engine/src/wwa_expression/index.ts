import { parseValue, parseType2, type TokenValues, type Descriminant, ComparisionOperatorKind } from "./parsers";
import { calc, compare } from "./eval";
import { regAdvance, regNormal, regIf } from "./regexp";
import { generateValueAssignOperation, type ValueAssignOperation } from "./value-assign-operation";

export { TokenValues, ValueAssignOperation, Descriminant };

function removeSpaces(rawString: string): string {
  return rawString.replace(/\s/g, "");
}

/** 
  set マクロ式を評価して、結果を返します。
*/
export function evaluateSetMacroExpression(expression: string, tokenValues: TokenValues): ValueAssignOperation {
  const noSpaceStr = removeSpaces(expression);
  const advanceMatch = noSpaceStr.match(regAdvance);
  if (advanceMatch !== null) {
    const leftValue = parseValue(advanceMatch[2], tokenValues);
    const rightValue = parseValue(advanceMatch[4], tokenValues);
    const operator = advanceMatch[3];
    const calcResult = calc(operator, leftValue, rightValue);
    return generateValueAssignOperation(calcResult, advanceMatch[1]);
  }

  const normalMatch = noSpaceStr.match(regNormal);
  if (normalMatch !== null) {
    const leftValue = parseValue(normalMatch[1], tokenValues);
    const rightValue = parseValue(normalMatch[3], tokenValues);
    const operator = normalMatch[2];
    const calcResult = calc(operator, leftValue, rightValue);
    return generateValueAssignOperation(calcResult, normalMatch[1])
  }

  throw new Error('setMacroのフォーマットを満たしていません: ' + expression)
}

/**
 * if マクロ式を評価して、結果を返します。
 */
export function evaluateIfMacroExpression(expression: string, tokenValues: TokenValues): boolean {
  const descriminant = removeSpaces(expression).match(regIf);
  if (descriminant === null || descriminant.length <= 3) {
    console.error(`判定式が異常です: ${expression}`)
    return false;
  }
  const left = parseValue(descriminant[1], tokenValues);
  const right = parseValue(descriminant[3], tokenValues);
  const operator = descriminant[2];
  return compare(operator, left, right)
}

/**
 * if 判別式をパースします。
 * evaluateIfmacroExpression と異なり、評価は行いません。
 */
export function parseDescriminant(expression: string): Descriminant | undefined {
  const descriminant = removeSpaces(expression).match(regIf);
  if (descriminant === null || descriminant.length <= 3) {
    console.error(`判定式が異常です: ${expression}`)
    return undefined;
  }
  const left = parseType2(descriminant[1]);
  const right = parseType2(descriminant[3]);
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

