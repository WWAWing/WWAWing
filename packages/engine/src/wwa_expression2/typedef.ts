import { Face } from "../wwa_data"

interface PageAdditionalFaceItem {
    type: "face",
    data: {
        face: Face,
    }
};

export type PageAdditionalItem = PageAdditionalFaceItem;
