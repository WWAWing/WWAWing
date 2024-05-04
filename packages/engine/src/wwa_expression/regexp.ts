const NUMBER = "-?\\d+";
const USER_VAR = `v\\[${NUMBER}\\]`;
const USER_VAR_CAPTURE = `v\\[(${NUMBER})\\]`;
const MAP_BY_COORD = `m\\[${NUMBER}\\]\\[${NUMBER}\\]`;
const MAP_BY_COORD_CAPTURE = `m\\[(${NUMBER})\\]\\[(${NUMBER})\\]`;
const OBJECT_BY_COORD = `o\\[${NUMBER}\\]\\[${NUMBER}\\]`;
const OBJECT_BY_COORD_CAPTURE = `o\\[(${NUMBER})\\]\\[(${NUMBER})\\]`;
const ITEM_BY_BOX_ID = `ITEM\\[${NUMBER}\\]`
const ITEM_BY_BOX_ID_CAPTURE = `ITEM\\[(${NUMBER})\\]`
const INDEXED_VALUE = `${USER_VAR}|${MAP_BY_COORD}|${OBJECT_BY_COORD}|${ITEM_BY_BOX_ID}`;

const READ_ONLY_VALUE = `AT_TOTAL|AT_ITEMS|DF_TOTAL|DF_ITEMS|TIME|X|Y|PX|PY|ID|TYPE|ITEM_COUNT_ALL`;
const WRITABLE_VALUE = "HP|HPMAX|AT|DF|GD|STEP|PDIR"
const ASSIGNEE = `${INDEXED_VALUE}|${MAP_BY_COORD}|${OBJECT_BY_COORD}|${ITEM_BY_BOX_ID}|${WRITABLE_VALUE}`
const VALUE = `${NUMBER}|${INDEXED_VALUE}|${READ_ONLY_VALUE}|${WRITABLE_VALUE}`;

const RAND = `RAND\\((?:${VALUE})\\)`;
const RAND_CAPTURE = `RAND\\((${VALUE})\\)`;
const ITEM_COUNT = `ITEM_COUNT\\((?:${VALUE})\\)`;
const ITEM_COUNT_CAPTURE = `ITEM_COUNT\\((${VALUE})\\)`;

const FUNCTION = `${RAND}|${ITEM_COUNT}`;
const VALUE_OR_FUNCTION = `${VALUE}|${FUNCTION}`

const CALC_OPERATOR = "\\+|\\-|\\*|\\/|%";
const ASSIGN = "=";
const ASSIGNMENT_OPERATOR = `${ASSIGN}|\\+=|\\-=|\\*=|\\/=|%=`;
const COMPARISON_OPERATOR = ">|<|<=|>=|==|!=";

const START = "^\\(";
const END = "\\)$";

export const regNumber = new RegExp(`^${NUMBER}\$`);
export const regUserVar = new RegExp(`^${USER_VAR_CAPTURE}\$`);
export const regMapByCoord = new RegExp(`^${MAP_BY_COORD_CAPTURE}\$`)
export const regObjectByCoord = new RegExp(`^${OBJECT_BY_COORD_CAPTURE}\$`)
export const regItemByBoxId = new RegExp(`^${ITEM_BY_BOX_ID_CAPTURE}\$`)
export const regRand = new RegExp(`^${RAND_CAPTURE}\$`);
export const regItemCount = new RegExp(`${ITEM_COUNT_CAPTURE}\$`)

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
 * マクロ引数のフォーマット
 * 外側にカッコがないので注意
 * v[x] もしくは v[x] + v[y]
 */
export const regMacroArg = new RegExp(`^(${VALUE_OR_FUNCTION})(?:(${CALC_OPERATOR})(${VALUE_OR_FUNCTION}))?$`);

/**
 * ifマクロのフォーマット
 */
 export const regIf = new RegExp(`${START}(${VALUE_OR_FUNCTION})(${COMPARISON_OPERATOR})(${VALUE_OR_FUNCTION})${END}`);
