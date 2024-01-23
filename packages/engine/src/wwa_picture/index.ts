import { CacheCanvas } from "../wwa_cgmanager";
import { Coord, PartsType, WWAConsts } from "../wwa_data";
import { PicturePropertyDefinitions } from "./config";
import { PictureRegistryParts } from "./typedef";
import { PictureRegistry } from "@wwawing/common-interface/lib/wwa_data";
import { convertPictureRegistryFromText, convertVariablesFromRawRegistry } from "./utils";
import { WWA } from "../wwa_main";
import WWAPictureItem from "./WWAPictureItem";

/**
 * ピクチャ機能の表示や制御を行うクラスです。
 * 
 * # メッセージからピクチャを表示する場合
 * 1. 入力したテキストを基に登録する -> registerPictureFromText
 * 2. 登録後の状態を wwaData に記録できるように出力する -> getPictureRegistryData
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

    public registerPicture(registry: PictureRegistry) {
        const canvas = new CacheCanvas(
            WWAConsts.CHIP_SIZE * WWAConsts.H_PARTS_NUM_IN_WINDOW,
            WWAConsts.CHIP_SIZE * WWAConsts.V_PARTS_NUM_IN_WINDOW,
            true
        );
        const invalidPropertyNames = Object.keys(registry.properties)
            .filter((propertyName) => !PicturePropertyDefinitions.some(({ name }) => name === propertyName));
        if (invalidPropertyNames.length > 0) {
            throw new Error(`不明なプロパティ名 ${invalidPropertyNames.map(str => `"${str}"`).join(", ")} が検出されました。`);
        }
        this._pictures.set(registry.layerNumber, new WWAPictureItem(registry, canvas));
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
        registry: PictureRegistryParts,
        targetPartsID: number,
        targetPartsType: PartsType,
    ) {
        const rawRegistry = convertPictureRegistryFromText(registry);
        this.registerPicture(convertVariablesFromRawRegistry(rawRegistry, this._wwa.generateTokenValues({
            id: targetPartsID,
            type: targetPartsType,
            position: new Coord(registry.triggerPartsX, registry.triggerPartsY)
        })));
        return this.getPictureRegistryData();
    }

    /**
     * ピクチャの登録を削除し、削除後のピクチャをデータにして返します。
     * @param layerNumber 削除したいレイヤーの番号
     * @returns wwaData で使用できるピクチャの登録データ（配列形式）
     */
    public deletePicture(layerNumber: number) {
        if (!this._pictures.has(layerNumber)) {
            console.warn(`${layerNumber} 番のピクチャが見つかりませんでした。`)
            return;
        }
        this._pictures.get(layerNumber).clearCanvas();
        this._pictures.delete(layerNumber);
        return this.getPictureRegistryData();
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
                const layerNumber = picture.layerNumber;
                const nextPictureNumber = picture.nextPictureNumber;
                const triggerPartsCoord = picture.getTriggerPartsCoord();
                this.deletePicture(layerNumber);
                if (nextPictureNumber?.[0] !== undefined) {
                    // TODO 座標を算出したい
                    this._wwa.setPictureRegistry(
                        layerNumber,
                        nextPictureNumber[0],
                        nextPictureNumber[1] ?? PartsType.OBJECT,
                        triggerPartsCoord
                    );
                }
                // TODO map プロパティの機能を実装する
            }
        });
    }

    public getPictureRegistryData(): PictureRegistry[] {
        return Array.from(this._pictures.values()).map(picture => picture.getRegistryData());
    }
}
