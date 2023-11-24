import { WWAConsts as Consts } from "../wwa_data";

import * as UserVariableLabel from "./user-variable-label";
import * as UserVariableViewer from "./user-variable-viewer";
import * as UserVariableViewerSection from "./user-variable-viewer-section";

/**
 * 指定された dumpElement 内にある UserVariableViewer の全ユーザ変数を userVar の値で更新します。
 */
export function updateValues(
  dumpElement: HTMLElement | undefined | null,
  userVar: (number | string | boolean)[]
): void {
  if (!(dumpElement instanceof HTMLElement)) {
    return;
  }
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const element = getIndexedUserVariableViewerValueCellElement(dumpElement, index);
    if (!(element instanceof HTMLElement)) {
      return;
    }
    UserVariableViewer.Cell.setValue(element, userVar[index]);
  });
}

/**
 * 指定された dumpElement 内にある UserVariableViewer の添字セルの
 * ハイライト状態とラベルを userVarNameListで更新します。
 * userVarNameList は添字がユーザ変数の添字に対応する変数名ラベルの配列です。
 */
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
    const varIndexElement = getIndexedUserVariableViewerIndexCellElement(
      dumpElement,
      index
    );
    if (!(varIndexElement instanceof HTMLElement)) {
      return;
    }
    const varLabelElement =
      UserVariableViewer.Cell.getLabelElement(varIndexElement);
    if (!(varLabelElement instanceof HTMLElement)) {
      return;
    }
    UserVariableLabel.setText(varLabelElement, userVarName);
    UserVariableViewer.Cell.setupLabel(varIndexElement, varLabelElement);
  });
}

/**
 * 指定された dumpElement 内にある information 内のメッセージを更新します。
 */
export function updateInformation(
  dumpElement: HTMLElement | undefined | null,
  content: string,
  isError: boolean = false
): void {
  if (!dumpElement) {
    return;
  }
  const element = getIndexedUserVarInformationElement(dumpElement);
  if (!(element instanceof HTMLElement)) {
    return;
  }
  UserVariableViewerSection.Header.Information.updateText(
    element,
    content,
    isError
  );
}


const INDEXED_USER_VARIABLE_VIEWER_SECTION_SELECTOR = `.${UserVariableViewerSection.CLASS_NAME}[data-user-variable-kind="indexed"]`;
const INDEXED_USER_VARIABLE_VIEWER_SELECTOR = `${INDEXED_USER_VARIABLE_VIEWER_SECTION_SELECTOR} > .${UserVariableViewer.CLASS_NAME}`;

function getIndexedUserVarInformationElement(dumpElement: HTMLElement) {
  return dumpElement.querySelector(
    `.${INDEXED_USER_VARIABLE_VIEWER_SECTION_SELECTOR} > header > .${UserVariableViewerSection.Header.Information.CLASS_NAME}`
  );
}

function getIndexedUserVariableViewerIndexCellElement(
  dumpElement: HTMLElement,
  index: number
) {
  return dumpElement.querySelector(
    `${INDEXED_USER_VARIABLE_VIEWER_SELECTOR} > .cell[data-var-index="${CSS.escape(
      String(index)
    )}"] > .index`
  );
}

function getIndexedUserVariableViewerValueCellElement(
  dumpElement: HTMLElement,
  index: number
) {
  return dumpElement.querySelector(
    `${INDEXED_USER_VARIABLE_VIEWER_SELECTOR} > .cell[data-var-index="${CSS.escape(
      String(index)
    )}"] > .value`
  );
}