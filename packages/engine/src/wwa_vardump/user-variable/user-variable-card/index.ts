import { UserVar } from "../../../wwa_data";
import { formatUserVarForDisplay } from "../../../wwa_util";
import * as ElementStore from "../../infra/element-store";
import * as UserVariableLabel from "../user-variable-label";

export interface Props {
  index: number | string;
  value?: UserVar;
}

const BLANK = "-";
export const CLASS_NAME = "user-variable-card";
export const TRIMMED_CLASS_NAME = "user-variable-card--is-trimmed";

export function createElement({ index, value }: Props): ElementStore.UserVarElementInfo {
  const cardElement = document.createElement("div");
  cardElement.classList.add(CLASS_NAME);
  if (isTrimmingValue(value)) {
    cardElement.classList.add(TRIMMED_CLASS_NAME);
  }
  cardElement.dataset.varIndex = String(index);
  const { cardIndexElement, cardIndexLabelElement } = createIndexElement(index);
  const cardValueElement = createValueElement(value);
  cardElement.appendChild(cardIndexElement);
  cardElement.appendChild(cardValueElement);
  return {
    cardElement,
    cardIndexElement,
    cardIndexLabelElement,
    cardValueElement
  };
}

function createIndexElement(index: number | string): Pick<ElementStore.UserVarElementInfo, "cardIndexElement" | "cardIndexLabelElement"> {
  const cardIndexElement = document.createElement("div");
  cardIndexElement.classList.add("index");
  cardIndexElement.textContent = String(index);
  if (typeof index === "string") {
    // 名前つき変数の場合はホバーでタイトルチップ表示 (省略表記があるため)
    // 数字indexの変数の場合は、別途ラベルが出る可能性があるため出しません
    cardIndexElement.setAttribute("title", index);
  }
  const cardIndexLabelElement = UserVariableLabel.createElement();
  cardIndexElement.appendChild(cardIndexLabelElement);
  return { cardIndexElement, cardIndexLabelElement };
}

function createValueElement(value?: UserVar): HTMLElement {
  const valueElement = document.createElement("div");
  valueElement.classList.add("value");
  if (typeof value === "string") {
    // 値が文字列の場合はツールチップ表示 数字indexの場合でも出します
    valueElement.setAttribute("title", formatUserVarForDisplay(value));
  }

  setValue(valueElement, value);
  return valueElement;
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
  value?: UserVar 
): void {
  const content = formatUserVarForDisplay(value);
  if (element.textContent === content) {
    return;
  }
  element.textContent = value === undefined ? BLANK : formatUserVarForDisplay(value);
}

export function clearValue(element: HTMLElement) {
  element.textContent = BLANK;
}

function isTrimmingValue(value: unknown) {
  // object 形式は trimming するとすべての内容を見ることができない
  return typeof value !== "object";
}
