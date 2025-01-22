/**
 * data-wwa オプションのすべてを列挙した interface です。
 * このオブジェクトがそのまま {@link WWA} コンストラクターの引数に使用されます。
 * {@link WWA} コンストラクターでは使用しないオプションもあります。詳しくは wwa_main.ts の start 関数の実装をご確認ください。
 */
export interface DataWWAOptions {
    mapdata: string;
    urlGateEnable?: boolean;
    titleImg?: string;
    audioDir?: string;
    classicModeEnable?: boolean;
    itemEffectEnable?: boolean;
    useGoToWwa?: boolean;
    lookingAround?: boolean;
    autoSave?: boolean;
    disallowLoadOldSave?: boolean;
    resumeSaveData?: string;
    varDumpElm?: HTMLElement;
    userVarNamesFile?: string;
    displayUserVars?: boolean;
    virtualPadEnable?: boolean;
    virtualPadViewportFitEnable?: boolean;
    virtualPadControllerElm?: HTMLElement;
}
