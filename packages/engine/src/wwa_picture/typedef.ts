import { PictureRegistry } from "@wwawing/common-interface/lib/wwa_data";
import { CacheCanvas } from "../wwa_cgmanager";
import { PartsType } from "@wwawing/loader";

export type PictureItem = PictureRegistry & { canvas: CacheCanvas; displayStockTime?: number; };

export type PictureRegistryParts = Omit<PictureRegistry, 'properties'> & { propertiesText: string };

export type PictureExternalImageItem = {
    status: "loading" | "success" | "failed",
    element?: HTMLImageElement
};

export type NextPicturePartsInfo = {
    layerNumber: number,
    partsNumber: number,
    partsType: PartsType,
    connectProperties: boolean,
};
