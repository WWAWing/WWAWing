import { WWAConsts as Consts } from "../wwa_data";
import * as QuerySelectorCache from "./infra/query-selector-cache";
import * as UserVariableCard from "./user-variable/user-variable-card";
import * as UserVariableLabel from "./user-variable/user-variable-label";
import * as UserVariableList from "./user-variable/user-variable-list";
import * as UserVariableListSection from "./user-variable/user-variable-list-section";

/**
 * 指定された dumpElement 内にある UserVariableListSection (Numbered) の全ユーザ変数を userVar の値で更新します。
 */
export function updateValues(
  querySelectorCache: QuerySelectorCache.Props,
  userVar: (number | string | boolean)[],
): void {
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const element = getCardValueElement(querySelectorCache, index);
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
  querySelectorCache: QuerySelectorCache.Props,
  userVarNameList: string[]
): void {
  // 以下は変数一覧に変数名を流し込む処理
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const userVarName = userVarNameList[index];
    if (!userVarName) {
      return;
    }
    const varIndexElement = getCardIndexElement(querySelectorCache, index);
    if (!(varIndexElement instanceof HTMLElement)) {
      return;
    }
    const varLabelElement = UserVariableCard.getLabelElement(varIndexElement, querySelectorCache);
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
  querySelectorCache: QuerySelectorCache.Props,
  content: string,
  isError: boolean = false
): void {
  const element = getInformationElement(querySelectorCache);
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

function getInformationElement(querySelectorCache: QuerySelectorCache.Props) {
  return querySelectorCache.querySelector(
    `${LIST_SECTION_SELECTOR} > header > .${UserVariableListSection.Header.Information.CLASS_NAME}`
  );
}

function generateCardSelector(index: number) {
  return `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME} > li > .${
    UserVariableCard.CLASS_NAME
  }[data-var-index="${CSS.escape(String(index))}"]`;
}

function getCardIndexElement(querySelectorCache: QuerySelectorCache.Props, index: number) {
  return querySelectorCache.querySelector(`${generateCardSelector(index)} > .index`);
}

function getCardValueElement(querySelectorCache: QuerySelectorCache.Props, index: number) {
  return querySelectorCache.querySelector(`${generateCardSelector(index)} > .value`);
}
