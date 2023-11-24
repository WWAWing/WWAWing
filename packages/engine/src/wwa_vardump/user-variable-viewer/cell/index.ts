import * as Label from "../../user-variable-label";

export type ContentType = "index" | "value";

export interface Props {
  index: number;
  contentType: ContentType;
}

const BLANK = "-";

export function createElement({
  index,
  contentType,
}: Props): HTMLTableCellElement {
  const indexString = String(index);
  const { tagName, defaultValue } = resolveContent({ contentType, index });
  const cellElement = document.createElement(tagName);
  cellElement.textContent = defaultValue;
  cellElement.dataset.varIndex = indexString;

  // index 表示部にラベル生成
  if (contentType === "index") {
    cellElement.appendChild(Label.createElement());
  }

  return cellElement;
}

export function setupLabel(
  element: HTMLElement,
  labelElement: HTMLElement
): void {
  element.dataset.labelledVarIndex = "true";
  element.addEventListener("mouseover", () =>
    labelElement.removeAttribute("aria-hidden")
  );
  element.addEventListener("mouseleave", () =>
    labelElement.setAttribute("aria-hidden", "true")
  );
}

export function setValue(element: HTMLElement, value: number | string | boolean): void {
  element.textContent = String(value);
}

export function clearValue(element: HTMLElement) {
  element.textContent = BLANK;
}

export function getLabelElement(element: HTMLElement): HTMLElement | null {
  return element.querySelector(`.${Label.CLASS_NAME}`);
}

function resolveContent({
  contentType,
  index,
}: Pick<Props, "index" | "contentType">): {
  tagName: "th" | "td";
  defaultValue: string;
} {
  switch (contentType) {
    case "index":
      return { tagName: "th", defaultValue: String(index) };
    case "value":
      return { tagName: "td", defaultValue: BLANK };
    default:
      contentType satisfies never;
      throw new TypeError(`未定義の contentType です: ${contentType}`);
  }
}
