import { $qs } from "../wwa_util";
import { UserVarMap } from "../wwa_data";
import * as UserVariableListSection from "./user-variable/user-variable-list-section";
import * as QuerySelectorCache from "./infra/query-selector-cache"; 
import * as NamedUserVariable from "./named-user-variable";
import * as NumberedUserVariable from "./numbered-user-variable";

export * as UserVariableCard from "./user-variable/user-variable-card";
export * as UserVariableLabel from "./user-variable/user-variable-label";
export * as UserVariableList from "./user-variable/user-variable-list";

export { UserVariableListSection };

export const CLASS_NAME = "wwa-vardump-wrapper";

export interface Props {
  updateAllVariables: (params: { namedUserVar?: UserVarMap, userVar?: (string | number | boolean)[] }) => void;
  numberedUserVariable: {
    updateValues: (userVar: (string | number | boolean)[]) => void;
    updateLabels: (userVarNameList: string[]) => void;
    updateInformation: (content: string, isError?: boolean) => void;
  },
  namedUserVariable: {
    updateValues: (userVar: UserVarMap) => void;
  }
}

export function setup(dumpElmQuery: string): Props | null {
  const element = $qs(dumpElmQuery);
  const querySelectorCache = QuerySelectorCache.createQuerySelectorCaches(element);
  if (!(element instanceof HTMLElement)) {
    // 要素がない場合は何もしない
    return null;
  }

  element.classList.add(CLASS_NAME);
  element.appendChild(UserVariableListSection.createElement({ kind: "named" }));
  element.appendChild(
    UserVariableListSection.createElement({ kind: "numbered" }));

  return {
    updateAllVariables: ({namedUserVar, userVar}) => {
        if (namedUserVar) {
            NamedUserVariable.updateValues(querySelectorCache, namedUserVar);
        }
        if (userVar) {
            NumberedUserVariable.updateValues(querySelectorCache, userVar);
        }
    },
    numberedUserVariable: {
      updateValues: (userVar) => NumberedUserVariable.updateValues(querySelectorCache, userVar),
      updateLabels: (userVarNameList) => NumberedUserVariable.updateLabels(querySelectorCache, userVarNameList),
      updateInformation: (content, isError = false) => NumberedUserVariable.updateInformation(querySelectorCache, content, isError),
    },
    namedUserVariable: {
      updateValues: (userVar) => NamedUserVariable.updateValues(querySelectorCache, userVar),
    }
  }
}
