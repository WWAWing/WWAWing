import { $qs } from "../wwa_util";

import * as UserVariableLabel from "./user-variable-label";
import * as UserVariableViewer from "./user-variable-viewer";
import * as UserVariableViewerSection from "./user-variable-viewer-section";

export * from "./apis";
export { UserVariableLabel, UserVariableViewer, UserVariableViewerSection };

export const CLASS_NAME = "wwa-vardump-wrapper";

export function setup(dumpElmQuery: string): HTMLElement | null {
  const element = $qs(dumpElmQuery);
  if (!(element instanceof HTMLElement)) {
    // 要素がない場合は何もしない
    return null;
  }

  element.classList.add(CLASS_NAME);
  element.appendChild(
    UserVariableViewerSection.createElement({
      header: { heading: { text: "変数一覧" } },
    })
  );

  return element;
}
