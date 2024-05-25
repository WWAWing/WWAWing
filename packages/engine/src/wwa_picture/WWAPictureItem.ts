import { PictureRegistry } from "@wwawing/common-interface";
import { PartsType } from "@wwawing/loader";
import { CacheCanvas } from "../wwa_cgmanager";
import { Coord, WWAConsts } from "../wwa_data";
import * as util from "../wwa_util";
import {
    isAnonymousPicture,
    getArrayItemFromSingleOrArray,
    adjustPositiveValue,
    getHorizontalCirclePosition,
    getHorizontalCorrectionBySizeAnchor,
    getVerticalCirclePosition,
    getVerticalCorrectionBySizeAnchor
} from "./utils";
import { NextPicturePartsInfo } from "./typedef";
import { WWAPictureAnimation, WWAPictureDefaultAnimation } from "./WWAPictureAnimation";
import { WWATimer } from "./WWATimer";

/**
 * 描画用ピクチャインスタンスです。
 * WWA のピクチャは1イメージ分のサイズや繰り返し回数などのパラメーターを算出して描画しますが、これを毎回描画のたびに行うのは負荷が高まります。
 * そこでこれらのパラメーターを生成時に算出してキャッシュすることで描画の効率化を図ります。
 */
export default class WWAPictureItem {

    /**
     * 基準 X 座標。 circle プロパティによる円運動では、基準となる座標がないと同じ座標上での円運動を維持できない。
     * 円運動以外で座標が変わる場合は、この値を改変すること。
     */
    private _posBaseX: number;
    private _posBaseY: number;
    /**
     * 出力 X 座標。 circle プロパティによる円運動によって改変された値。
     * ピクチャ画面上で表示する場合はこの値を使用すること。
     */
    private _posDestX: number;
    private _posDestY: number;
    private readonly _imgAnimation: WWAPictureAnimation;
    private readonly _drawChip: boolean;
    private _sizeX: number;
    private _sizeY: number;
    /**
     * crop プロパティを用いた場合の、1マス分の横幅。
     */
    private _chipWidth: number;
    private _chipHeight: number;
    private _totalWidth: number;
    private _totalHeight: number;
    private _moveX: number;
    private _moveY: number;
    private readonly _accelX: number;
    private readonly _accelY: number;
    private _zoomX: number;
    private _zoomY: number;
    private readonly _zoomAccelX: number;
    private readonly _zoomAccelY: number;
    private readonly _anchor: number;
    private readonly _circleRadiusX: number;
    private readonly _circleRadiusY: number;
    private _circleAngle: number;
    private readonly _circleSpeed: number;
    private readonly _repeatX: number;
    private readonly _repeatY: number;
    private readonly _imgFile?: HTMLImageElement;
    private readonly _cropX: number;
    private readonly _cropY: number;
    private _opacity: number;
    private readonly _fade: number;
    private readonly _hasAnimation: boolean;

    private _timer: WWATimer;

