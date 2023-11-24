import { WWAConsts as Consts } from "../../wwa_data";
import * as Row from "./row";
import * as Cell from "./cell";

export const CLASS_NAME = "user-variable-viewer";

export { Row, Cell };

export interface Props {
  userVariableKind: "indexed" | "named";
}

export function createElement({ userVariableKind }: Props): HTMLTableElement {
  const element = document.createElement("table");
  element.classList.add(CLASS_NAME);
  element.appendChild(createTbodyElement({ userVariableKind }));
  return element;
}

function createTbodyElement({
  userVariableKind,
}: Pick<Props, "userVariableKind">): HTMLTableSectionElement {
  const element = document.createElement("tbody");
  if (userVariableKind === "indexed") {
    const rowNum = Math.ceil(Consts.USER_VAR_NUM / Row.REGULAR_COLUMN_NUM) * 2;
    Array.from({ length: rowNum })
      .map((_, rowIndex) =>
        // 最終行(値の行) と1つ前の行(index行) は生成していいセルの数に制限がある
        Row.createElement({ rowIndex, isLastRowSet: rowIndex + 2 >= rowNum })
      )
      .forEach((child) => element.appendChild(child));
  }
  return element;
}
