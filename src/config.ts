import * as fs from "fs";
import * as path from "path";
import * as jsYaml from "js-yaml";
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
    concatDirAndFile: (dir: string, file: string) => string
}

interface WWAPageConfigWithDefaults {
    page: {
        template: string;
        title: string;
        isDevMode: boolean;
        wwa: WWAConfigWithDefaults;
        copyrights?: CopyrightWithDefaults[];
    };
}

export type WWAPageConfigForRendering = WWAPageConfigWithDefaults & {
    utils: Utils;
};

// TODO: TS型定義自動生成
// @see https://github.com/bcherny/json-schema-to-typescript
export interface WWAConfig {
    urlgateEnable?: boolean;
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
    page: {
        template?: string;
        title?: string;
        isDevMode?: boolean;
        wwa: WWAConfig;
        copyrights?: Copyright[]
    }
}

const schema = {
    properties: {
        page: {
            properties: {
                template: { type: "string" },
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
        },
        required: ["page"]
    }
};


function getDefaultConfig(): WWAPageConfigWithDefaults {
    return {
        page: {
            template: "../template/wwa.pug",
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
                    wwaCss: "wwa.css",
                    cryptoJsInDevMode: "cryptojs/aes.js"
                }
            }
        }
    }
};

export function fillDefaultsAndUtil(wwaPageConfig: WWAPageConfig): WWAPageConfigForRendering {
    return {
        ..._.merge(getDefaultConfig(), wwaPageConfig),
        utils: {
            thisYear: new Date().getFullYear(),
            concatDirAndFile: (dir, file) => `${dir}${dir.endsWith("/") ? "" : "/"}${file}`
        }
    };
}

export function getConfigFromFile(configFilePath: string): WWAPageConfigForRendering {
    let validationErrors: string[] = [];

    function validate(config: any): config is WWAPageConfig {
        const validateResult = jsonschema.validate(config, schema);
        validationErrors = validateResult.errors.map(e => e.message);
        return validateResult.valid;
    }

    const wwaPageConfig = jsYaml.safeLoad(
        fs.readFileSync(path.join(__dirname, path.normalize(configFilePath)), "utf8")
    );
    if (!wwaPageConfig) {
        throw new Error("jsyaml returns undefined.");
    }
    if (validate(wwaPageConfig)) {
        return fillDefaultsAndUtil(wwaPageConfig);
    }
    throw new Error(validationErrors[0]);
}
