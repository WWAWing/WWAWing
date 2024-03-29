import { WWAConsts as Consts } from "../../wwa_data";

import * as UserVariableCard from "../user-variable/user-variable-card";
import * as UserVariableLabel from "../user-variable/user-variable-label";
import * as UserVariableList from "../user-variable/user-variable-list";
import * as UserVariableListSection from "../user-variable/user-variable-list-section";

/**
 * 指定された dumpElement 内にある UserVariableListSection (Numbered) の全ユーザ変数を userVar の値で更新します。
 */
export function updateValues(
  dumpElement: HTMLElement | undefined | null,
  userVar: (number | string | boolean)[]
): void {
  if (!(dumpElement instanceof HTMLElement)) {
    return;
  }
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const element = getCardValueElement(dumpElement, index);
    if (!(element instanceof HTMLElement)) {
      return;
    }
    UserVariableCard.setValue(element, userVar[index]);
  });
}

/**
 * 指定された dumpElement 内にある UserVariableListSection (Numbered) の添字セルの
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
    const varIndexElement = getCardIndexElement(dumpElement, index);
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
 * 指定された dumpElement 内にある UserVariableListSection の information 内のメッセージを更新します。
 */
export function updateInformation(
  dumpElement: HTMLElement | undefined | null,
  content: string,
  isError: boolean = false
): void {
  if (!dumpElement) {
    return;
  }
  const element = getInformationElement(dumpElement);
  if (!(element instanceof HTMLElement)) {
    return;
  }
  UserVariableListSection.Header.Information.updateText(
    element,
    content,
    isError
  );
}

const LIST_SECTION_SELECTOR = `.${UserVariableListSection.CLASS_NAME}[data-kind="numbered"]`;

function getInformationElement(dumpElement: HTMLElement) {
  return dumpElement.querySelector(
    `${LIST_SECTION_SELECTOR} > header > .${UserVariableListSection.Header.Information.CLASS_NAME}`
  );
}

function generateCardSelector(index: number) {
  return `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME} > li > .${
    UserVariableCard.CLASS_NAME
  }[data-var-index="${CSS.escape(String(index))}"]`;
}

function getCardIndexElement(dumpElement: HTMLElement, index: number) {
  return dumpElement.querySelector(`${generateCardSelector(index)} > .index`);
}

function getCardValueElement(dumpElement: HTMLElement, index: number) {
  return dumpElement.querySelector(`${generateCardSelector(index)} > .value`);
}
