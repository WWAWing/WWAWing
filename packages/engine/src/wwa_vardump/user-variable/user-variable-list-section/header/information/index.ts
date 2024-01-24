export const CLASS_NAME = "information";

export function createElemnt(): HTMLParagraphElement {
  const element = document.createElement("p");
  element.classList.add(CLASS_NAME);
  updateText(element, "強調されている番号にカーソルを乗せると説明が表示されます。");
  return element;
}

export function updateText(element: HTMLElement, text: string, isError: boolean = false): void {
  element.textContent = `${isError ? "【エラー】" : ""}${text}`;
}
