import { formatUserVarForDisplay } from "../../../wwa_util";
import * as UserVariableLabel from "../user-variable-label";

export interface Props {
  index: number | string;
  value?: number | string | boolean;
}

const BLANK = "-";
export const CLASS_NAME = "user-variable-card";
export const TRIMMED_CLASS_NAME = "user-variable-card--is-trimmed";

export function createElement({ index, value }: Props): HTMLElement {
  const element = document.createElement("div");
  element.classList.add(CLASS_NAME);
  if (isTrimmingValue(value)) {
    element.classList.add(TRIMMED_CLASS_NAME);
  }
  element.dataset.varIndex = String(index);
  element.appendChild(createIndexElement(index));
  element.appendChild(createValueElement(value));
  return element;
}

function createIndexElement(index: number | string): HTMLElement {
  const element = document.createElement("div");
  element.classList.add("index");
  element.textContent = String(index);
  if (typeof index === "string") {
    // 名前つき変数の場合はホバーでタイトルチップ表示 (省略表記があるため)
    // 数字indexの変数の場合は、別途ラベルが出る可能性があるため出しません
    element.setAttribute("title", index);
  }
  element.appendChild(UserVariableLabel.createElement());
  return element;
}

function createValueElement(value?: number | string | boolean): HTMLElement {
  const element = document.createElement("div");
  element.classList.add("value");
  if (typeof value === "string") {
    // 値が文字列の場合はツールチップ表示 数字indexの場合でも出します
    element.setAttribute("title", formatUserVarForDisplay(value));
  }

  setValue(element, value);
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

export function setValue(
  element: HTMLElement,
  value?: number | string | boolean
): void {
  element.textContent = value === undefined ? BLANK : formatUserVarForDisplay(value);
}

export function clearValue(element: HTMLElement) {
  element.textContent = BLANK;
}

export function getLabelElement(element: HTMLElement): HTMLElement | null {
  return element.querySelector(`.${UserVariableLabel.CLASS_NAME}`);
}

function isTrimmingValue(value: unknown) {
  // object 形式は trimming するとすべての内容を見ることができない
  return typeof value !== "object";
}
