export interface UserVarElementInfo {
    cardElement: HTMLElement;
    cardIndexElement: HTMLElement;
    cardIndexLabelElement: HTMLElement | null;
    cardValueElement: HTMLElement;
}

export interface Props {
    getAllNamedUserVarIndeciesSet: () => Set<string>;
    updateUserVarElementInfo: (index: number | string, elementInfo: UserVarElementInfo) => void;
    getUserVarElementInfo: (index: number | string) => UserVarElementInfo | null;
    deleteUserVarElementInfo: (index: number | string) => void;

    getUserVarListElement: (kind: "named" | "numbered") => HTMLElement | null;
    updateUserVarListElement: (kind: "named" | "numbered", element: HTMLElement) => void;
    deleteUserVarListElement: (kind: "named" | "numbered") => void;

    getNamedUserVarInformationElement: () => HTMLElement | null;
    updateNamedUserVarInformationElement: (element: HTMLElement) => void;
    deleteNamedUserVarInformationElement: () => void;

    dispose: () => void;
}

export function createElementStore(): Props {
    const numberedUserVarElementInfoMap = new Map<number, UserVarElementInfo>();
    const namedUserVarElementInfoMap = new Map<string, UserVarElementInfo>();
    const userVarListElementInfoMap = new Map<"named" | "numbered", HTMLElement>();
    let namedUserVarInformationElement: HTMLElement | null = null;

    return {
        getAllNamedUserVarIndeciesSet: (): Set<string> => {
            return new Set(namedUserVarElementInfoMap.keys());
        },
        updateUserVarElementInfo: (index: number | string, elementInfo: UserVarElementInfo): void => {
            if (typeof index === "number") {
                numberedUserVarElementInfoMap.set(index, elementInfo);
            } else if (typeof index === "string") {
                namedUserVarElementInfoMap.set(index, elementInfo);
            } else {
                throw new TypeError(`Invalid index: ${index satisfies never}`);
            }
        },
        getUserVarElementInfo: (index: number | string): UserVarElementInfo | null => {
            if (typeof index === "number") {
                return numberedUserVarElementInfoMap.get(index);
            } else if (typeof index === "string") {
                return namedUserVarElementInfoMap.get(index);
            } else {
                throw new TypeError(`Invalid index: ${index satisfies never}`);
            }
        },
        deleteUserVarElementInfo: (index: number | string): void => {
            if (typeof index === "number") {
                numberedUserVarElementInfoMap.delete(index);
            } else if (typeof index === "string") {
                namedUserVarElementInfoMap.delete(index);
            } else {
                throw new TypeError(`Invalid index: ${index satisfies never}`);
            }
        },
        getUserVarListElement: (kind: "named" | "numbered"): HTMLElement | null => {
            return userVarListElementInfoMap.get(kind);
        },
        updateUserVarListElement: (kind: "named" | "numbered", element: HTMLElement): void => {
            userVarListElementInfoMap.set(kind, element);
        },
        deleteUserVarListElement: (kind: "named" | "numbered"): void => {
            userVarListElementInfoMap.delete(kind);
        },
        getNamedUserVarInformationElement: (): HTMLElement | null => {
            return namedUserVarInformationElement;
        },
        updateNamedUserVarInformationElement: (element: HTMLElement): void => {
            namedUserVarInformationElement = element;
        },
        deleteNamedUserVarInformationElement: (): void => {
            namedUserVarInformationElement = null;
        },
        dispose: (): void => {
            numberedUserVarElementInfoMap.clear();
            namedUserVarElementInfoMap.clear();
            userVarListElementInfoMap.clear();
            namedUserVarInformationElement = null;
        }
    }
};
