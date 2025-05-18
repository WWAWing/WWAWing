import { Coord, PartsType } from "../wwa_data";
import { PicturePropertyDefinitions } from "./config";
import { PictureExternalImageItem } from "./typedef";
import { PictureRegistry, RawPictureRegistry } from "@wwawing/common-interface/lib/wwa_data";
import { checkValuesFromRawRegistry, convertPictureRegistryFromText, convertVariablesFromRawRegistry, isAnonymousPicture, isValidLayerNumber } from "./utils";
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
    private _anonymousPictures: WWAPictureItem[];
    private _externalImageFiles: Map<string, PictureExternalImageItem>;
    private _frameTimerValue: number;

    constructor(wwa: WWA, pictureImageNamesFile: string | null) {
        this._wwa = wwa;
        this._pictures = new Map();
        this._anonymousPictures = [];
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
            console.warn(`ピクチャ画像の定義ファイル ${pictureImageNamesFile} が見つかりませんでした。エラーメッセージ: ${status.errorMessage}`);
            return;
        }
        if (!status.data || typeof status.data !== "object") {
            console.warn(`ピクチャ画像の定義ファイル ${pictureImageNamesFile} が正しい形式で書かれていません。`);
            return;
        }
        if ("files" in status.data) {
            const { files } = status.data;
            if (typeof files === "object") {
                Object.entries(status.data.files).forEach(([name, path]) => {
                    this._externalImageFiles.set(name, { status: "loading" });
                    const element = new Image();
                    element.src = path;
                    element.onerror = (err) => {
                        if (typeof err === "string") {
                            console.warn(`ピクチャ画像ファイル ${path} が見つかりませんでした。エラーメッセージ: ${err}`);
                        } else {
                            // onerror の引数にあたる ErrorEvent では理由を示すエラーメッセージが含まれていない
                            // TODO より正確なエラーメッセージを出力するに fetch で画像データを取得すると良いのだが、
                            //      取得したデータが画像形式なのか判別したり変換したりする機能の開発コストが大きいため、しばらくはこの状態で維持
                            console.warn(`ピクチャ画像ファイル ${path} が見つかりませんでした。`);
                        }
                        this._externalImageFiles.set(name, { status: "failed" })
                    };
                    element.onload = () => {
                        this._externalImageFiles.set(name, { status: "success", element });
                    };
                });
            } else {
                console.warn(`ピクチャ画像の定義ファイル ${pictureImageNamesFile} の files が正しい形式で書かれていません。`);
            }
        }
    }

    private static _getNowFrameValue() {
        return performance.now();
    }

    /**
     * ピクチャのレジストリ情報を元にピクチャを生成します。
     * 引数のレジストリ情報はデータの変換などが必要になるため、外からピクチャを生成したい場合は {@link registerPictureFromRawRegistry} などの用途に応じたメソッドをご利用ください。
     * そのほかの場面では、主に QuickLoad による復元で使用します。
     * 
     * @param registry ピクチャのレジストリ情報
     */
    public registerPicture(registry: PictureRegistry) {
        const invalidPropertyNames = Object.keys(registry.properties)
            .filter((propertyName) => !PicturePropertyDefinitions.some(({ name }) => name === propertyName));
        if (invalidPropertyNames.length > 0) {
            throw new Error(`不明なプロパティ名 ${invalidPropertyNames.map(str => `"${str}"`).join(", ")} が検出されました。`);
        }
        let externalImageFile = undefined;
        if (registry.properties.imgFile) {
            const item = this._externalImageFiles.get(registry.properties.imgFile);
            if (!item) {
                console.warn(`ピクチャ画像ファイル ${registry.properties.imgFile} が定義に含まれていません。定義ファイルがあるかご確認ください。`);
            } else if (item.status === "loading") {
                console.warn(`ピクチャ画像ファイル ${registry.properties.imgFile} はまだ読み込みを完了していません。`);
            } else if (item.status === "failed") {
                console.warn(`ピクチャ画像ファイル ${registry.properties.imgFile} を表示することができません。画像ファイルの Path が間違っていないかご確認ください。`);
            } else {
                externalImageFile = item.element;
            }
        }
        const soundNumber = registry.properties.sound ?? registry.soundNumber;
        if (soundNumber) {
            this._wwa.playSound(soundNumber);
        }
        if (isValidLayerNumber(registry.layerNumber)) {
            if (isAnonymousPicture(registry.layerNumber)) {
                this._anonymousPictures.push(new WWAPictureItem(this._wwa, registry, externalImageFile));
            } else {
                this._pictures.set(registry.layerNumber, new WWAPictureItem(this._wwa, registry, externalImageFile));
                // Map は key で自動的に並び替えていないので、追加のたびにソートし直す。通常の配列の方が順番通りに処理できそうだが、飛んだレイヤー番号が記載された場合に参照エラーを起こす可能性がありそう・・・。
                this._pictures = new Map([...this._pictures.entries()].sort(([, a], [, b]) => a.layerNumber - b.layerNumber));
            }
        } else {
            throw new Error(`指定したレイヤー番号 ${registry.layerNumber}番はこのバージョンでは無効です！`);
        }
    }

    /**
     * ピクチャを Object 形式のデータから登録し、追加後のピクチャをデータにして返します。
     * プロパティの変換は WWAPicture クラス内で行われます。
     * @param rawRegitry ピクチャの登録情報 (プロパティの変数参照は未変換の状態とする)
     * @param targetPartsID 対象のパーツ番号
     * @param targetPartsType 対象のパーツ種類
     * @param previousPictureProperties next プロパティで引き継いだ前のピクチャのプロパティ情報
     * @returns wwaData で使用できるピクチャの登録データ（配列形式）
     */
    public registerPictureFromRawRegistry(
        rawRegistry: RawPictureRegistry,
        targetPartsID: number,
        targetPartsType: PartsType,
        previousPictureProperties?: PictureRegistry["properties"],
    ) {
        this.registerPicture(convertVariablesFromRawRegistry(
            previousPictureProperties
                ? { ...rawRegistry, properties: { ...previousPictureProperties, ...rawRegistry.properties } }
                : rawRegistry,
            this._wwa.generateTokenValues({
                id: targetPartsID,
                type: targetPartsType,
                position: new Coord(rawRegistry.triggerPartsX, rawRegistry.triggerPartsY)
            })
        ));
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
            soundNumber: 0,
            propertiesText,
        });
        this.registerPicture(checkValuesFromRawRegistry(registry));
        return this.getPictureRegistryData();
    }

    public registerPictureFromObject(
        layerNumber: number,
        properties: object
    ) {
        this.registerPicture(
            checkValuesFromRawRegistry({
                imgPosX: 0,
                imgPosY: 0,
                imgPosX2: 0,
                imgPosY2: 0,
                layerNumber,
                triggerPartsX: 0,
                triggerPartsY: 0,
                soundNumber: 0,
                properties
            })
        );
        return this.getPictureRegistryData();
    }

    /**
     * ピクチャの登録を削除し、削除後のピクチャをデータにして返します。
     * 無名ピクチャを指定した場合は、その無名ピクチャを全部消去します。
     * @param layerNumber 削除したいレイヤーの番号
     * @returns wwaData で使用できるピクチャの登録データ（配列形式）
     */
    public deletePicture(layerNumber: number) {
        if (isAnonymousPicture(layerNumber)) {
            this._anonymousPictures.forEach((picture) => {
                picture.clearCanvas();
            });
            this._anonymousPictures.splice(0);
            return this.getPictureRegistryData();
        }
        if (this._pictures.has(layerNumber)) {
            this._pictures.get(layerNumber).clearCanvas();
            this._pictures.delete(layerNumber);
        }
        return this.getPictureRegistryData();
    }

    public clearAllPictures() {
        this._pictures.forEach((picture) => {
            picture.clearCanvas();
        })
        this._anonymousPictures.forEach((picture) => {
            picture.clearCanvas();
        });
        this._pictures.clear();
        // 空配列を代入した方が楽なのだが、参照されないガベージデータがメモリ上に残りそう
        this._anonymousPictures.splice(0);
    }

    public forEachPictures(caller: (picture: WWAPictureItem) => void) {
        // 無名ピクチャは原則レイヤー番号を設定したピクチャの下に描画される (WWAeval の仕様に従う)
        this._anonymousPictures.forEach(caller);
        this._pictures.forEach(caller);
    }

    public updateAllPicturesCache(image: HTMLImageElement, isMainAnimation: boolean) {
        this.forEachPictures((picture) => {
            if (picture.isNotStarted()) {
                return;
            }
            picture.draw(image, isMainAnimation);
        })
    }

    /**
     * updatePicturesAnimation の後に実行するようにしてください。
     * メッセージ表示中においても常時実行する必要があります。
     */
    public updateFrameTimerValue() {
        this._frameTimerValue = WWAPicutre._getNowFrameValue();
    }

    /**
     * 各ピクチャのプロパティを更新します。
     * 表示時間が過ぎたピクチャは削除し、プロパティに応じた適切な処理を実行します。
     * 毎フレーム実行されることを想定しています。
     */
    public updatePicturesAnimation(image: HTMLImageElement, isMainAnimation: boolean) {
        const newFrameValue = WWAPicutre._getNowFrameValue();
        const frameMs = newFrameValue - this._frameTimerValue;
        this.forEachPictures(picture => {
            picture.tickTime(frameMs);
            if (picture.isNotStarted()) {
                return;
            }
            if (picture.isDeadlineOver()) {
                const layerNumber = picture.layerNumber;
                const nextPicturesInfo = picture.getNextPicturePartsInfo();
                const mapPictureInfo = picture.appearParts;
                const executeScriptFunctionName = picture.executeScriptFunctionName;
                const pictureProperties = picture.getNextPictureProperties();
                const triggerPartsCoord = picture.getTriggerPartsCoord();
                // WWAMain から実行しないと削除した分がセーブデータに残る
                this._wwa.deletePictureRegistry(layerNumber);
                for (const nextPictureInfo of nextPicturesInfo) {
                    this._wwa.setPictureRegistry(
                        nextPictureInfo.layerNumber,
                        nextPictureInfo.partsNumber,
                        nextPictureInfo.partsType,
                        triggerPartsCoord,
                        nextPictureInfo.connectProperties ? pictureProperties : undefined,
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
                if (executeScriptFunctionName) {
                    this._wwa.callUserScript(executeScriptFunctionName);
                }
                return;
            }
            if (picture.hasAnimation) {
                picture.updateAnimation();
                picture.draw(image, isMainAnimation);
            }
        });
    }

    public isWaiting() {
        for (const picture of this._pictures.values()) {
            if (picture.isWaiting()) {
                return true;
            }
        }
        for (const picture of this._anonymousPictures) {
            if (picture.isWaiting()) {
                return true;
            }
        }
        return false;
    }

    public getPictureRegistryData(): PictureRegistry[] {
        return Array.from(this._pictures.values()).map(picture => picture.getRegistryData());
    }
}
