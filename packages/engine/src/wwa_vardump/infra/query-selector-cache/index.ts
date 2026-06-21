export interface Props {
    querySelector: (selector: string) => Element | null;
    querySelectorAll: (selector: string) => NodeListOf<Element>;
    clearCache: () => void;
}

export function createQuerySelectorCache({rootElement}: {rootElement: Element}): Props {
    const _rootElement = rootElement;
    const querySelectorCache = new Map<string, Element | null>();
    const querySelectorAllCache = new Map<string, NodeListOf<Element>>();
    return {
        querySelector: (selector: string): Element | null => {
            if (querySelectorCache.has(selector)) {
                return querySelectorCache.get(selector) || null;
            }
            const result = _rootElement.querySelector(selector);
            querySelectorCache.set(selector, result);
            return result;
        },
        querySelectorAll: (selector: string): NodeListOf<Element> => {
            if (querySelectorAllCache.has(selector)) {
                return querySelectorAllCache.get(selector);
            }
            const result = _rootElement.querySelectorAll(selector);
            querySelectorAllCache.set(selector, result);
            return result;
        },
        clearCache: () => {
            querySelectorCache.clear();
            querySelectorAllCache.clear();
        }
    };
};
