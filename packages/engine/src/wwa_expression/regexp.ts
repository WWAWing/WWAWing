const NUMBER = "-?\\d+";
const USER_VAR = `v\\[${NUMBER}\\]`;
const USER_VAR_CAPTURE = `v\\[(${NUMBER})\\]`;
const READ_ONLY_VALUE = `AT_TOTAL|AT_ITEMS|DF_TOTAL|DF_ITEMS|STEP|TIME|PX|PY`;
const WRITABLE_VALUE = "HP|HPMAX|AT|DF|GD"
const ASSIGNEE = `${USER_VAR}|${WRITABLE_VALUE}`
const VALUE = `${NUMBER}|${USER_VAR}|${READ_ONLY_VALUE}|${WRITABLE_VALUE}`;

const RAND = `RAND\\((?:${VALUE})\\)`;
const RAND_CAPTURE = `RAND\\((${VALUE})\\)`;

const FUNCTION = `${RAND}`;
const VALUE_OR_FUNCTION = `${VALUE}|${FUNCTION}`

const CALC_OPERATOR = "\\+|\\-|\\*|\\/|%";
const ASSIGN = "=";
const ASSIGNMENT_OPERATOR = `${ASSIGN}|\\+=|\\-=|\\*=|\\/=|%=`;
const COMPARISON_OPERATOR = ">|<|<=|>=|==|!=";

const START = "^\\(";
const END = "\\)$";

export const regNumber = new RegExp(`^${NUMBER}\$`);
export const regUserVar = new RegExp(`^${USER_VAR}\$`);
export const regUserVarCapture = new RegExp(`^${USER_VAR_CAPTURE}\$`);
export const regRand = new RegExp(`^${RAND}\$`);
export const regRandCapture = new RegExp(`^${RAND_CAPTURE}\$`);

/**
 * v[x] = v[y] + v[z] のフォーマットの時
 * 左辺値は変数のみ，中央値・右辺値は変数・定数両方受け取る
 * 演算子は+, -, *, /, % を受け付ける
 *
 */
export const regAdvance = new RegExp(`${START}(${ASSIGNEE})${ASSIGN}(${VALUE_OR_FUNCTION})(${CALC_OPERATOR})(${VALUE_OR_FUNCTION})${END}`);

/**
 * v[x] = v[y] のフォーマット
 * 左辺値は変数のみ，右辺値は変数・定数両方受け取る
 * 演算子は=, +=, -=, *=, /=, %= を受け付ける
 *
*/
export const regNormal = new RegExp(`${START}(${ASSIGNEE})(${ASSIGNMENT_OPERATOR})(${VALUE_OR_FUNCTION})${END}`);

/**
 * ifマクロのフォーマット
 */
 export const regIf = new RegExp(`${START}(${VALUE_OR_FUNCTION})(${COMPARISON_OPERATOR})(${VALUE_OR_FUNCTION})${END}`);
