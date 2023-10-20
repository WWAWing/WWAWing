import { CacheCanvas } from "../wwa_cgmanager";
import { Coord, PartsType, WWAConsts } from "../wwa_data";
import { MAX_PICTURE_LAYERS_COUNT, PicturePropertyDefinitions } from "./config";
import { PictureItem, PictureRegistoryParts } from "./typedef";
import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { convertPictureRegistoryFromText, convertVariablesFromRawRegistory } from "./utils";
import { WWA } from "../wwa_main";

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
    private _wwa: WWA;
    private _pictures: Map<number, PictureItem>;
    private _isMainAnimation: boolean;
    private _frameTimerValue: number;

    constructor(wwa: WWA) {
        this._wwa = wwa;
        this._pictures = new Map();
        this._isMainAnimation = true;
        this._frameTimerValue = WWAPicutre._getNowFrameValue();
    }

    private static _getNowFrameValue() {
        return performance.now();
    }

    private static _getImgPosByPicture(picture: PictureItem, isMainTime: boolean) {
        const { properties } = picture;
        if (properties.img?.[0] !== undefined && properties.img?.[1] !== undefined) {
            if (isMainTime) {
                return [properties.img[0], properties.img[1]];
            }
            if (properties.img[2] !== undefined && properties.img[3] !== undefined) {
                return [properties.img[2], properties.img[3]];
            }
            return [properties.img[0], properties.img[1]];
        }
        if (isMainTime || (picture.imgPosX2 === 0 && picture.imgPosY2 === 0)) {
            return [picture.imgPosX, picture.imgPosY];
        }
        return [picture.imgPosX2, picture.imgPosY2];
    }

    private static _convertTextAlign(value: string): CanvasTextAlign | undefined {
        if (["center", "end", "left", "right", "start"].includes(value)) {
            return value as CanvasTextAlign;
        }
        // TODO 例外を投げるべき？
        console.warn(`textAlign プロパティで不正な値が検出されました。: ${value}`);
        return undefined;
    }

    /**
     * ピクチャのプロパティ情報を基に、ピクチャを Canvas に描画します。
     * プロパティ情報が追加されてピクチャの描画方法が追加される場合は、このメソッドの実装を変えてください。
     * また、追加情報が必要な場合はフィールドを定義し、そのフィールドから参照するようにしてください。
     * @param image CacheCanvas.drawCanvas で使用されるイメージ要素
     * @param picture 対象のピクチャ
     * @todo 毎フレーム複雑な条件分岐処理が実行されるので、デフォルト値を置くかインスタンス化したい
     */
    private _drawPicture(image: HTMLImageElement, picture: PictureItem) {
        const { properties } = picture;
        const [imgPosX, imgPosY] = WWAPicutre._getImgPosByPicture(picture, this._isMainAnimation);
        const posX = properties.pos[0] ?? 0;
        const posY = properties.pos[1] ?? 0;
        const width = picture.properties.size?.[0] ?? WWAConsts.CHIP_SIZE * (picture.properties.crop?.[0] ?? 1);
        const height = picture.properties.size?.[1] ?? WWAConsts.CHIP_SIZE * (picture.properties.crop?.[1] ?? 1);
        const chipWidth = Math.floor(width / (picture.properties.crop?.[0] ?? 1));
        const chipHeight = Math.floor(height / (picture.properties.crop?.[1] ?? 1));

        for (let repeatY = 0; repeatY < (picture.properties.repeat?.[1] ?? 1); repeatY++) {
            for (let repeatX = 0; repeatX < (picture.properties.repeat?.[0] ?? 1); repeatX++) {
                if (picture.properties.text) {
                    picture.canvas.drawFont(
                        properties.text,
                        posX + (width * repeatX),
                        posY + (height * repeatY),
                        properties.font,
                        properties.color?.[0],
                        properties.color?.[1],
                        properties.color?.[2],
                        properties.textAlign ? WWAPicutre._convertTextAlign(properties.textAlign) : undefined
                    );
                }
                for (let cropY = 0; cropY < (properties.crop?.[1] ?? 1); cropY++) {
                    for (let cropX = 0; cropX < (properties.crop?.[0] ?? 1); cropX++) {
                        picture.canvas.drawCanvas(
                            image,
                            imgPosX + cropX,
                            imgPosY + cropY,
                            posX + (width * repeatX) + (WWAConsts.CHIP_SIZE * cropX),
                            posY + (height * repeatY) + (WWAConsts.CHIP_SIZE * cropY),
                            chipWidth,
                            chipHeight
                        );
                    }
                }
            }
        }
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
        const invalidPropertyNames = Object.keys(registory.properties)
            .filter((propertyName) => !PicturePropertyDefinitions.some(({ name }) => name === propertyName));
        if (invalidPropertyNames.length > 0) {
            throw new Error(`不明なプロパティ名 ${invalidPropertyNames.map(str => `"${str}"`).join(", ")} が検出されました。`);
        }
        this._pictures.set(registory.layerNumber, {
            ...registory,
            displayStockTime: registory.properties.time,
            canvas,
        });
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
    public registPictureFromText(
        registory: PictureRegistoryParts,
        targetPartsID: number,
        targetPartsType: PartsType,
        triggerPartsPosition: Coord
    ) {
        const rawRegistory = convertPictureRegistoryFromText(registory);
        this.registPicture(convertVariablesFromRawRegistory(rawRegistory, this._wwa.generateTokenValues({
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
        this._pictures.get(layerNumber).canvas.clear();
        this._pictures.delete(layerNumber);
        return this.getPictureRegistoryData();
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

    public updatePicturesCache(image: HTMLImageElement, isMainAnimation: boolean) {
        this._isMainAnimation = isMainAnimation;
        this.forEachPictures((picture) => {
            // layerNumber が 0 の場合はいわゆる無名ピクチャという扱いのため、既存のピクチャ定義を上書きしない挙動となっている。
            // このことを想定して、 canvas のクリアを除外しているのだが、これだと変化前の画像データが残ってしまうことになる。
            // TODO WWAeval の実装では無名ピクチャをどのように実装しているのかソースを確認する
            if (picture.layerNumber !== 0) {
                picture.canvas.clear();
            }
            this._drawPicture(image, picture);
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
            if (picture.displayStockTime === undefined) {
                return;
            }
            picture.displayStockTime -= frameMs;
            if (picture.displayStockTime <= 0) {
                this.deletePicture(picture.layerNumber);
            }
        });
    }

    public getPictureRegistoryData(): PictureRegistory[] {
        return Array.from(this._pictures.values()).map(({ canvas, ...item }) => item);
    }
}