    constructor(private _registry: PictureRegistry, private _canvas: CacheCanvas, externalFile?: HTMLImageElement) {
        const { properties } = _registry;
        this._posBaseX = properties.pos?.[0] ?? 0;
        this._posBaseY = properties.pos?.[1] ?? 0;
        const [imgMainX, imgMainY] = WWAPictureItem._getImgPosByPicture(this._registry, true);
        const [imgSubX, imgSubY] = WWAPictureItem._getImgPosByPicture(this._registry, false);
        this._imgAnimation = new WWAPictureDefaultAnimation(imgMainX, imgMainY, imgSubX, imgSubY);
        // イメージ画像がどれも 0, 0 の場合は何も描画しない（PICTURE 関数から呼び出す場合に黒四角が現れる対策）
        this._drawChip = this._imgAnimation.hasImg();
        this._repeatX = properties.repeat?.[0] ?? 1;
        this._repeatY = properties.repeat?.[1] ?? 1;
        this._imgFile = externalFile;
        // 外部画像ファイルを使用した場合、 crop は無効となる
        this._cropX = this._imgFile ? 1 : properties.crop?.[0] ?? 1;
        this._cropY = this._imgFile ? 1 : properties.crop?.[1] ?? 1;

        this._sizeX = properties.size?.[0] ?? (this._imgFile ? this._imgFile.width : WWAConsts.CHIP_SIZE);
        this._sizeY = properties.size?.[1] ?? (this._imgFile ? this._imgFile.height : WWAConsts.CHIP_SIZE);
        
        this._circleRadiusX = properties.circle?.[0] ?? 0;
        this._circleRadiusY = properties.circle?.[1] ?? this._circleRadiusX;
        this._circleAngle = properties.circle?.[2] ?? 0;

        // アニメーション関連のプロパティをセット
        this._moveX = properties.move?.[0] ?? 0;
        this._moveY = properties.move?.[1] ?? 0;
        this._accelX = properties.accel?.[0] ?? 0;
        this._accelY = properties.accel?.[1] ?? 0;
        this._zoomX = properties.zoom?.[0] ?? 0;
        this._zoomY = properties.zoom?.[1] ?? 0;
        this._zoomAccelX = properties.zoomAccel?.[0] ?? 0;
        this._zoomAccelY = properties.zoomAccel?.[1] ?? 0;
        this._anchor = properties.anchor ?? 7;
        this._circleSpeed = properties.circle?.[3] ?? 0;
        
        this._opacity = properties.opacity ?? 100;
        this._fade = properties.fade ?? 0;

        this._updatePictureCache();
        
        this._timer = new WWATimer();
        this._timer.addPoint(
            "start",
            getArrayItemFromSingleOrArray(properties.time, 1, false),
            getArrayItemFromSingleOrArray(properties.timeFrame, 1, false)
        );
        this._timer.addPoint(
            "end",
            getArrayItemFromSingleOrArray(properties.time, 0, true),
            getArrayItemFromSingleOrArray(properties.timeFrame, 0, true)
        );
        this._timer.addPoint("startAnim", properties.animTime?.[0], properties.animTimeFrame?.[0]);
        this._timer.addPoint("endAnim", properties.animTime?.[1], properties.animTimeFrame?.[1]);
        this._timer.addPoint("wait", properties.wait, properties.waitFrame);
        
        // Canvas の ctx を色々いじる
        this._canvas.ctx.globalAlpha = WWAPictureItem._roundPercentage(this._opacity) / 100;
        this._canvas.ctx.font = WWAPictureItem._getFontValue(properties);
        this._canvas.ctx.textBaseline = "top";
        if (properties.textAlign) {
            this._canvas.ctx.textAlign = WWAPictureItem._convertTextAlign(properties.textAlign);
        }
        const colorR = properties.color?.[0] ?? 0;
        const colorG = properties.color?.[1] ?? 0;
        const colorB = properties.color?.[2] ?? 0;
        this._canvas.ctx.fillStyle = `rgb(${colorR}, ${colorG}, ${colorB})`;

        this._hasAnimation = this.getHasAnimation();
    }

    public get layerNumber() {
        return this._registry.layerNumber;
    }

    public get hasAnimation() {
        return this._hasAnimation;
    }

