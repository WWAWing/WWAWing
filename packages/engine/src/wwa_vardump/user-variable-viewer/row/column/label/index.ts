export const CLASS_NAME = "label";

export function createElement(): HTMLElement {
  const element = document.createElement("div");
  element.textContent = "-";
  element.setAttribute("aria-hidden", "true");
  element.classList.add(CLASS_NAME);
  return element;
}

export function setText(element: HTMLElement, text: string): void {
  element.textContent = text;
}
