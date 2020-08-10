export interface GameOption {
    isUrlGateEnabled?: boolean;
    isClassicMode?: boolean;
    isItemEffectEnabled?: boolean;
    useGoToWWA?: boolean;
    useLookingAround?: boolean;
}

export interface Resources {
    mapData: string;
    audioDir?: string;
    wwaJs?: string;
    wwaCss?: string;
    titleImage?: string;
}
