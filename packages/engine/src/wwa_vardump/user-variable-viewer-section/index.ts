import * as Header from "./header";
import * as UserVariableViewer from "../user-variable-viewer";

export const CLASS_NAME = "user-variable-viewer-section";

export { Header };

export interface Props {
  userVariableKind: "indexed" | "named";
}

export function createElement({ userVariableKind }: Props): HTMLElement {
  const element = document.createElement("section");
  element.classList.add(CLASS_NAME);
  element.dataset.userVariableKind = userVariableKind;

  const userVariableViewerElement = UserVariableViewer.createElement( { userVariableKind });
  const headerElement = Header.createElement({
    heading: {
      text: userVariableKind === "named" ? "名前つき変数一覧" : "変数一覧",
    },
    information: (userVariableKind === "indexed" || undefined) && {},
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