    public get cvs() {
        return this._canvas.cvs;
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
        // TODO これをオフにするオプションがあっても良さそう
        this.clearCanvas();

        const [imgPosX, imgPosY] = this._imgAnimation.getImgPos(isMainAnimation);
        
        for (let ry = 0; ry < this._repeatY; ry++) {
            for (let rx = 0; rx < this._repeatX; rx++) {
                const chipX = this._posDestX + (this._totalWidth * rx);
                const chipY = this._posDestY + (this._totalHeight * ry);
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
     * アニメーションに応じてピクチャのプロパティを更新します。
     */
    public updateAnimation() {
        if (this._timer.isNotOver("startAnim", false) || this._timer.isOver("endAnim", false)) {
            return;
        }
        this._posBaseX = this._posBaseX + this._moveX;
        this._posBaseY = this._posBaseY + this._moveY;
        this._moveX = this._moveX + this._accelX;
        this._moveY = this._moveY + this._accelY;
        this._sizeX = this._sizeX + this._zoomX;
        this._sizeY = this._sizeY + this._zoomY;
        this._zoomX = this._zoomX + this._zoomAccelX;
        this._zoomY = this._zoomY + this._zoomAccelY;
        this._updatePictureCache();
        this._circleAngle = this._circleAngle + this._circleSpeed;
        if (this._fade !== 0) {
            this._opacity = this._opacity + this._fade;
            this._canvas.ctx.globalAlpha = WWAPictureItem._roundPercentage(this._opacity) / 100;
        }
    }

    private _updatePictureCache() {
        this._totalWidth = adjustPositiveValue(this._sizeX) * this._cropX;
        this._totalHeight = adjustPositiveValue(this._sizeY) * this._cropY;
        this._chipWidth = Math.floor(this._totalWidth / this._cropX);
        this._chipHeight = Math.floor(this._totalHeight / this._cropY);
        this._posDestX = getHorizontalCorrectionBySizeAnchor(
            getHorizontalCirclePosition(
                this._posBaseX,
                this._circleRadiusX,
                this._circleAngle
            ),
            this._totalWidth,
            this._anchor
        );
        this._posDestY = getVerticalCorrectionBySizeAnchor(
            getVerticalCirclePosition(
                this._posBaseY,
                this._circleRadiusY,
                this._circleAngle
            ),
            this._totalHeight,
            this._anchor
        );
    }

    public isNotStarted() {
        return this._timer.isNotOver("start", false);
    }

    public tickTime(frameMs: number) {
        this._timer.tick(frameMs);
    }

    public isDeadlineOver() {
        return this._timer.isOver("end", false);
    }

    public isStartTimeOver() {
        return this._timer.isOver("start", true);
    }

    public isWaiting() {
        return this._timer.isNotOver("wait", false);
    }

    public clearCanvas() {
        this._canvas.clear();
    }

    public getRegistryData() {
        return this._registry;
    }

    public getNextPicturePartsInfo(): NextPicturePartsInfo[] {
        const nextPicture = Array.isArray(this._registry.properties.next) && this._registry.properties.next[0]
            ? {
                layerNumber: this._registry.layerNumber,
                partsNumber: this._registry.properties.next[0],
                partsType: this._registry.properties.next[1] ?? PartsType.OBJECT,
                connectProperties: this._registry.properties.next[2] ? true : false,
            }
            : undefined;
        // TODO 1次元配列だった場合は二次元配列に補正するのも良いかもしれない
        const createPictures = Array.isArray(this._registry.properties.create)
            ? this._registry.properties.create
                .filter(Array.isArray)
                .map((partsInfo) => ({
                    layerNumber: partsInfo[0],
                    partsNumber: partsInfo[1],
                    partsType: partsInfo[2] ?? PartsType.OBJECT,
                    connectProperties: partsInfo[3] ? true : false,
                }))
            : [];
        if (!nextPicture) {
            return createPictures;
        }
        return createPictures.concat(nextPicture);
    }

    public getNextPictureProperties(): PictureRegistry["properties"] {
        const properties = { ...this._registry.properties };
        // next プロパティや create プロパティを継ぐとピクチャが表示されっぱなしになるので取り除く
        delete properties["next"];
        delete properties["create"];
        return {
            ...properties,
            pos: [this._posBaseX, this._posBaseY],
            move: [this._moveX, this._moveY],
            size: [this._sizeX, this._sizeY],
            zoom: [this._zoomX, this._zoomY],
            circle: [this._circleRadiusX, this._circleRadiusY, this._circleAngle, this._circleSpeed],
            opacity: this._opacity,
        };
    }

    public getTriggerPartsCoord() {
        return new Coord(this._registry.triggerPartsX, this._registry.triggerPartsY);
    }

    private getHasAnimation() {
        return (
            this._moveX !== 0 ||
            this._moveY !== 0 ||
            this._accelX !== 0 ||
            this._accelY !== 0 ||
            this._zoomX !== 0 ||
            this._zoomY !== 0 ||
            this._zoomAccelX !== 0 ||
            this._zoomAccelY !== 0 ||
            this._circleSpeed !== 0 ||
            this._fade !== 0
        );
    }

    private static _getImgPosByPicture(registry: PictureRegistry, isMainTime: boolean) {
        const { properties } = registry;
        if (properties.img?.[0] !== undefined && properties.img?.[1] !== undefined) {
            if (Array.isArray(properties.img[0]) || Array.isArray(properties.img[1])) {
                throw new Error("2次元配列形式には未対応です。");
            }
            if (isMainTime) {
                return [properties.img[0], properties.img[1]];
            }
            if (properties.img[2] !== undefined && properties.img[3] !== undefined) {
                if (Array.isArray(properties.img[2]) || Array.isArray(properties.img[3])) {
                    throw new Error("2次元配列形式には未対応です。");
                }
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
