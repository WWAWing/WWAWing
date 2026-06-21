import { UserVarMap } from "../wwa_data";
import * as UserVarElementStore from "./infra/element-store";
import * as UserVariableCard from "./user-variable/user-variable-card";
import * as UserVariableList from "./user-variable/user-variable-list";

/**
 * 指定された dumpElement 内にある UserVariableListSection (Named) の全ユーザ変数を userVar の値で更新します。
 * ない場合は新しい変数表示欄をつくります。
 */
export function updateValues(
  userVarElementStore: UserVarElementStore.Props,
  userVar: UserVarMap,
): void {
  const removeTargetUserVarIndexSet = userVarElementStore.getAllNamedUserVarIndeciesSet();
  const listElement = userVarElementStore.getUserVarListElement("named"); 
  // 既存ユーザ変数カードの更新・追加
  for (const [index, value] of userVar) {
    const maybeCardValueElement = userVarElementStore.getUserVarElementInfo(index)?.cardValueElement;
    removeTargetUserVarIndexSet.delete(index);
    if (maybeCardValueElement) {
      // 既に変数が一覧にあるときは、既存の UserVariableCard の値を更新する。
       UserVariableCard.setValue(maybeCardValueElement, value);
    } else {
      // まだ変数が一覧にないときは、新しく UserVariableCard を作る。
      UserVariableList.appendNewListItemElement(userVarElementStore, listElement, {
        index,
        value,
      });
    }
  }
  // 不要なユーザ変数カードの削除
  for (const index of removeTargetUserVarIndexSet) {
   const removeTarget = userVarElementStore.getUserVarElementInfo(index)?.cardElement.parentElement; // カード親の li 要素が削除対象
   // 安全のため li 要素以外は削除しない
   if (removeTarget instanceof HTMLLIElement) {
     userVarElementStore.getUserVarListElement("named")?.removeChild(removeTarget);
     userVarElementStore.deleteUserVarElementInfo(index);
   }
  }
}
