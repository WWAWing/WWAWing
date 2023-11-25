import { WWAConsts as Consts } from "../../../wwa_data";
import * as UserVariableCard from "../user-variable-card";

export const CLASS_NAME = "user-variable-list";

export interface Props {
  kind: UserVariableCard.Kind;
}

export function createElement({ kind }: Props): HTMLElement {
  const element = document.createElement("ul");
  element.classList.add(CLASS_NAME);

  if (kind === "numbered") {
    Array.from({ length: Consts.USER_VAR_NUM })
      .map((_, index) => createListItemElement({ index }))
      .forEach((child) => element.appendChild(child));
  }
  return element;
}

export function createListItemElement({
  index,
  value,
}: {
  index: number | string;
  value?: number | string | boolean;
}) {
  const element = document.createElement("li");
  element.appendChild(UserVariableCard.createElement({ index, value }));
  return element;
}

export function appendNewListItemElement(
  element: HTMLElement,
  { index, value }: { index: number | string; value: number | string | boolean }
) {
  element.appendChild(createListItemElement({ index, value }));
}
