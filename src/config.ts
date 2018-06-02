export interface WWAConfig {
    mapdata: string;
    loader?: string;
    audioDir?: string;
    urlgateEnable?: "false";
    titleImg?: string;
}

export interface Copyright {
    startYear: number;
    presentYear: number;
    product: {
        name: string;
        href: string;
    }
    credit: string;
    genre?: string;
}

export interface WWAPageConfig {
    title?: string;
    wwa: WWAConfig;
    copyright?: {
        wwa: Copyright;
        wing: Copyright;
    };
    mode?: "production" | "development";
}

const defaultPageConfig: WWAPageConfig = {
    title: "World Wide Adventure Wing",
    mode: "production",
    wwa: {
        mapdata: "mapdata.dat"
    },
    copyright: {
        wwa: {
            startYear: 1996,
            presentYear: 2016,
            credit: "NAO",
            product: {
                name: "World Wide Adventure",
                href: "http://wwajp.com/"
            },
            genre: "Internet RPG"
        },
        wing: {
            startYear: 2013,
            presentYear: new Date().getFullYear(),
            credit: "WWA Wing Team",
            product: {
                name: "WWA Wing",
                href: "https://www.wwawing.com/"
            }
        }
    }
};

export function fillDefaultConfig(customPageConfig: WWAPageConfig) {
    return {
        ...defaultPageConfig,
        ...customPageConfig
    };
}
