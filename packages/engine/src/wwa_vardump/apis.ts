import { WWAConsts as Consts } from "../wwa_data";

import * as UserVariableViewer from "./user-variable-viewer";
import * as UserVariableViewerSection from "./user-variable-viewer-section";
import { INFORMATION_SELECTOR, USER_VARIABLE_VIEWER_SELECTOR } from "./constants"

export function updateValues(
  dumpElement: HTMLElement | undefined | null,
  userVar: (number | string | boolean)[]
): void {
  if (!(dumpElement instanceof HTMLElement)) {
    return;
  }
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const element = dumpElement.querySelector(generateVarValueSelector(index));
    if (element) {
      element.textContent = String(userVar[index]);
    }
  });
}

export function updateLabels(
  dumpElement: HTMLElement | undefined | null,
  userVarNameList: string[]
): void {
  if (!dumpElement) {
    return;
  }
  // 以下は変数一覧に変数名を流し込む処理
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const userVarName = userVarNameList[index];
    if (!userVarName) {
      return;
    }
    const varIndexElement = dumpElement.querySelector(
      generateVarIndexSelector(index)
    );
    const varLabelElement = varIndexElement.querySelector(
      `.${UserVariableViewer.Row.Column.Label.CLASS_NAME}`
    );
    if (
      !(varIndexElement instanceof HTMLElement) ||
      !(varLabelElement instanceof HTMLElement)
    ) {
      return;
    }
    UserVariableViewer.Row.Column.Label.setText(varLabelElement, userVarName);
    UserVariableViewer.Row.Column.setupLabel(varIndexElement, varLabelElement);
  });
}

export function updateInformation(
  dumpElement: HTMLElement | undefined | null,
  content: string,
  isError: boolean = false
): void {
  if (!dumpElement) {
    return;
  }
  const element = dumpElement.querySelector(INFORMATION_SELECTOR);
  if (!(element instanceof HTMLElement)) {
    return;
  }
  UserVariableViewerSection.Header.Information.updateText(
    element,
    content,
    isError
  );
}

function generateVarIndexSelector(index: number): string {
  return `${USER_VARIABLE_VIEWER_SELECTOR} > tbody > tr > th[data-var-index="${CSS.escape(String(index))}"]`;
}

function generateVarValueSelector(index: number): string {
  return `${USER_VARIABLE_VIEWER_SELECTOR} > tbody > tr > td[data-var-index="${CSS.escape(String(index))}"]`;
}
