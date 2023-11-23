import * as Information from "./information";

export { Information }

export interface Props {
  contentVisibilityToggleButton: {
    onClick: (this: HTMLButtonElement, ev: MouseEvent) => any;
  };
}

export function createElement({ contentVisibilityToggleButton }: Props) {
  const element = document.createElement("header");
  element.appendChild(createHeadingAreaElement({contentVisibilityToggleButton}));
  element.appendChild(Information.createElemnt());

  return element;
}

export function setContentVisibilityToggleButtonText(element: HTMLElement, active: boolean) {
  element.textContent = active ? "▲隠す" : "▼表示"
}


function createHeadingAreaElement({ contentVisibilityToggleButton }: Props) {
  const element = document.createElement("div");
  element.classList.add("heading-area");

  // 見出し
  const heading = document.createElement("h2");
  heading.textContent = "変数一覧";
  element.appendChild(heading);

  // 「隠す」ボタン
  const contentVisibilityToggleButtonElement = document.createElement("button");
  contentVisibilityToggleButtonElement.classList.add("content-visibility-toggle-button");
  setContentVisibilityToggleButtonText(contentVisibilityToggleButtonElement, true);
  contentVisibilityToggleButtonElement.addEventListener(
    "click",
    contentVisibilityToggleButton.onClick
  );
  element.appendChild(contentVisibilityToggleButtonElement);
  return element;
}
