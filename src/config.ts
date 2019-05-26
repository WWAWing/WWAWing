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
        };
        wwaJs: string;
        wwaCss: string;
        titleImg?: string;
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
        additionalCssFiles?: string[];
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
        };
        wwaJs?: string;
        wwaCss?: string;
        titleImg?: string;
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
        additionalCssFiles?: string[];
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
                                    }
                                },
                                wwaJs: { type: "string" },
                                wwaCss: { type: "string" },
                                titleImg: { type: "string" },
                            },
                            required: ["mapdata"]
                        }
                    }
                },
                additionalCssFiles: {
                    type: "array",
                    items: { type: "string" }
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
            additionalCssFiles: [
                "style.css"
            ],
            wwa: {
                urlGateEnable: true,
                resources: {
                    mapdata: "mapdata.dat",
                    loader: "wwaload.js",
                    audio: {
                        dir: "audio/",
                    },
                    wwaJs: "wwa.js",
                    wwaCss: "wwa.css",
                }
            }
        }
    }
};

export function getDefaultCopyrights(): Copyright[] {
    return [
        {
            range: {
                firstYear: 1996,
                lastYear: 2016
            },
            product: {
                name: "World Wide Adventure",
                href: "http://wwajp.com/"
            },
            credit: "NAO",
            genre: "Internet RPG"
        },
        {
            range: {
                firstYear: 2013,
                lastYear: "present"
            },
            product: {
                name: "WWA Wing",
                href: "https://wwawing.com/"
            },
            credit: "WWA Wing Team",
        }
    ]
}

export function fillDefaultsAndUtil(wwaPageConfig: WWAPageConfig, overwriteDefaultCopyrights: boolean = false): WWAPageConfigForRendering {
    if (overwriteDefaultCopyrights) {
        wwaPageConfig.page.copyrights = getDefaultCopyrights();
    }
    return {
        ..._.merge(getDefaultConfig(), wwaPageConfig),
        utils: {
            thisYear: new Date().getFullYear(),
            concatDirAndFile: (dir, file) => `${dir}${dir.endsWith("/") ? "" : "/"}${file}`
        }
    };
}

export function getConfigFromFile(configFilePath: string, overwriteDefaultCopyrights: boolean = false): WWAPageConfigForRendering {
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
        return fillDefaultsAndUtil(wwaPageConfig, overwriteDefaultCopyrights);
    }
    throw new Error(validationErrors[0]);
}
