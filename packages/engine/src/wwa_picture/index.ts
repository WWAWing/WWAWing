import { PictureProperties } from "@wwawing/common-interface/lib/wwa_picture";
import { CacheCanvas } from "../wwa_cgmanager";
import { WWAConsts } from "../wwa_data";
import { MAX_PICTURE_LAYERS_COUNT } from "./config";
import { PictureItem, PictureRegistoryParts } from "./typedef";

export default class WWAPicutre {
    private _pictures: Map<number, PictureItem>;
    constructor() {
        this._pictures = new Map();
    }

    // TODO フォーマットは後々変わる可能性あり
    public registPicture(registory: PictureRegistoryParts) {
        try {
            if (registory.layerNumber > MAX_PICTURE_LAYERS_COUNT) {
                throw new Error(`ピクチャの最大レイヤー ${MAX_PICTURE_LAYERS_COUNT} の範囲を超えています。`);
            }

            const jsonObject = JSON.parse(registory.propertiesText);
            if (Array.isArray(jsonObject)) {
                throw new Error("配列形式ではなくオブジェクト形式で記述してください。");
            }
            if (typeof jsonObject !== 'object') {
                throw new Error("オブジェクト形式で記述してください。");
            }
            const canvas = new CacheCanvas(
                WWAConsts.CHIP_SIZE * WWAConsts.H_PARTS_NUM_IN_WINDOW,
                WWAConsts.CHIP_SIZE * WWAConsts.V_PARTS_NUM_IN_WINDOW,
                true
            );
            this._pictures.set(registory.layerNumber, {
                ...registory,
                canvas,
                properties: jsonObject as PictureProperties
            });
        } catch (e) {
            // TODO 構文エラーなど出せるようにしたい
        }
    }

    public deletePicture(layerNumber: number) {
        if (!this._pictures.has(layerNumber)) {
            return;
        }
        this._pictures.get(layerNumber).canvas.clear();
        this._pictures.delete(layerNumber);
    }

    public forEachPictures(caller: (picture: PictureItem) => void) {
        this._pictures.forEach((picture) => {
            if (picture === null) {
                return;
            }
            caller(picture);
        });
    }

    public updatePictures(image: HTMLImageElement) {
        this.forEachPictures((picture) => {
            if (picture.layerNumber !== 0) {
                picture.canvas.clear();
            }
            picture.canvas.drawCanvas(
                image,
                picture.imgPosX,
                picture.imgPosY,
                picture.properties.pos[0] ?? 0,
                picture.properties.pos[1] ?? 0,
            );
        })
    }
}
