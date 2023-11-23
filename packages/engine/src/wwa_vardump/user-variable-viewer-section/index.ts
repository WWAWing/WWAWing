import * as Header from "./header"
import * as UserVariableViewer from "../user-variable-viewer";

export const CLASS_NAME = "user-variable-viewer-section";

export { Header }

export interface Props {
  header: Header.Props;
}

export function createElement({ header }: Props): HTMLElement {
  const element = document.createElement("section");
  element.classList.add(CLASS_NAME);
  element.appendChild(Header.createElement(header));
  element.appendChild(UserVariableViewer.createElement());
  return element;
}
