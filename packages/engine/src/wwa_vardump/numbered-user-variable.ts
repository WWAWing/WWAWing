import { WWAConsts as Consts } from "../wwa_data";
import * as ElementStore from "./infra/element-store";
import * as UserVariableCard from "./user-variable/user-variable-card";
import * as UserVariableLabel from "./user-variable/user-variable-label";
import * as UserVariableListSection from "./user-variable/user-variable-list-section";

/**
 * 指定された dumpElement 内にある UserVariableListSection (Numbered) の全ユーザ変数を userVar の値で更新します。
 */
export function updateValues(
  elementStore: ElementStore.Props,
  userVar: (number | string | boolean)[],
): void {
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const element = elementStore.getUserVarElementInfo(index)?.cardValueElement;
    if (!element) {
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
  elementStore: ElementStore.Props,
  userVarNameList: string[]
): void {
  // 以下は変数一覧に変数名を流し込む処理
  Array.from({ length: Consts.USER_VAR_NUM }).map((_, index) => {
    const userVarName = userVarNameList[index];
    if (!userVarName) {
      return;
    }
    const info = elementStore.getUserVarElementInfo(index);
    if(!info) {
      return;
    }
    const varIndexElement = info.cardIndexElement;
    const varLabelElement = info.cardIndexLabelElement;
    UserVariableLabel.setText(varLabelElement, userVarName);
    UserVariableCard.setupLabel(varIndexElement, varLabelElement);
  });
}

/**
 * 指定された dumpElement 内にある UserVariableListSection の information 内のメッセージを更新します。
 */
export function updateInformation(
  elementStore: ElementStore.Props,
  content: string,
  isError: boolean = false
): void {
  const element = elementStore.getNamedUserVarInformationElement();
  UserVariableListSection.Header.Information.updateText(
    element,
    content,
    isError
  );
}
