import * as UserVariableLabel from "../user-variable-label";

export type Kind = "numbered" | "named";

export interface Props {
  index: number;
}

const BLANK = "-";
export const CLASS_NAME = "user-variable-card"

export function createElement({ index }: Props): HTMLElement {
  const element = document.createElement("div");
  element.classList.add(CLASS_NAME)
  element.dataset.varIndex = String(index);
  element.appendChild(createIndexElement(index));
  element.appendChild(createValueElement());
  return element;
}

function createIndexElement(index: number): HTMLElement {
  const element = document.createElement("div");
  element.classList.add("index");
  element.textContent = String(index);
  element.appendChild(UserVariableLabel.createElement());
  return element;
}

function createValueElement(): HTMLElement {
  const element = document.createElement("div");
  element.classList.add("value");
  element.textContent = BLANK;
  return element;
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
  return element.querySelector(`.${UserVariableLabel.CLASS_NAME}`);
}
