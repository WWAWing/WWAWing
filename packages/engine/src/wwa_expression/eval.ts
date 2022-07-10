export function calc(operator: string, leftValue: number, rightValue: number) {
  switch (operator) {
    case "=":
      return rightValue;
    case '+':
    case '+=':
      return leftValue + rightValue;
    case '-':
    case '-=':
      return leftValue - rightValue;
    case '*':
    case '*=':
      return leftValue * rightValue;
    case '/':
    case '/=':
      return rightValue === 0 ? 0 : (leftValue / rightValue);
    case '%':
    case '%=':
      return rightValue === 0 ? 0 : (leftValue % rightValue);
    default:
      throw new Error("未定義の演算子です");
  }
}

export function compare(operator: string, leftValue: number, rightValue: number) {
  switch (operator) {
    case '>':
      return leftValue > rightValue;
    case '<':
      return leftValue < rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<=':
      return leftValue <= rightValue;
    case '==':
      return leftValue === rightValue;
    case '!=':
      return leftValue !== rightValue;
    default:
      return false;
  }
}
