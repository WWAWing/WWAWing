import { WWAConsts as Consts } from "../../../wwa_data";

import * as Cell from "../cell";

export interface Props {
  rowIndex: number;
  isLastRowSet?: boolean;
}

export const REGULAR_COLUMN_NUM = 10;

export function createElement({ rowIndex, isLastRowSet }: Props) {
  const element = document.createElement("tr");
  // 偶数行目は index 表示部, 奇数行目は 値表示部.
  const contentType = rowIndex % 2 === 0 ? "index" : "value";
  element.dataset.rowContentType = contentType;

  const modColumnNum = Consts.USER_VAR_NUM % REGULAR_COLUMN_NUM;
  // 最終行の列数は REGULAR_COLUMN_NUM  で割り切れるならその値, 割り切れないなら割った余り.
  const columnNum =
    isLastRowSet && modColumnNum !== 0
      ? Consts.USER_VAR_NUM % REGULAR_COLUMN_NUM
      : REGULAR_COLUMN_NUM;


  // 行の中身を生成
  Array.from({ length: columnNum })
    .map((_, colIndex) => {
      return Cell.createElement({
        contentType,
        index: Math.floor(rowIndex / 2) * 10 + colIndex,
      });
    })
    .forEach((child) => element.appendChild(child));

  return element;
}
