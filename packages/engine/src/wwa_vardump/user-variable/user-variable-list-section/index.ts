import type { UserVariableKind } from "../../../wwa_data";
import * as UserVariableList from "../user-variable-list";
import * as ElementStore from "../../infra/element-store";

import * as Header from "./header";

export const CLASS_NAME = "user-variable-list-section";

export { Header };

export interface Props {
  elementStore: ElementStore.Props;
  kind: UserVariableKind;
}

export function createElement({ kind, elementStore }: Props): HTMLElement {
  const element = document.createElement("section");
  element.classList.add(CLASS_NAME);
  element.dataset.kind = kind;

  const listElement = UserVariableList.createElement({ kind, elementStore });
  elementStore.updateUserVarListElement(kind, listElement);
  const headerElement = Header.createElement({
    elementStore,
    heading: {
      text: kind === "named" ? "名前つき変数一覧" : "変数一覧",
    },
    information: (kind === "numbered" || undefined) && {},
    contentVisibilityToggleButton: {
      onClick: (event) => {
        const informationElment = elementStore.getNamedUserVarInformationElement(); 
        if (!informationElment) {
          return;
        }
        if (listElement.getAttribute("aria-hidden") === "true") {
          expand(listElement, informationElment, event.target);
        } else {
          fold(listElement, informationElment, event.target);
        }
      },
    },
  });
  element.appendChild(headerElement);
  element.appendChild(listElement);
  elementStore.updateUserVarListElement(kind, listElement);
  return element;
}

function expand(
  listElement: HTMLElement,
  informationElment: Element | null,
  buttonElement: EventTarget
) {
  listElement.removeAttribute("aria-hidden");
  if (informationElment instanceof HTMLElement) {
    informationElment.removeAttribute("aria-hidden");
  }
  if (buttonElement instanceof HTMLElement) {
    Header.setContentVisibilityToggleButtonText(buttonElement, true);
  }
}

function fold(
  listElement: HTMLElement,
  informationElment: Element | null,
  buttonElement: EventTarget
) {
  listElement.setAttribute("aria-hidden", "true");
  if (informationElment instanceof HTMLElement) {
    informationElment.setAttribute("aria-hidden", "true");
  }
  if (buttonElement instanceof HTMLElement) {
    Header.setContentVisibilityToggleButtonText(buttonElement, false);
  }
}
