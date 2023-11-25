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
  const removeTargetUserVarIndexSet = createDisplayingUserVarSet(dumpElement);
  if (!(dumpElement instanceof HTMLElement)) {
    return;
  }
  const listElement = getUserVariableListElement(dumpElement);
  if (!(listElement instanceof HTMLElement)) {
    return;
  }
  // 既存ユーザ変数カードの更新・追加
  for (const [index, value] of userVar) {
    const maybeElement = getCardValueElement(dumpElement, index);
    removeTargetUserVarIndexSet.delete(index);
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
  // 不要なユーザ変数カードの削除
  for (const index of removeTargetUserVarIndexSet) {
   const removeTarget = getCardElement(dumpElement, index).parentElement; // カード親の li 要素が削除対象
   // 安全のため li 要素以外は削除しない
   if (removeTarget instanceof HTMLLIElement) {
     getUserVariableListElement(dumpElement).removeChild(removeTarget);
   }
  }
}

const LIST_SECTION_SELECTOR = `.${UserVariableListSection.CLASS_NAME}[data-kind="named"]`;
const USER_VARITABLE_CARD_SELECTOR = `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME} > li > .${
    UserVariableCard.CLASS_NAME
  }`;


function generateCardSelector(index: string) {
  return `${USER_VARITABLE_CARD_SELECTOR}[data-var-index="${CSS.escape(index)}"]`;
}

function getUserVariableListElement(dumpElement: HTMLElement) {
  return dumpElement.querySelector(
    `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME}`
  );
}

function getCardElement(dumpElement: HTMLElement, index: string) {
  return dumpElement.querySelector(generateCardSelector(index));
}

function getCardValueElement(dumpElement: HTMLElement, index: string) {
  return dumpElement.querySelector(`${generateCardSelector(index)} > .value`);
}

function createDisplayingUserVarSet(dumpElement: HTMLElement): Set<string> {
  return new Set([...dumpElement.querySelectorAll(USER_VARITABLE_CARD_SELECTOR)].map(element => 
     element instanceof HTMLElement ? element.dataset.varIndex : undefined
     // HACK: strict: true でないので string | undefined を string にする処理は書いていないので妥協している。
  ).filter(Boolean))
}
