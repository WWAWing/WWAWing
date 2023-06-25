import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { CacheCanvas } from "../wwa_cgmanager";

export type PictureItem = PictureRegistory & { canvas: CacheCanvas; displayStockTime?: number; };

export type PictureRegistoryParts = Omit<PictureRegistory, 'properties'> & { propertiesText: string };
