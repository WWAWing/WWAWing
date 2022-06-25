export interface GameOption {
    isUrlGateEnabled?: boolean;
    isClassicMode?: boolean;
    isItemEffectEnabled?: boolean;
    useGoToWWA?: boolean;
    autoSave?: {
        intervalSteps: number;
    };
    useLookingAround?: boolean;
    userVars?: {
        dumpElementId: string
        canDisplay?: boolean
    },
    virtualPad?: {
        controllerId: string;
    },
}

export interface Resources {
    mapData: string;
    audioDir?: string;
    wwaJs?: string;
    wwaCss?: string;
    titleImage?: string;
    userVarNamesFile?: string;
}
