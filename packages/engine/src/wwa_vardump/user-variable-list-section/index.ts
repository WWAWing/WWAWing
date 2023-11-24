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

  const userVariableViewerElement = UserVariableList.createElement( { kind });
  const headerElement = Header.createElement({
    heading: {
      text: kind === "named" ? "名前つき変数一覧" : "変数一覧",
    },
    information: (kind === "numbered" || undefined) && {},
    contentVisibilityToggleButton: {
      onClick: (event) => {
        const informationElm = headerElement.querySelector(
          `.${Header.Information.CLASS_NAME}`
        );
        if (
          !(informationElm instanceof HTMLElement) ||
          !(event.target instanceof HTMLElement)
        ) {
          return;
        }
        if (userVariableViewerElement.getAttribute("aria-hidden") === "true") {
          userVariableViewerElement.removeAttribute("aria-hidden");
          informationElm.removeAttribute("aria-hidden");
          Header.setContentVisibilityToggleButtonText(event.target, true);
        } else {
          userVariableViewerElement.setAttribute("aria-hidden", "true");
          informationElm.setAttribute("aria-hidden", "true");
          Header.setContentVisibilityToggleButtonText(event.target, false);
        }
      },
    },
  });
  element.appendChild(headerElement);
  element.appendChild(userVariableViewerElement);
  return element;
}
