import * as config from "config";
import * as jsonschema from "jsonschema";
import * as _ from "lodash";

interface WWAConfigWithDefaults {
    urlGateEnable: boolean;
    resources: {
        mapdata: string;
        loader: string;
        audio: {
            dir: string;
            js: string;
        };
        wwaJs: string;
        wwaCss: string;
        titleImg?: string;
        cryptoJsInDevMode?: string;
    };
}

interface CopyrightWithDefaults {
    range?: {
        firstYear: number;
        lastYear: number | "present";
    };
    product: {
        name: string;
        href: string;
    };
    credit: string;
    genre?: string;
}

interface Utils {
    thisYear: number;
    concatDirAndFile: (dir: string, file:string) => string
}

interface WWAPageConfigWithDefaults {
    title: string;
    isDevMode: boolean;
    wwa: WWAConfigWithDefaults;
    copyrights?: CopyrightWithDefaults[];
}

export type WWAPageConfigForRendering = WWAPageConfigWithDefaults & {
    utils: Utils;
};

// TODO: TS型定義自動生成
// @see https://github.com/bcherny/json-schema-to-typescript
export interface WWAConfig {
    urlgateEnable: boolean;
    resources?: {
        mapdata: string;
        loader?: string;
        audio?: {
            dir?: string;
            js?: string;
        };
        wwaJs?: string;
        wwaCss?: string;
        titleImg?: string;
        cryptoJsInDevMode?: string;
    };
}

export interface Copyright {
    range?: {
        firstYear: number;
        lastYear?: number | "present";
    },
    product: {
        name: string;
        href: string;
    };
    credit: string;
    genre?: string;
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
            properties: {
                urlgateEnable: { type: "boolean" },
                resources: {
                    properties: {
                        mapdata: { type: "string" },
                        audio: {
                            properties: {
                                dir: { type: "string" },
                                js: { type: "string" }
                            }
                        },
                        wwaJs: { type: "string" },
                        wwaCss: { type: "string" },
                        titleImg: { type: "string" },
                        cryptoJsInDevMode: { type: "string" }
                    },
                    required: ["mapdata"]
                }
            }
        },
        copyrights: {
            type: "array",
            items: {
                properties: {
                    range: {
                        properties: {
                            firstYear: { type: "number" },
                            lastYear: {
                                type: ["number", "string"],
                                pattern: "^present$"
                            }
                        },
                        required: ["firstYear"]
                    },
                    credit: { type: "string" },
                    product: {
                        properties: {
                            name: { type: "string" },
                            href: { type: "string" }
                        },
                        required: ["name", "href"]
                    },
                    required: ["startYear", "credit", "product"]
                }
            }
        }
    },
    required: ["wwa"]
};


const defaultConfig: WWAPageConfigWithDefaults = {
    title: "World Wide Adventure Wing",
    isDevMode: false,
    wwa: {
        urlGateEnable: true,
        resources: {
            mapdata: "mapdata.dat",
            loader: "wwaloader.js",
            audio: {
                dir: "audio/",
                js: "audio.min.js"
            },
            wwaJs: "wwa.js",
            wwaCss: "wwa.css"
        }
    }
};

function fillDefaultsAndUtil(wwaPageConfig: WWAPageConfig): WWAPageConfigForRendering {
    return {
        ..._.merge(wwaPageConfig, defaultConfig),
        utils: {
            thisYear: new Date().getFullYear(),
            concatDirAndFile: (dir, file) => `${dir}${dir.endsWith("/") ? "" : "/"}${file}`
        }
    };
}

export function readConfig(): WWAPageConfigWithDefaults {
    let validationErrors: string[] = [];

    function validate(config: any): config is WWAPageConfig {
        const validateResult = jsonschema.validate(config, schema);
        validationErrors = validateResult.errors.map(e => e.message);
        return validateResult.valid;
    }

    const wwaPageConfig = config.get("page");
    if (validate(wwaPageConfig)) {
        return fillDefaultsAndUtil(wwaPageConfig);
    }
    throw new Error(validationErrors[0]);
}
