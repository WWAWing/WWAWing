import * as Header from "./header";
import * as UserVariableViewer from "../user-variable-viewer";

export const CLASS_NAME = "user-variable-viewer-section";

export { Header };

export interface Props {
  header: Omit<Header.Props, "contentVisibilityToggleButton"> & {
    contentVisibilityToggleButton?: Header.Props["contentVisibilityToggleButton"];
  };
}

export function createElement({ header }: Props): HTMLElement {
  const element = document.createElement("section");
  element.classList.add(CLASS_NAME);

  const userVariableViewerElement = UserVariableViewer.createElement();
  const headerElement = Header.createElement({
    ...header,
    contentVisibilityToggleButton: {
      ...header.contentVisibilityToggleButton,
      onClick: (event) => {
        header.contentVisibilityToggleButton?.onClick(event);
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
