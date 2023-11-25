import * as UserVariableCard from "../user-variable/user-variable-card";
import * as UserVariableList from "../user-variable/user-variable-list";
import * as UserVariableListSection from "../user-variable/user-variable-list-section";

/**
 * 指定された dumpElement 内にある UserVariableListSection (Named) の全ユーザ変数を userVar の値で更新します。
 * ない場合は新しい変数表示欄をつくります。
 */
export function updateValues(
  dumpElement: HTMLElement | undefined | null,
  userVar: Map<string, number | string | boolean>
): void {
  if (!(dumpElement instanceof HTMLElement)) {
    return;
  }
  const listElement = getUserVariableListElement(dumpElement);
  if (!(listElement instanceof HTMLElement)) {
    return;
  }
  for (const [index, value] of userVar) {
    const maybeElement = getCardValueElement(dumpElement, index);
    if (maybeElement instanceof HTMLElement) {
      // 既に変数が一覧にあるときは、既存の UserVariableCard の値を更新する。
      UserVariableCard.setValue(maybeElement, value);
    } else {
      // まだ変数が一覧にないときは、新しく UserVariableCard を作る。
      UserVariableList.appendNewListItemElement(listElement, {
        index,
        value,
      });
    }
  }
}

const LIST_SECTION_SELECTOR = `.${UserVariableListSection.CLASS_NAME}[data-kind="named"]`;

function generateCardSelector(index: string) {
  return `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME} > li > .${
    UserVariableCard.CLASS_NAME
  }[data-var-index="${CSS.escape(index)}"]`;
}

function getUserVariableListElement(dumpElement: HTMLElement) {
  return dumpElement.querySelector(
    `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME}`
  );
}

function getCardValueElement(dumpElement: HTMLElement, index: string) {
  return dumpElement.querySelector(`${generateCardSelector(index)} > .value`);
}
