import { CacheCanvas } from "../wwa_cgmanager";
import { WWAConsts } from "../wwa_data";
import { MAX_PICTURE_LAYERS_COUNT } from "./config";
import { PictureItem, PictureRegistoryParts } from "./typedef";
import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { convertPictureRegistoryFromText } from "./utils";

/**
 * ピクチャ機能の表示や制御を行うクラスです。
 * 
 * # メッセージからピクチャを表示する場合
 * 1. 入力したテキストを基に登録する -> registPictureFromText
 * 2. 登録後の状態を wwaData に記録できるように出力する -> getPictureRegistoryData
 * 3. ピクチャの CacheCanvas を更新する -> updatePictures
 * 
 * # Quick Load でピクチャを読み込む場合
 * 1. 一旦ピクチャの内容をクリアする -> clearAllPictures
 * 2. 各ピクチャの登録情報を読み込む -> registPicture
 * 3. CacheCanvas を更新する -> updatePictures
 */
export default class WWAPicutre {
    private _pictures: Map<number, PictureItem>;
    constructor() {
        this._pictures = new Map();
    }

    public registPicture(registory: PictureRegistory) {
        if (registory.layerNumber > MAX_PICTURE_LAYERS_COUNT) {
            throw new Error(`ピクチャの最大レイヤー ${MAX_PICTURE_LAYERS_COUNT} の範囲を超えています。`);
        }
        const canvas = new CacheCanvas(
            WWAConsts.CHIP_SIZE * WWAConsts.H_PARTS_NUM_IN_WINDOW,
            WWAConsts.CHIP_SIZE * WWAConsts.V_PARTS_NUM_IN_WINDOW,
            true
        );
        this._pictures.set(registory.layerNumber, {
            ...registory,
            canvas,
        });
    }

    public registPictureFromText(registory: PictureRegistoryParts) {
        this.registPicture(convertPictureRegistoryFromText(registory));
    }

    public deletePicture(layerNumber: number) {
        if (!this._pictures.has(layerNumber)) {
            return;
        }
        this._pictures.get(layerNumber).canvas.clear();
        this._pictures.delete(layerNumber);
    }

    public clearAllPictures() {
        this._pictures.forEach(({ canvas }) => {
            canvas.clear();
        })
        this._pictures.clear();
    }

    public forEachPictures(caller: (picture: PictureItem) => void) {
        this._pictures.forEach(caller);
    }

    public updatePicturesCache(image: HTMLImageElement, isMainAnimation = true) {
        this.forEachPictures((picture) => {
            if (picture.layerNumber !== 0) {
                picture.canvas.clear();
            }
            const isDefineSubAnimation = picture.imgPosX2 !== 0 || picture.imgPosY2 !== 0;
            picture.canvas.drawCanvas(
                image,
                isMainAnimation || !isDefineSubAnimation ? picture.imgPosX : picture.imgPosX2,
                isMainAnimation || !isDefineSubAnimation ? picture.imgPosY : picture.imgPosY2,
                picture.properties.pos[0] ?? 0,
                picture.properties.pos[1] ?? 0,
            );
        })
    }

    public getPictureRegistoryData(): PictureRegistory[] {
        return Array.from(this._pictures.values()).map(({ canvas, ...item }) => item);
    }
}
