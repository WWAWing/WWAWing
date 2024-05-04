import * as pug from "pug";
import * as path from "path";
import * as DataTypes from "./data-types";
import * as Helper from "./helper";

export interface InputConfig {
    page?: DataTypes.Page;
    wwa: {
        gameOption?: DataTypes.GameOption;
        resources: DataTypes.Resources;
        resumeSaveData?: string;
    };
    copyrights?: DataTypes.BuiltInCopyright | DataTypes.Copyright[];
}

export interface TemplateValues {
    head: {
        pageTitle: string;
        additionalCssFiles?: string[];
        wwaCss: string;
        wwaJs: string;
    }
    wwa: {
        attributes: {
            "data-wwa-mapdata": string;
            "data-wwa-urlgate-enable": DataTypes.StringBoolean;
            "data-wwa-title-img"?: string;
            "data-wwa-audio-dir"?: string;
            "data-wwa-classic-mode-enable"?: DataTypes.StringBoolean;
            "data-wwa-item-effect-enable"?: DataTypes.StringBoolean;
            "data-wwa-use-go-to-wwa"?: DataTypes.StringBoolean;
            "data-wwa-looking-around"?: DataTypes.StringBoolean;
            "data-wwa-autosave"?: string;
            "data-wwa-resume-savedata"?: string;
            "data-wwa-var-dump-elm"?: string;
            "data-wwa-user-var-names-file"?: string;
            "data-wwa-display-user-vars"?: string;
            "data-wwa-virtualpad-enable"?: string;
            "data-wwa-virtualpad-viewport-fit-enable"?: string;
            "data-wwa-virtualpad-controller-elm"?: string;
        };
    };
    debugConsoleElement?: {
        id: string;
    }
    varDumpElement?: {
        id: string;
    };
    virtualPadController?: {
        id: string;
    },
    footer: {
        copyrights?: DataTypes.Copyright[]
    }
}

function generateTemplateValues({page, wwa, copyrights}: InputConfig): TemplateValues {
    return {
        head: {
            pageTitle: page?.title || "World Wide Adventure Wing",
            additionalCssFiles: page?.additionalCssFiles || [],
            wwaCss: wwa.resources.wwaCss || "wwa.css",
            wwaJs: wwa.resources.wwaJs || "wwa.js"
        },
        wwa: {
            attributes: {
                "data-wwa-mapdata": wwa.resources.mapData,
                "data-wwa-urlgate-enable": Helper.toStringBoolean(wwa.gameOption?.isUrlGateEnabled || true),
                "data-wwa-title-img": wwa.resources.titleImage,
                "data-wwa-audio-dir": wwa.resources.audioDir,
                "data-wwa-classic-mode-enable": Helper.toStringBooleanOptional(wwa.gameOption?.isClassicMode),
                "data-wwa-item-effect-enable": Helper.toStringBooleanOptional(wwa.gameOption?.isItemEffectEnabled),
                "data-wwa-use-go-to-wwa": Helper.toStringBooleanOptional(wwa.gameOption?.useGoToWWA),
                "data-wwa-looking-around": Helper.toStringBooleanOptional(wwa.gameOption?.useLookingAround),
                "data-wwa-autosave": `${wwa.gameOption?.autoSave?.intervalSteps ?? "0"}`,
                "data-wwa-resume-savedata": wwa.resumeSaveData,
                "data-wwa-var-dump-elm": wwa.gameOption?.userVars?.dumpElementId ? `#${wwa.gameOption.userVars.dumpElementId}` : undefined,
                "data-wwa-user-var-names-file": wwa.resources.userVarNamesFile,
                "data-wwa-display-user-vars": Helper.toStringBooleanOptional(wwa.gameOption?.userVars?.canDisplay),
                "data-wwa-virtualpad-enable": Helper.toStringBooleanOptional(wwa.gameOption?.virtualPad?.enable),
                "data-wwa-virtualpad-viewport-fit-enable": Helper.toStringBooleanOptional(wwa.gameOption?.virtualPad?.viewportFitEnable),
                "data-wwa-virtualpad-controller-elm": wwa.gameOption?.virtualPad?.controllerId ? `#${wwa.gameOption.virtualPad.controllerId}` : undefined,
            }
        },
        // HACK: デバッグコンソールエリアの要素名は変更できるようにする
        debugConsoleElement: wwa.gameOption?.debugConsole ? { id: "wwa-debug-console-area" } : undefined,
        varDumpElement: wwa.gameOption?.userVars?.dumpElementId ? { id: wwa.gameOption.userVars.dumpElementId } : undefined,
        virtualPadController: wwa.gameOption?.virtualPad?.controllerId ? { id: wwa.gameOption.virtualPad.controllerId } : undefined,
        footer: {
            copyrights: Helper.generateCopyrights(copyrights)
        }
    };
}

export function render(config: InputConfig) {
  const templateValues = generateTemplateValues(config);
  const pugFilePath = path.join(__dirname, "wwa.pug");
  const compileTemplate = pug.compileFile(pugFilePath, { pretty: true });
  return compileTemplate(templateValues) + "\n";
}
