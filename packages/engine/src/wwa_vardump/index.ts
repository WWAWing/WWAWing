import { $qs } from "../wwa_util";
import * as UserVariableListSection from "./user-variable/user-variable-list-section";

export * as Api from "./api";
export * as UserVariableCard from "./user-variable/user-variable-card";
export * as UserVariableLabel from "./user-variable/user-variable-label";
export * as UserVariableList from "./user-variable/user-variable-list";
export * as NumberedUserVariable from "./numbered-user-variable";
export { UserVariableListSection };

export const CLASS_NAME = "wwa-vardump-wrapper";

export function setup(dumpElmQuery: string): HTMLElement | null {
  const element = $qs(dumpElmQuery);
  if (!(element instanceof HTMLElement)) {
    // 要素がない場合は何もしない
    return null;
  }

  element.classList.add(CLASS_NAME);
  element.appendChild(UserVariableListSection.createElement({ kind: "named" }));
  element.appendChild(
    UserVariableListSection.createElement({ kind: "numbered" })
  );

  return element;
}
