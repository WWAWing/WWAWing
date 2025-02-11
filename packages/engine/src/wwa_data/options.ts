import { DataWWAOptions } from "./typedef";

/**
 * data-wwa オプションのデフォルト値を設定します。
 * {@link WWA} でオプションを指定しない場合は、この関数の出力値が優先されます。
 */
export function makeDefaultWWAOptions(): DataWWAOptions {
    return {
        mapdata: "",
        urlGateEnable: false,
        titleImg: undefined,
        audioDir: "./audio/",
        classicModeEnable: false,
        itemEffectEnable: true,
        useGoToWwa: false,
        lookingAround: false,
        autoSave: true,
        disallowLoadOldSave: false,
        resumeSaveData: undefined,
        varDumpElm: undefined,
        userVarNamesFile: undefined,
        displayUserVars: false,
        virtualPadEnable: false,
        virtualPadViewportFitEnable: false,
        virtualPadControllerElm: undefined,
        userDefinedScriptsFile: "./script/script_file_list.json",
    };
}
