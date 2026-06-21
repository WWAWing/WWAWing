import { UserVarMap } from "../wwa_data";
import * as QuerySelectorCache from "./infra/query-selector-cache";
import * as UserVariableCard from "./user-variable/user-variable-card";
import * as UserVariableList from "./user-variable/user-variable-list";
import * as UserVariableListSection from "./user-variable/user-variable-list-section";

/**
 * 指定された dumpElement 内にある UserVariableListSection (Named) の全ユーザ変数を userVar の値で更新します。
 * ない場合は新しい変数表示欄をつくります。
 */
export function updateValues(
  querySelectorCache: QuerySelectorCache.Props,
  userVar: UserVarMap,
): void {
  const removeTargetUserVarIndexSet = createDisplayingUserVarSet(querySelectorCache);
  const listElement = getUserVariableListElement(querySelectorCache);
  if (!(listElement instanceof HTMLElement)) {
    return;
  }
  // 既存ユーザ変数カードの更新・追加
  for (const [index, value] of userVar) {
    const maybeElement = getCardValueElement(querySelectorCache, index);
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
   const removeTarget = getCardElement(querySelectorCache, index).parentElement; // カード親の li 要素が削除対象
   // 安全のため li 要素以外は削除しない
   if (removeTarget instanceof HTMLLIElement) {
     getUserVariableListElement(querySelectorCache).removeChild(removeTarget);
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

function getUserVariableListElement(querySelectorCache: QuerySelectorCache.Props) {
  return querySelectorCache.querySelector(
    `${LIST_SECTION_SELECTOR} > .${UserVariableList.CLASS_NAME}`
  );
}

function getCardElement(querySelectorCache: QuerySelectorCache.Props, index: string) {
  return querySelectorCache.querySelector(generateCardSelector(index));
}

function getCardValueElement(querySelectorCache: QuerySelectorCache.Props, index: string) {
  return querySelectorCache.querySelector(`${generateCardSelector(index)} > .value`);
}

function createDisplayingUserVarSet(querySelectorCache: QuerySelectorCache.Props): Set<string> {
  return new Set([...querySelectorCache.querySelectorAll(USER_VARITABLE_CARD_SELECTOR)].map(element => 
     element instanceof HTMLElement ? element.dataset.varIndex : undefined
     // HACK: strict: true でないので string | undefined を string にする処理は書いていないので妥協している。
  ).filter(Boolean))
}
