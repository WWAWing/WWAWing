import * as DataTypes from "../data-types";

export function generateOfficialCopyright(): DataTypes.Copyright {
    return {
        range: {
            firstYear: 1996,
            lastYear: 2016,
        },
        product: {
            genre: "Internet RPG",
            name: "World Wide Adventure",
            href: "https://wwajp.com/",
        },
        credit: "NAO",
    }
}

export function generateWWAWingCopyright(date: Date = new Date()): DataTypes.Copyright {
    return {
        range: {
            firstYear: 2013,
            // タイムゾーンによって最大1日誤差が出るが許容としたい
            lastYear: date.getFullYear(),
        },
        product: {
            name: "WWA Wing",
            href: "https://wwawing.com/",
        },
        credit: "WWA Wing Team",
    }
}

export function generateCopyrights(configCopyright: DataTypes.BuiltInCopyright | DataTypes.Copyright[] | undefined) {
    switch (configCopyright) {
        case undefined:
            return [];
        case "official-only":
            return [generateOfficialCopyright()];
        case "official-and-wing":
            return [generateOfficialCopyright(), generateWWAWingCopyright()];
        default:
            return configCopyright;
    }
}
