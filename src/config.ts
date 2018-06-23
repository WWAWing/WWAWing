import * as config from "config";
import * as jsonschema from "jsonschema";

export interface WWAConfig {
    urlgateEnable: boolean;
    resources: {
        mapdata: string;
        loader: string;
        audio: {
            dir: string;
            js: string;
        };
        wwaJs: string;
        wwaCss: string;
        titleImg: string;
        cryptoJsInDevMode?: string;
    };
}

export interface Copyright {
    startYear: number;
    presentYear: number | "latest";
    product: {
        name: string;
        href: string;
    };
    credit: string;
    genre: string;
}

export interface WWAPageConfig {
    title: string;
    isDevMode?: boolean;
    wwa: WWAConfig;
    copyrights?: Copyright[]
}

const schema = {
    properties: {
        wwa: {
            urlgateEnable: { type: "boolean" },
            resources: {
                mapdata: { type: "string" },
                audio: {
                    dir: { type: "string" },
                    js: { type: "string" },
                },
                wwaJs: { type: "string" },
                wwaCss: { type: "string" },
                titleImg: { type: "string" },
                cryptoJsInDevMode: { type: "boolean" }
            }
        },
        copyright: {
            type: "array",
            items: {
                startYear: { type: "number" },
                presentYear: { type: "number" },
                credit: { type: "string" },
                product: {
                    name: { type: "string" },
                    href: { type: "string" }
                }
            }
        }
    },
};

export function readConfig(): WWAPageConfig {
    const wwaPageConfig = config.get("page");
    if (validate(wwaPageConfig)) {
        return wwaPageConfig;
    }
    throw new Error("ERROR");
}

export function validate(config: any): config is WWAPageConfig {
    const validateResult = jsonschema.validate(config, schema);
    console.log(validateResult);
    return validateResult.valid;
}
