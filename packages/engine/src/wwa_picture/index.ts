import { CacheCanvas } from "../wwa_cgmanager";
import { Coord, PartsType, WWAConsts } from "../wwa_data";
import { PicturePropertyDefinitions } from "./config";
import { PictureRegistryParts } from "./typedef";
import { PictureRegistry } from "@wwawing/common-interface/lib/wwa_data";
import { checkValuesFromRawRegistry, convertPictureRegistryFromText, convertVariablesFromRawRegistry } from "./utils";
import { WWA } from "../wwa_main";
import WWAPictureItem from "./WWAPictureItem";
import { fetchJsonFile } from "../json_api_client";

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
    private _externalImageFiles: Map<string, HTMLImageElement>;
    private _frameTimerValue: number;

    constructor(wwa: WWA, pictureImageNamesFile: string | null) {
        this._wwa = wwa;
        this._pictures = new Map();
        this._externalImageFiles = new Map();
        this._frameTimerValue = WWAPicutre._getNowFrameValue();
        this._setupExternalImageFiles(pictureImageNamesFile);
    }

    private async _setupExternalImageFiles(pictureImageNamesFile: string | null) {
        if (!pictureImageNamesFile) {
            return;
        }
        const status = await fetchJsonFile(pictureImageNamesFile);
        if (!status) {
            return;
        }
        if (status.kind !== "data") {
            alert(`ピクチャ画像の定義ファイル ${pictureImageNamesFile} が見つかりませんでした。エラーメッセージ: ${status.errorMessage}`);
            return;
        }
        if (!status.data || typeof status.data !== "object") {
            alert(`ピクチャ画像の定義ファイル ${pictureImageNamesFile} が正しい形式で書かれていません。`);
            return;
        }
        if ("files" in status.data) {
            const { files } = status.data;
            if (typeof files === "object") {
                Object.entries(status.data.files).forEach(([name, path]) => {
                    const element = new Image();
                    element.src = path;
                    element.onerror = (err) => {
                        alert(`ピクチャ画像ファイル ${path} が見つかりませんでした。エラーメッセージ: ${err.toString()}`);
                    };
                    this._externalImageFiles.set(name, element);
                });
            } else {
                alert(`ピクチャ画像の定義ファイル ${pictureImageNamesFile} の files が正しい形式で書かれていません。`);
            }
        }
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
        const externalImageFile = registry.properties.imgFile
            ? this._externalImageFiles.get(registry.properties.imgFile)
            : undefined;
        if (registry.properties.imgFile && !externalImageFile) {
            console.warn(`ピクチャ画像ファイル ${registry.properties.imgFile} が定義に含まれていません。定義ファイルがあるかご確認ください。`);
        }
        this._pictures.set(registry.layerNumber, new WWAPictureItem(registry, canvas, externalImageFile));
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
     * ピクチャをテキストデータから登録し、追加後のピクチャをデータにして返します。
     * プロパティは変換されずそのままの値として評価されます。外部のシステムで JSON テキストを評価している場合に使用します。
     *
     * その際含まれないパーツ定義についてはすべて 0 として扱います。
     * imgPos 関連については img プロパティで補填してください。
     * triggerParts 関連についてはシステム上対応できません。
     * @param text プロパティが記載された JSON テキスト
     */
    public registerPictureFromRawText(
        layerNumber: number,
        propertiesText: string
    ) {
        const registry = convertPictureRegistryFromText({
            imgPosX: 0,
            imgPosY: 0,
            imgPosX2: 0,
            imgPosY2: 0,
            layerNumber,
            triggerPartsX: 0,
            triggerPartsY: 0,
            propertiesText,
        });
        this.registerPicture(checkValuesFromRawRegistry(registry));
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
                const nextPictureParts = picture.nextPictureParts;
                const mapPictureInfo = picture.appearParts;
                const triggerPartsCoord = picture.getTriggerPartsCoord();
                this.deletePicture(layerNumber);
                if (nextPictureParts !== undefined) {
                    // TODO 座標を算出したい
                    this._wwa.setPictureRegistry(
                        layerNumber,
                        nextPictureParts.partsNumber,
                        nextPictureParts.partsType,
                        triggerPartsCoord
                    );
                }
                if (mapPictureInfo !== undefined) {
                    // TODO ピクチャ機能の数値算出システムに依存しているため、
                    //      消去時点での座標を計算して配置することができない
                    //      例えば、消去時点でのプレイヤー位置に任意のパーツを配置とするようなことはできない
                    //      WWA Script 対応後は任意の関数を呼び出す機能で実現できるようになるつもり
                    this._wwa.setPartsOnPosition(
                        mapPictureInfo.partsType,
                        mapPictureInfo.partsNumber,
                        new Coord(mapPictureInfo.x, mapPictureInfo.y)
                    );
                }
            }
        });
    }

    public getPictureRegistryData(): PictureRegistry[] {
        return Array.from(this._pictures.values()).map(picture => picture.getRegistryData());
    }
}
