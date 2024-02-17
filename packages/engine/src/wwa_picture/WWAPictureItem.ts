import { PictureRegistry } from "@wwawing/common-interface";
import { PartsType } from "@wwawing/loader";
import { CacheCanvas } from "../wwa_cgmanager";
import { Coord, WWAConsts } from "../wwa_data";
import * as util from "../wwa_util";

/**
 * 描画用ピクチャインスタンスです。
 * WWA のピクチャは1イメージ分のサイズや繰り返し回数などのパラメーターを算出して描画しますが、これを毎回描画のたびに行うのは負荷が高まります。
 * そこでこれらのパラメーターを生成時に算出してキャッシュすることで描画の効率化を図ります。
 */
export default class WWAPictureItem {

    private _posX: number;
    private _posY: number;
    private readonly _imgMainX: number;
    private readonly _imgMainY: number;
    private readonly _imgSubX: number;
    private readonly _imgSubY: number;
    private readonly _drawChip: boolean;
    private readonly _chipWidth: number;
    private readonly _chipHeight: number;
    private readonly _totalWidth: number;
    private readonly _totalHeight: number;
    private _moveX: number;
    private _moveY: number;
    private readonly _accelX: number;
    private readonly _accelY: number;
    private readonly _repeatX: number;
    private readonly _repeatY: number;
    private readonly _imgFile?: HTMLImageElement;
    private readonly _cropX: number;
    private readonly _cropY: number;
    
    private _displayStockTime?: number;

    constructor(private _registry: PictureRegistry, private _canvas: CacheCanvas, externalFile?: HTMLImageElement) {
        const { properties } = _registry;
        this._posX = properties.pos?.[0] ?? 0;
        this._posY = properties.pos?.[1] ?? 0;
        [this._imgMainX, this._imgMainY] = WWAPictureItem._getImgPosByPicture(this._registry, true);
        [this._imgSubX, this._imgSubY] = WWAPictureItem._getImgPosByPicture(this._registry, false);
        // イメージ画像がどれも 0, 0 の場合は何も描画しない（PICTURE 関数から呼び出す場合に黒四角が現れる対策）
        this._drawChip = this._imgMainX !== 0 || this._imgMainY !== 0 || this._imgSubX !== 0 || this._imgSubY !== 0;
        this._repeatX = properties.repeat?.[0] ?? 1;
        this._repeatY = properties.repeat?.[1] ?? 1;
        this._imgFile = externalFile;
        // 外部画像ファイルを使用した場合、 crop は無効となる
        this._cropX = this._imgFile ? 1 : properties.crop?.[0] ?? 1;
        this._cropY = this._imgFile ? 1 : properties.crop?.[1] ?? 1;

        this._totalWidth =
            (properties.size?.[0] ?? (this._imgFile ? this._imgFile.width : WWAConsts.CHIP_SIZE)) * this._cropX;
        this._totalHeight =
            (properties.size?.[1] ?? (this._imgFile ? this._imgFile.height : WWAConsts.CHIP_SIZE)) * this._cropY;
        this._chipWidth = Math.floor(this._totalWidth / this._cropX);
        this._chipHeight = Math.floor(this._totalHeight / this._cropY);

        // アニメーション関連のプロパティをセット
        this._moveX = properties.move?.[0] ?? 0;
        this._moveY = properties.move?.[1] ?? 0;
        this._accelX = properties.accel?.[0] ?? 0;
        this._accelY = properties.accel?.[1] ?? 0;
        
        this._displayStockTime = properties.time;
        
        // Canvas の ctx を色々いじる
        this._canvas.ctx.globalAlpha = properties.opacity
            ? WWAPictureItem._roundPercentage(properties.opacity) / 100
            : 1;
        this._canvas.ctx.font = WWAPictureItem._getFontValue(properties);
        if (properties.textAlign) {
            this._canvas.ctx.textAlign = WWAPictureItem._convertTextAlign(properties.textAlign);
        }
        const colorR = properties.color?.[0] ?? 0;
        const colorG = properties.color?.[1] ?? 0;
        const colorB = properties.color?.[2] ?? 0;
        this._canvas.ctx.fillStyle = `rgb(${colorR}, ${colorG}, ${colorB})`;
    }

    public get layerNumber() {
        return this._registry.layerNumber;
    }

    public get cvs() {
        return this._canvas.cvs;
    }

    public get nextPictureParts() {
        if (!this._registry.properties.next || this._registry.properties.next[0] === undefined) {
            return undefined;
        }
        return {
            partsNumber: this._registry.properties.next[0],
            partsType: this._registry.properties.next[1] ?? PartsType.OBJECT,
            connectProperties: this._registry.properties.next[2] ?? 0,
        };
    }

    public get appearParts() {
        if (
            !this._registry.properties.map || this._registry.properties.map.length < 3
        ) {
            return undefined;
        }
        return {
            partsNumber: this._registry.properties.map[0],
            x: this._registry.properties.map[1],
            y: this._registry.properties.map[2],
            partsType: this._registry.properties.map[3] ?? PartsType.OBJECT,
        };
    }

