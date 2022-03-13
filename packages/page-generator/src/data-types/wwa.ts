export interface GameOption {
    isUrlGateEnabled?: boolean;
    isClassicMode?: boolean;
    isItemEffectEnabled?: boolean;
    useGoToWWA?: boolean;
    autoSave?: {
        intervalSteps: number;
    };
    useLookingAround?: boolean;
    varDump?: {
        elementId: string
    };
    isShowUserVariable?: boolean;
}

export interface Resources {
    mapData: string;
    audioDir?: string;
    wwaJs?: string;
    wwaCss?: string;
    titleImage?: string;
    userVarNamesFile?: string;
}
