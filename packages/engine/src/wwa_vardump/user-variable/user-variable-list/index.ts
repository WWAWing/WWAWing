import { WWAConsts as Consts, UserVar, type UserVariableKind } from "../../../wwa_data";
import * as UserVariableCard from "../user-variable-card";
import * as ElementStore from "../../infra/element-store";

export const CLASS_NAME = "user-variable-list";

export interface Props {
  kind: UserVariableKind;
  elementStore: ElementStore.Props;
}

export function createElement({ kind, elementStore }: Props): HTMLElement {
  const element = document.createElement("ul");
  element.classList.add(CLASS_NAME);

  if (kind === "numbered") {
    Array.from({ length: Consts.USER_VAR_NUM })
      .map((_, index) => createListItemElement({ elementStore, index }))
      .forEach((child) => element.appendChild(child));
  }
  return element;
}

export function createListItemElement({
  elementStore,
  index,
  value,
}: {
  elementStore: ElementStore.Props;
  index: number | string;
  value?: UserVar;
}) {
  const element = document.createElement("li");
  const cardElementInfo = UserVariableCard.createElement({ index, value });
  elementStore.updateUserVarElementInfo(index, cardElementInfo);

  element.appendChild(cardElementInfo.cardElement);
  return element;
}

export function appendNewListItemElement(
  elementStore: ElementStore.Props,
  element: HTMLElement,
  { index, value }: { index: number | string; value: UserVar }
) {
  element.appendChild(createListItemElement({ elementStore, index, value }));
}
