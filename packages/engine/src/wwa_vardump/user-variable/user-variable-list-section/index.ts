import * as Header from "./header";
import type * as UserVariableCard from "../user-variable-card";
import * as UserVariableList from "../user-variable-list";

export const CLASS_NAME = "user-variable-list-section";

export { Header };

export interface Props {
  kind: UserVariableCard.Kind;
}

export function createElement({ kind }: Props): HTMLElement {
  const element = document.createElement("section");
  element.classList.add(CLASS_NAME);
  element.dataset.kind = kind;

  const listElement = UserVariableList.createElement({ kind });
  const headerElement = Header.createElement({
    heading: {
      text: kind === "named" ? "名前つき変数一覧" : "変数一覧",
    },
    information: (kind === "numbered" || undefined) && {},
    contentVisibilityToggleButton: {
      onClick: (event) => {
        const informationElment = headerElement.querySelector(
          `.${Header.Information.CLASS_NAME}`
        );
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
