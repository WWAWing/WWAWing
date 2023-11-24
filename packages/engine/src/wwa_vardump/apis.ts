import { WWAConsts as Consts } from "../wwa_data";

import * as UserVariableCard from "./user-variable-card";
import * as UserVariableLabel from "./user-variable-label";
import * as UserVariableList from "./user-variable-list";
import * as UserVariableListSection from "./user-variable-list-section";

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
    const element = getNumberedUserVariableCardValueElement(
      dumpElement,
      index
    );
    if (!(element instanceof HTMLElement)) {
      return;
    }
    UserVariableCard.setValue(element, userVar[index]);
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
    const varIndexElement = getNumberedUserVariableCardIndexElement(
      dumpElement,
      index
    );
    if (!(varIndexElement instanceof HTMLElement)) {
      return;
    }
    const varLabelElement = UserVariableCard.getLabelElement(varIndexElement);
    if (!(varLabelElement instanceof HTMLElement)) {
      return;
    }
    UserVariableLabel.setText(varLabelElement, userVarName);
    UserVariableCard.setupLabel(varIndexElement, varLabelElement);
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
  const element = getNumberedUserVarInformationElement(dumpElement);
  if (!(element instanceof HTMLElement)) {
    return;
  }
  UserVariableListSection.Header.Information.updateText(
    element,
    content,
    isError
  );
}

const NUMBERED_USER_VARIABLE_LIST_SECTION_SELECTOR = `.${UserVariableListSection.CLASS_NAME}[data-kind="numbered"]`;

function getNumberedUserVarInformationElement(dumpElement: HTMLElement) {
  return dumpElement.querySelector(
    `.${NUMBERED_USER_VARIABLE_LIST_SECTION_SELECTOR} > header > .${UserVariableListSection.Header.Information.CLASS_NAME}`
  );
}

function generateNumberedUserVariableCardSelector(index: number) {
  return `${NUMBERED_USER_VARIABLE_LIST_SECTION_SELECTOR} > .${
    UserVariableList.CLASS_NAME
  } > li > .${UserVariableCard.CLASS_NAME}[data-var-index="${CSS.escape(
    String(index)
  )}"]`;
}

function getNumberedUserVariableCardIndexElement(
  dumpElement: HTMLElement,
  index: number
) {
  return dumpElement.querySelector(
    `${generateNumberedUserVariableCardSelector(index)} > .index`
  );
}

function getNumberedUserVariableCardValueElement(
  dumpElement: HTMLElement,
  index: number
) {
  return dumpElement.querySelector(
    `${generateNumberedUserVariableCardSelector(index)} > .value`
  );
}
