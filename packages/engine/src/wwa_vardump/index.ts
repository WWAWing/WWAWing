import { $qs } from "../wwa_util";

import * as UserVariableViewer from "./user-variable-viewer";
import * as UserVariableViewerSection from "./user-variable-viewer-section";
import {
  INFORMATION_SELECTOR,
  USER_VARIABLE_VIEWER_SELECTOR,
} from "./constants";

export * from "./apis";
export * from "./constants";
export { UserVariableViewer, UserVariableViewerSection };

export const CLASS_NAME = "wwa-vardump-wrapper";

export function setup(dumpElmQuery: string): HTMLElement | null {
  const element = $qs(dumpElmQuery);
  if (!(element instanceof HTMLElement)) {
    // 要素がない場合は何もしない
    return null;
  }

  element.classList.add(CLASS_NAME);
  element.appendChild(
    UserVariableViewerSection.createElement({
      header: {
        contentVisibilityToggleButton: {
          onClick: (event) => {
            const viewerElement = element.querySelector(
              USER_VARIABLE_VIEWER_SELECTOR
            );
            const informationElm = element.querySelector(INFORMATION_SELECTOR);
            if (
              !(viewerElement instanceof HTMLElement) ||
              !(informationElm instanceof HTMLElement) ||
              !(event.target instanceof HTMLElement)
            ) {
              return;
            }
            if (viewerElement.getAttribute("aria-hidden") === "true") {
              viewerElement.removeAttribute("aria-hidden");
              informationElm.removeAttribute("aria-hidden");
              UserVariableViewerSection.Header.setContentVisibilityToggleButtonText(
                event.target,
                true
              );
            } else {
              viewerElement.setAttribute("aria-hidden", "true");
              informationElm.setAttribute("aria-hidden", "true");
              UserVariableViewerSection.Header.setContentVisibilityToggleButtonText(
                event.target,
                false
              );
            }
          },
        },
      },
    })
  );

  return element;
}
