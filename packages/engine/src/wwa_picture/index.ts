import { CacheCanvas } from "../wwa_cgmanager";
import { Coord, PartsType, WWAConsts } from "../wwa_data";
import { MAX_PICTURE_LAYERS_COUNT, PicturePropertyDefinitions } from "./config";
import { PictureRegistoryParts } from "./typedef";
import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { convertPictureRegistoryFromText, convertVariablesFromRawRegistory } from "./utils";
import { WWA } from "../wwa_main";
import WWAPictureItem from "./WWAPictureItem";

/**
 * ピクチャ機能の表示や制御を行うクラスです。
 * 
 * # メッセージからピクチャを表示する場合
 * 1. 入力したテキストを基に登録する -> registerPictureFromText
 * 2. 登録後の状態を wwaData に記録できるように出力する -> getPictureRegistoryData
 * 3. ピクチャの CacheCanvas を更新する -> updatePictures
 * 
 * # Quick Load でピクチャを読み込む場合
 * 1. 一旦ピクチャの内容をクリアする -> clearAllPictures
 * 2. 各ピクチャの登録情報を読み込む -> registerPicture
 * 3. CacheCanvas を更新する -> updatePictures
 */
export default class WWAPicutre {
    private _wwa: WWA;
    private _pictures: Map<number, WWAPictureItem>;
    private _frameTimerValue: number;

    constructor(wwa: WWA) {
        this._wwa = wwa;
        this._pictures = new Map();
        this._frameTimerValue = WWAPicutre._getNowFrameValue();
    }

    private static _getNowFrameValue() {
        return performance.now();
    }

    public registerPicture(registory: PictureRegistory) {
        if (registory.layerNumber > MAX_PICTURE_LAYERS_COUNT) {
            throw new Error(`ピクチャの最大レイヤー ${MAX_PICTURE_LAYERS_COUNT} の範囲を超えています。`);
        }
        const canvas = new CacheCanvas(
            WWAConsts.CHIP_SIZE * WWAConsts.H_PARTS_NUM_IN_WINDOW,
            WWAConsts.CHIP_SIZE * WWAConsts.V_PARTS_NUM_IN_WINDOW,
            true
        );
        const invalidPropertyNames = Object.keys(registory.properties)
            .filter((propertyName) => !PicturePropertyDefinitions.some(({ name }) => name === propertyName));
        if (invalidPropertyNames.length > 0) {
            throw new Error(`不明なプロパティ名 ${invalidPropertyNames.map(str => `"${str}"`).join(", ")} が検出されました。`);
        }
        this._pictures.set(registory.layerNumber, new WWAPictureItem(registory, canvas));
    }

    /**
     * ピクチャをテキストデータから登録し、追加後のピクチャをデータにして返します。
     * プロパティの変換は WWAPicture クラス内で行われます。
     * @param regitory ピクチャの登録情報
     * @param targetPartsID 対象のパーツ番号
     * @param targetPartsType 対象のパーツ種類
     * @param triggerPartsPosition 実行元パーツの座標
     * @returns wwaData で使用できるピクチャの登録データ（配列形式）
     */
    public registerPictureFromText(
        registory: PictureRegistoryParts,
        targetPartsID: number,
        targetPartsType: PartsType,
        triggerPartsPosition: Coord
    ) {
        const rawRegistory = convertPictureRegistoryFromText(registory);
        this.registerPicture(convertVariablesFromRawRegistory(rawRegistory, this._wwa.generateTokenValues({
            id: targetPartsID,
            type: targetPartsType,
            position: triggerPartsPosition
        })));
        return this.getPictureRegistoryData();
    }

    /**
     * ピクチャの登録を削除し、削除後のピクチャをデータにして返します。
     * @param layerNumber 削除したいレイヤーの番号
     * @returns wwaData で使用できるピクチャの登録データ（配列形式）
     */
    public deletePicture(layerNumber: number) {
        if (!this._pictures.has(layerNumber)) {
            return;
        }
        this._pictures.get(layerNumber).clearCanvas();
        this._pictures.delete(layerNumber);
        return this.getPictureRegistoryData();
    }

    public clearAllPictures() {
        this._pictures.forEach((picture) => {
            picture.clearCanvas();
        })
        this._pictures.clear();
    }

    public forEachPictures(caller: (picture: WWAPictureItem) => void) {
        this._pictures.forEach(caller);
    }

    public updatePicturesCache(image: HTMLImageElement, isMainAnimation: boolean) {
        this.forEachPictures((picture) => {
            // layerNumber が 0 の場合はいわゆる無名ピクチャという扱いのため、既存のピクチャ定義を上書きしない挙動となっている。
            // このことを想定して、 canvas のクリアを除外しているのだが、これだと変化前の画像データが残ってしまうことになる。
            // TODO WWAeval の実装では無名ピクチャをどのように実装しているのかソースを確認する
            if (picture.layerNumber !== 0) {
                picture.clearCanvas();
            }
            picture.draw(image, isMainAnimation);
        })
    }

    /**
     * decrementPictureDisplayTimeStock の後に実行するようにしてください。
     * メッセージ表示中においても常時実行する必要があります。
     */
    public updateFrameTimerValue() {
        this._frameTimerValue = WWAPicutre._getNowFrameValue();
    }

    public decrementPictureDisplayTimeStock() {
        const newFrameValue = WWAPicutre._getNowFrameValue();
        const frameMs = newFrameValue - this._frameTimerValue;
        this.forEachPictures(picture => {
            if (!picture.hasDisplayTimeStock()) {
                return;
            }
            picture.decrementDisplayTimeStock(frameMs);
            if (picture.isDeadlineOver()) {
                this.deletePicture(picture.layerNumber);
            }
        });
    }

    public getPictureRegistoryData(): PictureRegistory[] {
        return Array.from(this._pictures.values()).map(picture => picture.getRegistoryData());
    }
}