    public get executeScriptFunctionName() {
        return this._registry.properties.script;
    }

    /**
     * ピクチャを描画します。
     * 毎フレーム処理されるため、プロパティから直接引き出される値以外はあらかじめフィールドに数値などをキャッシュしてください。
     */
    public draw(image: HTMLImageElement, isMainAnimation: boolean) {
        const imgPosX = isMainAnimation ? this._imgMainX : this._imgSubX;
        const imgPosY = isMainAnimation ? this._imgMainY : this._imgSubY;
        
        for (let ry = 0; ry < this._repeatY; ry++) {
            for (let rx = 0; rx < this._repeatX; rx++) {
                const chipX = this._posX + (this._totalWidth * rx);
                const chipY = this._posY + (this._totalHeight * ry);
                if (this._imgFile) {
                    this._canvas.drawCanvasFree(this._imgFile, chipX, chipY, this._totalWidth, this._totalHeight);
                } else if (this._drawChip) {
                    for (let cy = 0; cy < this._cropY; cy++) {
                        for (let cx = 0; cx < this._cropX; cx++) {
                            this._canvas.drawCanvas(
                                image,
                                imgPosX + cx,
                                imgPosY + cy,
                                chipX + (this._chipWidth * cx),
                                chipY + (this._chipHeight * cy),
                                this._chipWidth,
                                this._chipHeight
                            );
                        }
                    }
                }
                if (this._registry.properties.text) {
                    this._canvas.drawFont(
                        this._registry.properties.text,
                        chipX,
                        chipY,
                        this._registry.properties.lineHeight
                    );
                }
            }
        }
    }

    /**
     * ピクチャのプロパティを更新します。
     */
    public update() {
        this._posX = this._posX + this._moveX;
        this._posY = this._posY + this._moveY;
        this._moveX = this._moveX + this._accelX;
        this._moveY = this._moveY + this._accelY;
    }

    public hasDisplayTimeStock() {
        return this._displayStockTime !== undefined;
    }

    public decrementDisplayTimeStock(frameMs: number) {
        return this._displayStockTime -= frameMs;
    }

    public isDeadlineOver() {
        return this._displayStockTime <= 0;
    }

    public clearCanvas() {
        this._canvas.clear();
    }

    public getRegistryData(excludeNextProperty?: boolean) {
        if (excludeNextProperty) {
            const newData = { ...this._registry };
            delete this._registry.properties["next"];
            return newData;
        }
        return this._registry;
    }

    public getTriggerPartsCoord() {
        return new Coord(this._registry.triggerPartsX, this._registry.triggerPartsY);
    }

    private static _getImgPosByPicture(registry: PictureRegistry, isMainTime: boolean) {
        const { properties } = registry;
        if (properties.img?.[0] !== undefined && properties.img?.[1] !== undefined) {
            if (isMainTime) {
                return [properties.img[0], properties.img[1]];
            }
            if (properties.img[2] !== undefined && properties.img[3] !== undefined) {
                return [properties.img[2], properties.img[3]];
            }
            return [properties.img[0], properties.img[1]];
        }
        if (isMainTime || (registry.imgPosX2 === 0 && registry.imgPosY2 === 0)) {
            return [registry.imgPosX, registry.imgPosY];
        }
        return [registry.imgPosX2, registry.imgPosY2];
    }

    private static _getFontValue(properties: PictureRegistry["properties"]): string {
        // font プロパティがある場合は優先して使用 (下位互換性確保のため)
        if (properties.font) {
            return properties.font;
        }
        const defaultStyle = getComputedStyle(util.$id("wwa-wrapper"));
        if (
            properties.fontSize === undefined &&
            properties.fontFamily === undefined &&
            properties.italic === undefined &&
            properties.bold === undefined
        ) {
            return defaultStyle.font;
        }
        const italicValue = properties.italic ? "italic" : "";
        const boldValue = properties.bold ? "bold" : "";
        const fontSizeValue = properties.fontSize ? `${properties.fontSize}px` : defaultStyle.fontSize;
        const fontFamilyValue = properties.fontFamily && properties.fontFamily.length > 0 ? properties.fontFamily : defaultStyle.fontFamily;
        return `${italicValue} ${boldValue} ${fontSizeValue} ${fontFamilyValue}`;
    }

    private static _convertTextAlign(value: string): CanvasTextAlign | undefined {
        if (["center", "end", "left", "right", "start"].includes(value)) {
            return value as CanvasTextAlign;
        }
        // TODO 例外を投げるべき？
        console.warn(`textAlign プロパティで不正な値が検出されました。: ${value}`);
        return undefined;
    }

    private static _roundPercentage(value: number): number {
        if (value < 0) {
            return 0;
        }
        if (value > 100) {
            return 100;
        }
        return value;
    }
}
