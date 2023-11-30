import { PictureRegistory } from "@wwawing/common-interface";
import { CacheCanvas } from "../wwa_cgmanager";
import { WWAConsts } from "../wwa_data";
import * as util from "../wwa_util";

/**
 * 描画用ピクチャインスタンスです。
 * WWA のピクチャは1イメージ分のサイズや繰り返し回数などのパラメーターを算出して描画しますが、これを毎回描画のたびに行うのは負荷が高まります。
 * そこでこれらのパラメーターを生成時に算出してキャッシュすることで描画の効率化を図ります。
 */
export default class WWAPictureItem {

    private readonly _posX: number;
    private readonly _posY: number;
    private readonly _imgMainX: number;
    private readonly _imgMainY: number;
    private readonly _imgSubX: number;
    private readonly _imgSubY: number;
    private readonly _chipWidth: number;
    private readonly _chipHeight: number;
    private readonly _totalWidth: number;
    private readonly _totalHeight: number;
    private readonly _repeatX: number;
    private readonly _repeatY: number;
    private readonly _cropX: number;
    private readonly _cropY: number;
    
    private _displayStockTime?: number;

    constructor(private _registory: PictureRegistory, private _canvas: CacheCanvas) {
        const { properties } = _registory;
        this._posX = properties.pos?.[0] ?? 0;
        this._posY = properties.pos?.[1] ?? 0;
        [this._imgMainX, this._imgMainY] = WWAPictureItem._getImgPosByPicture(this._registory, true);
        [this._imgSubX, this._imgSubY] = WWAPictureItem._getImgPosByPicture(this._registory, false);
        this._repeatX = properties.repeat?.[0] ?? 1;
        this._repeatY = properties.repeat?.[1] ?? 1;
        this._cropX = properties.crop?.[0] ?? 1;
        this._cropY = properties.crop?.[1] ?? 1;
        this._totalWidth = (properties.size?.[0] ?? WWAConsts.CHIP_SIZE) * this._cropX;
        this._totalHeight = (properties.size?.[1] ?? WWAConsts.CHIP_SIZE) * this._cropY;
        this._chipWidth = Math.floor(this._totalWidth / this._cropX);
        this._chipHeight = Math.floor(this._totalHeight / this._cropY);
        
        this._displayStockTime = properties.time;
        
        // Canvas の ctx を色々いじる
        this._canvas.ctx.globalAlpha = properties.opacity
            ? WWAPictureItem._roundPercentage(properties.opacity) / 100
            : 1;
        this._canvas.ctx.font = properties.font ?? getComputedStyle(util.$id("wwa-wrapper")).font;
        if (properties.textAlign) {
            this._canvas.ctx.textAlign = WWAPictureItem._convertTextAlign(properties.textAlign);
        }
        const colorR = properties.color?.[0] ?? 0;
        const colorG = properties.color?.[1] ?? 0;
        const colorB = properties.color?.[2] ?? 0;
        this._canvas.ctx.fillStyle = `rgb(${colorR}, ${colorG}, ${colorB})`;
    }

    public get layerNumber() {
        return this._registory.layerNumber;
    }

    public get cvs() {
        return this._canvas.cvs;
    }

    public get nextPictureNumber() {
        return this._registory.properties.next;
    }

    public get appearPartsInfo() {
        return this._registory.properties.map;
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
                if (this._registory.properties.text) {
                    this._canvas.drawFont(
                        this._registory.properties.text,
                        this._posX + (this._totalWidth * rx),
                        this._posY + (this._totalHeight * ry)
                    );
                }
                const chipX = this._posX + (this._totalWidth * rx);
                const chipY = this._posY + (this._totalHeight * ry);
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
        }
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

    public getRegistoryData() {
        return this._registory;
    }

    private static _getImgPosByPicture(registory: PictureRegistory, isMainTime: boolean) {
        const { properties } = registory;
        if (properties.img?.[0] !== undefined && properties.img?.[1] !== undefined) {
            if (isMainTime) {
                return [properties.img[0], properties.img[1]];
            }
            if (properties.img[2] !== undefined && properties.img[3] !== undefined) {
                return [properties.img[2], properties.img[3]];
            }
            return [properties.img[0], properties.img[1]];
        }
        if (isMainTime || (registory.imgPosX2 === 0 && registory.imgPosY2 === 0)) {
            return [registory.imgPosX, registory.imgPosY];
        }
        return [registory.imgPosX2, registory.imgPosY2];
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