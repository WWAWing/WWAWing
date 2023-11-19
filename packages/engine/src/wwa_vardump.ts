import { WWAConsts as Consts } from "./wwa_data";
import { $qs, formatUserVarForDisplay } from "./wwa_util";

const INFORMATION_CLASS_NAME = "varlist-information";
const INFORMATION_SELECTOR = `.${INFORMATION_CLASS_NAME}`

export function setup(dumpElmQuery: string): HTMLElement | null {
  const dumpElm = $qs(dumpElmQuery) as HTMLElement | null;
  if (!dumpElm) {
    // 要素がない場合は何もしない
    return null;
  }
  dumpElm.classList.add("wwa-vardump-wrapper");
  const tableElm = document.createElement("table");
  const headerTrElm = document.createElement("tr");
  const headerThElm = document.createElement("th");
  const hideButton = document.createElement("button");
  const informationElm = document.createElement("td");
  hideButton.textContent = "隠す";
  headerThElm.textContent = "変数一覧";
  headerThElm.setAttribute("colspan", "10");
  headerThElm.classList.add("varlist-header");
  headerThElm.appendChild(hideButton);
  headerTrElm.appendChild(headerThElm);
  informationElm.setAttribute("colspan", "10");
  informationElm.classList.add(INFORMATION_CLASS_NAME);
  informationElm.textContent =
    "強調されている番号にカーソルを乗せると説明が表示されます。";
  tableElm.appendChild(headerTrElm);
  tableElm.appendChild(informationElm);
  let trNumElm: HTMLElement = null;
  let trValElm: HTMLElement = null;
  for (let i = 0; i < Consts.USER_VAR_NUM; i++) {
    if (i % 10 === 0) {
      if (trNumElm !== null) {
        tableElm.appendChild(trNumElm);
        tableElm.appendChild(trValElm);
      }
      trNumElm = document.createElement("tr");
      trNumElm.classList.add("var-number");
      trValElm = document.createElement("tr");
      trValElm.classList.add("var-val");
    }
    const thNumElm = document.createElement("th");
    const varLabelElm = document.createElement("div");
    varLabelElm.textContent = "-";
    varLabelElm.setAttribute("aria-hidden", "true");
    thNumElm.classList.add(generateVarIndexClassName(i));
    const tdValElm = document.createElement("td");
    thNumElm.textContent = i + "";
    thNumElm.appendChild(varLabelElm);
    tdValElm.classList.add(generateVarValueClassname(i));
    tdValElm.textContent = "-";
    trNumElm.appendChild(thNumElm);
    trValElm.appendChild(tdValElm);
  }
  if (Consts.USER_VAR_NUM % 10 !== 0) {
    tableElm.appendChild(trNumElm);
    tableElm.appendChild(trValElm);
  }
  dumpElm.appendChild(tableElm);
  let varDispStatus = true;
  hideButton.addEventListener("click", () => {
    if (varDispStatus) {
      this.textContent = "表示";
      informationElm.style.display = "none";
      Array.prototype.forEach.call(
        tableElm.querySelectorAll("tr.var-number"),
        function (etr) {
          etr.style.display = "none";
        }
      );
      Array.prototype.forEach.call(
        tableElm.querySelectorAll("tr.var-val"),
        function (etr) {
          etr.style.display = "none";
        }
      );
      varDispStatus = false;
    } else {
      this.textContent = "隠す";
      informationElm.style.display = "";
      Array.prototype.forEach.call(
        tableElm.querySelectorAll("tr.var-number"),
        function (etr) {
          etr.style.display = "";
        }
      );
      Array.prototype.forEach.call(
        tableElm.querySelectorAll("tr.var-val"),
        function (etr) {
          etr.style.display = "";
        }
      );
      varDispStatus = true;
    }
  });
  return dumpElm;
}

export function updateValues(dumpElement: HTMLElement | undefined | null, userVar: (number | string | boolean)[]) {
  if (!dumpElement) {
    return;
  }
  for (let i = 0; i < Consts.USER_VAR_NUM; i++) {
    dumpElement.querySelector(`.${generateVarValueClassname(i)}`).textContent = formatUserVarForDisplay(userVar[i]);
  }
}

export function updateLabels(dumpElement: HTMLElement | undefined | null, userVarNameList: string[]) {
  if(!dumpElement) {
    return;
  }
  // 以下は変数一覧に変数名を流し込む処理
  for (let i = 0; i < Consts.USER_VAR_NUM; i++) {
    if (!userVarNameList[i]) {
      continue;
    }
    const varIndexQuery = `.${generateVarIndexClassName(i)}`;
    const varIndexElement = dumpElement.querySelector(varIndexQuery);
    const varLabelElement = varIndexElement.querySelector(
      `${varIndexQuery} > div`
    );
    varLabelElement.textContent = userVarNameList[i];
    varIndexElement.setAttribute("data-labelled-var-index", "true");
    varIndexElement.addEventListener("mouseover", () =>
      varLabelElement.removeAttribute("aria-hidden")
    );
    varIndexElement.addEventListener("mouseleave", () =>
      varLabelElement.setAttribute("aria-hidden", "true")
    );
  }
}

export function updateInformation(
  dumpElement: HTMLElement | undefined | null,
  content: string,
  isError: boolean = false
) {
  if(!dumpElement){
    return;
  }
  const elm = dumpElement.querySelector(INFORMATION_SELECTOR);
  if (!elm) {
    return;
  }
  elm.textContent = `${isError ? "【エラー】" : ""}${content}`;
}

function generateVarIndexClassName(index: number): string {
  return `var-index${index}`;
}

function generateVarValueClassname(index: number): string {
  return `var${index}`;
}


