import { $qs } from "../wwa_util";

import * as UserVariableCard from "./user-variable-card";
import * as UserVariableLabel from "./user-variable-label";
import * as UserVariableList from "./user-variable-list";
import * as UserVariableListSection from "./user-variable-list-section";

export * from "./apis";
export {
  UserVariableCard,
  UserVariableLabel,
  UserVariableList,
  UserVariableListSection,
};

export const CLASS_NAME = "wwa-vardump-wrapper";

export function setup(dumpElmQuery: string): HTMLElement | null {
  const element = $qs(dumpElmQuery);
  if (!(element instanceof HTMLElement)) {
    // 要素がない場合は何もしない
    return null;
  }

  element.classList.add(CLASS_NAME);
  /*
  element.appendChild(
    UserVariableListSection.createElement({ kind: "named" })
  );
  */
  element.appendChild(
    UserVariableListSection.createElement({ kind: "numbered" })
  );

  return element;
}
