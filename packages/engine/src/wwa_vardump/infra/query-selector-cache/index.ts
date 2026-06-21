export interface Props {
    querySelector: (selector: string) => Element | null;
    querySelectorWithSpecifiedElement: (element: Element, selector: string) => Element | null;
    querySelectorAll: (selector: string) => NodeListOf<Element>;
    querySelectorAllWithSpecifiedElement: (element: Element, selector: string) => NodeListOf<Element>;
}

export interface CacheProps {
    querySelector: (selector: string) => Element | null;
    querySelectorAll: (selector: string) => NodeListOf<Element>;
    clearCache: () => void;
}

export function createQuerySelectorCaches(defaultRootElement: Element): Props {
    const cacheMap = new WeakMap<Element, CacheProps>();
    return {
        querySelector: (selector: string): Element | null => {
            return querySelectorInternal(defaultRootElement, selector, cacheMap);
        },
        querySelectorAll: (selector: string): NodeListOf<Element> => {
            return querySelectorAllInternal(defaultRootElement, selector, cacheMap);
        },
        querySelectorWithSpecifiedElement: (element: Element, selector: string): Element | null => {
            return querySelectorInternal(element, selector, cacheMap);
        },
        querySelectorAllWithSpecifiedElement: (element: Element, selector: string): NodeListOf<Element> => {
            return querySelectorAllInternal(element, selector, cacheMap);
        }
    };
};

function querySelectorInternal(rootElement: Element, selector: string, cacheMap: WeakMap<Element, CacheProps>): Element | null {
    if (cacheMap.has(rootElement)) {
        const cache = cacheMap.get(rootElement);
        return cache.querySelector(selector);
    }
    cacheMap.set(rootElement, createQuerySelectorCacheForElement(rootElement));
    return cacheMap.get(rootElement).querySelector(selector);
}

function querySelectorAllInternal(rootElement: Element, selector: string, cacheMap: WeakMap<Element, CacheProps>): NodeListOf<Element> {
    if (cacheMap.has(rootElement)) {
        const cache = cacheMap.get(rootElement);
        return cache.querySelectorAll(selector);
    }
    cacheMap.set(rootElement, createQuerySelectorCacheForElement(rootElement));
    return cacheMap.get(rootElement).querySelectorAll(selector);
}


function createQuerySelectorCacheForElement(rootElement: Element) : CacheProps {
    const querySelectorCache = new Map<string, Element | null>();
    const querySelectorAllCache = new Map<string, NodeListOf<Element>>();
    return {
        querySelector: (selector: string): Element | null => {
            if (querySelectorCache.has(selector)) {
                return querySelectorCache.get(selector) || null;
            }
            const result = rootElement.querySelector(selector);
            querySelectorCache.set(selector, result);
            return result;
        },
        querySelectorAll: (selector: string): NodeListOf<Element> => {
            if (querySelectorAllCache.has(selector)) {
                return querySelectorAllCache.get(selector);
            }
            const result = rootElement.querySelectorAll(selector);
            querySelectorAllCache.set(selector, result);
            return result;
        },
        clearCache: () => {
            querySelectorCache.clear();
            querySelectorAllCache.clear();
        }
    };
}
