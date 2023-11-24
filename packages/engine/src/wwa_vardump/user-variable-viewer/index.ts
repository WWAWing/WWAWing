import { WWAConsts as Consts } from "../../wwa_data";
import * as Cell from "./cell";

export const CLASS_NAME = "user-variable-viewer";

export { Cell };

export interface Props {
  userVariableKind: "indexed" | "named";
}

export function createElement({ userVariableKind }: Props): HTMLElement {
  const element = document.createElement("div");
  element.classList.add(CLASS_NAME);

  if (userVariableKind === "indexed") {
    Array.from({ length: Consts.USER_VAR_NUM })
      .map((_, index) => Cell.createElement({ index }))
      .forEach((child) => element.appendChild(child));
  }
  return element;
}
