import * as Information from "./information";

export { Information }

export interface Props {
  heading: {
    text: string;
  };
  contentVisibilityToggleButton: {
    onClick?: (ev: MouseEvent) => any;
  };
}

export function createElement({ heading, contentVisibilityToggleButton }: Props) {
  const element = document.createElement("header");
  element.appendChild(createHeadingAreaElement({heading, contentVisibilityToggleButton}));
  element.appendChild(Information.createElemnt());

  return element;
}

export function setContentVisibilityToggleButtonText(element: HTMLElement, active: boolean) {
  element.textContent = active ? "▲隠す" : "▼表示"
}


function createHeadingAreaElement({ heading, contentVisibilityToggleButton }: Props) {
  const element = document.createElement("div");
  element.classList.add("heading-area");

  // 見出し
  const headingElement = document.createElement("h2");
  headingElement.textContent = heading.text;
  element.appendChild(headingElement);

  // 「隠す」ボタン
  const contentVisibilityToggleButtonElement = document.createElement("button");
  contentVisibilityToggleButtonElement.classList.add("content-visibility-toggle-button");
  setContentVisibilityToggleButtonText(contentVisibilityToggleButtonElement, true);
  if (contentVisibilityToggleButton.onClick) {
    contentVisibilityToggleButtonElement.addEventListener(
      "click",
      contentVisibilityToggleButton.onClick.bind(contentVisibilityToggleButtonElement)
    );
  }
  element.appendChild(contentVisibilityToggleButtonElement);
  return element;
}
