import { PictureRegistry } from "@wwawing/common-interface";
import { PartsType } from "@wwawing/loader";
import { Coord, WWAConsts } from "../wwa_data";
import { WWA } from "../wwa_main";
import * as util from "../wwa_util";
import {
    getArrayItemFromSingleOrArray,
    adjustPositiveValue,
    getHorizontalCirclePosition,
    getHorizontalCorrectionBySizeAnchor,
    getVerticalCirclePosition,
    getVerticalCorrectionBySizeAnchor,
    canDrawChip,
} from "./utils";
import { DrawCoordType, NextPicturePartsInfo } from "./typedef";
import { WWATimer } from "./WWATimer";
import { PictureCacheCanvas } from "./PictureCacheCanvas";
import { getDrawPictureCanvasCoords, getDrawPictureOffsetInCacheCanvas, getPictureCanvasSize, getTranslateOffsetForRotate } from "./coordType";

/**
 * 描画用ピクチャインスタンスです。
 * WWA のピクチャは1イメージ分のサイズや繰り返し回数などのパラメーターを算出して描画しますが、これを毎回描画のたびに行うのは負荷が高まります。
 * そこでこれらのパラメーターを生成時に算出してキャッシュすることで描画の効率化を図ります。
 */
export default class WWAPictureItem {

    private readonly _canvas: PictureCacheCanvas;
    private readonly _drawCoordType: DrawCoordType;

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
    private readonly _imgMainX: number;
    private readonly _imgMainY: number;
    private readonly _imgSubX: number;
    private readonly _imgSubY: number;
    private readonly _drawChip: boolean;
    private _sizeX: number;
    private _sizeY: number;
    /**
     * crop プロパティを用いた場合の1マス分の横幅
     */
    private _chipWidth: number;
    private _chipHeight: number;
    /**
     * crop プロパティでくっつけた、1体分の横幅
     */
    private _charaWidth: number;
    private _charaHeight: number;
    /**
     * ピクチャの描画範囲の横幅
     */
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
    /**
     * imgMap 使用時限定。各パーツのイメージ座標を記載した二次元配列のキャッシュ。
     * @todo _cropX と _cropY とでどちらかしか使用しないため、両方ともまとめてクラスで管理できるようにしたい
     */
    private readonly _mapCropCache: [number, number, number, number][][] | null;
    private readonly _fontStyle: string;
    private readonly _textAlign: CanvasTextAlign | null;
    private readonly _fillStyle: string;
    private _opacity: number;
    private readonly _fade: number;
    private _angleRadian: number;
    private readonly _rotateRadian: number;
    private readonly _hasAnimation: boolean;

    private _timer: WWATimer;

    constructor(wwa: WWA, private _registry: PictureRegistry, externalFile?: HTMLImageElement) {
        const { properties } = _registry;
        this._posBaseX = properties.pos?.[0] ?? 0;
        this._posBaseY = properties.pos?.[1] ?? 0;
        [this._imgMainX, this._imgMainY] = WWAPictureItem._getImgPosByPicture(this._registry, true);
        [this._imgSubX, this._imgSubY] = WWAPictureItem._getImgPosByPicture(this._registry, false);
        this._mapCropCache = WWAPictureItem._getMapImgPosArray(this._registry, wwa);
        // イメージ画像がどれも 0, 0 の場合は何も描画しない（PICTURE 関数から呼び出す場合に黒四角が現れる対策）
        this._drawChip = canDrawChip(this._imgMainX, this._imgMainY, this._imgSubX, this._imgSubY) || this._mapCropCache !== null;
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

        this._fontStyle = WWAPictureItem._getFontValue(properties);
        this._textAlign = WWAPictureItem._convertTextAlign(properties.textAlign);
        const colorR = properties.color?.[0] ?? 0;
        const colorG = properties.color?.[1] ?? 0;
        const colorB = properties.color?.[2] ?? 0;
        this._fillStyle = `rgb(${colorR}, ${colorG}, ${colorB})`;

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

        this._angleRadian = properties.angle ? properties.angle * Math.PI / 180 : 0;
        this._rotateRadian = properties.rotate ? properties.rotate * Math.PI / 180 : 0;
        if (properties.text) {
            if (properties.angle || properties.rotate) {
                console.warn(`レイヤー${this.layerNumber}番: テキストの描画と回転の併用は、現時点では非推奨です。今後動作が変わる可能性があるので、自己責任でお願いします。`);
            }
            this._drawCoordType = "maximum";
        } else if (properties.angle || properties.rotate) {
            this._drawCoordType = "minimumWithMargin";
        } else {
            this._drawCoordType = "minimum";
        }
        
        this._updatePictureCache();
        const { width: canvasWidth, height: canvasHeight } = getPictureCanvasSize(
            this._drawCoordType, this._totalWidth, this._totalHeight
        );
        this._canvas = new PictureCacheCanvas(canvasWidth, canvasHeight);
        
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

        if (this._angleRadian !== 0) {
            const { x: offsetX, y: offsetY } = getTranslateOffsetForRotate(
                this._drawCoordType,
                this._totalWidth,
                this._totalHeight,
                this._posBaseX,
                this._posBaseY
            );
            this._canvas.ctx.translate(offsetX, offsetY);
            this._canvas.ctx.rotate(this._angleRadian);
            this._canvas.ctx.translate(-offsetX, -offsetY);
        }
        this.updateCanvasContext();
        this._hasAnimation = this.getHasAnimation();
    }

    public get layerNumber() {
        return this._registry.layerNumber;
    }

    public get hasAnimation() {
        return this._hasAnimation;
    }

    public get imageBitmap() {
        return this._canvas.imageBitmap;
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

    public updateCanvasContext() {
        // Canvas の ctx を色々いじる
        this._canvas.ctx.globalAlpha = WWAPictureItem._roundPercentage(this._opacity) / 100;
        this._canvas.ctx.font = this._fontStyle;
        this._canvas.ctx.textBaseline = "top";
        if (this._textAlign) {
            this._canvas.ctx.textAlign = this._textAlign;
        }
        this._canvas.ctx.fillStyle = this._fillStyle;
        // ピクチャの角度については clear しても角度設定はこのまま維持されるみたいなので、ここでは行わない
    }

    /**
     * ピクチャを描画します。
     * 毎フレーム処理されるため、プロパティから直接引き出される値以外はあらかじめフィールドに数値などをキャッシュしてください。
     */
    public draw(image: HTMLImageElement, isMainAnimation: boolean) {
        // TODO これをオフにするオプションがあっても良さそう
        this.clearCanvas();

        const imgPosX = isMainAnimation ? this._imgMainX : this._imgSubX;
        const imgPosY = isMainAnimation ? this._imgMainY : this._imgSubY;
        const { x: offsetX, y: offsetY } = getDrawPictureOffsetInCacheCanvas(this._drawCoordType, this._posDestX, this._posDestY);

        for (let ry = 0; ry < this._repeatY; ry++) {
            for (let rx = 0; rx < this._repeatX; rx++) {
                const chipX = offsetX + this._charaWidth * rx;
                const chipY = offsetY + this._charaHeight * ry;
                if (this._imgFile) {
                    this._canvas.drawCanvasFree(this._imgFile, chipX, chipY, this._charaWidth, this._charaHeight);
                } else if (this._drawChip) {
                    if (this._mapCropCache !== null) {
                        this._mapCropCache.forEach((line, y) => {
                            line.forEach(([cx, cy, cx2, cy2], x) => {
                                if (!canDrawChip(cx, cy, cx2, cy2)) {
                                    return;
                                }
                                this._canvas.drawCanvas(
                                    image,
                                    isMainAnimation ? cx : cx2,
                                    isMainAnimation ? cy : cy2,
                                    chipX + (this._chipWidth * x),
                                    chipY + (this._chipHeight * y),
                                    this._chipWidth,
                                    this._chipHeight
                                );
                            })
                        })
                    } else {
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
                if (this.getHasText()) {
                    this._canvas.drawFont(
                        this._registry.properties.text,
                        chipX,
                        chipY,
                        this._registry.properties.lineHeight
                    );
                }
            }
        }
        this._canvas.updateImageBitmap();
    }

    public getDrawPictureCoords() {
        return getDrawPictureCanvasCoords(
            this._drawCoordType,
            this._posDestX,
            this._posDestY,
            this._totalWidth,
            this._totalHeight
        );
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
        const { width: canvasWidth, height: canvasHeight } = getPictureCanvasSize(
            this._drawCoordType, this._totalWidth, this._totalHeight
        );
        this._canvas.updateSize(canvasWidth, canvasHeight);
        this._circleAngle = this._circleAngle + this._circleSpeed;
        if (this._fade !== 0) {
            this._opacity = this._opacity + this._fade;
            // opacity の変更反映は後の this.updateCanvasContext で行う
        }
        if (this._angleRadian !== 0 || this._rotateRadian !== 0) {
            this._angleRadian += this._rotateRadian;
            const { x: offsetX, y: offsetY } = getTranslateOffsetForRotate(
                this._drawCoordType,
                this._totalWidth,
                this._totalHeight,
                this._posBaseX,
                this._posBaseY
            );
            this._canvas.ctx.translate(offsetX, offsetY);
            this._canvas.ctx.rotate(this._angleRadian);
            this._canvas.ctx.translate(-offsetX, -offsetY);
        }
        // this._canvas.updateSize の Canvas のサイズ変更によって内部の CanvasContext がリセットされることがあるので再設定する
        this.updateCanvasContext();
    }

    private _updatePictureCache() {
        this._chipWidth = adjustPositiveValue(this._sizeX);
        this._chipHeight = adjustPositiveValue(this._sizeY);
        this._charaWidth = this._chipWidth * this._cropX;
        this._charaHeight = this._chipHeight * this._cropY;
        this._totalWidth = this._charaWidth * this._repeatX;
        this._totalHeight = this._charaHeight * this._repeatY;
        this._posDestX = Math.floor(
            getHorizontalCorrectionBySizeAnchor(
                getHorizontalCirclePosition(
                    this._posBaseX,
                    this._circleRadiusX,
                    this._circleAngle
                ),
                this._charaWidth,
                this._anchor
            )
        );
        this._posDestY = Math.floor(
            getVerticalCorrectionBySizeAnchor(
                getVerticalCirclePosition(
                    this._posBaseY,
                    this._circleRadiusY,
                    this._circleAngle
                ),
                this._charaHeight,
                this._anchor
            )
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
            this._fade !== 0 ||
            this._rotateRadian !== 0
        );
    }

    private getHasText() {
        return this._registry.properties.text;
    }

    private static _getImgPosByPicture(registry: PictureRegistry, isMainTime: boolean) {
        const { properties } = registry;
        if (properties.imgMap?.[0] !== undefined && properties.imgMap?.[1] !== undefined) {
            return [0, 0];
        }
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

    private static _getMapImgPosArray(registry: PictureRegistry, wwa: WWA): [number, number, number, number][][] | null {
        const { properties } = registry;
        const imgMapX = properties.imgMap?.[0] ?? -1;
        const imgMapY = properties.imgMap?.[1] ?? -1;
        // imgMap プロパティは [0, 0] も使用される場合があるため、負の値を指定した場合は未定義と扱うようにする
        if (imgMapX < 0 || imgMapY < 0) {
            return null;
        }
        const cropX = properties.crop?.[0] ?? 1;
        const cropY = properties.crop?.[1] ?? 1;
        const type = properties.imgMap?.[2] !== undefined && properties.imgMap[2] >= 1 ? PartsType.MAP : PartsType.OBJECT;
        const array = [];
        for (let my = 0; my < cropY; my++) {
            const line = [];
            for (let mx = 0; mx < cropX; mx++) {
                const id = wwa.getPartsID(new Coord(imgMapX + mx, imgMapY + my), type);
                if (id === 0) {
                    line.push([0, 0, 0, 0]);
                } else {
                    const info = type === PartsType.MAP ? wwa.getMapInfo(id) : wwa.getObjectInfo(id);
                    // 背景パーツでも ATR_X2 や ATR_Y2 に黒以外のイメージ座標が含まれている場合がある
                    if (type === PartsType.MAP || info[WWAConsts.ATR_X2] === 0 && info[WWAConsts.ATR_Y2] === 0) {
                        line.push([
                            info[WWAConsts.ATR_X] / WWAConsts.CHIP_SIZE,
                            info[WWAConsts.ATR_Y] / WWAConsts.CHIP_SIZE,
                            info[WWAConsts.ATR_X] / WWAConsts.CHIP_SIZE,
                            info[WWAConsts.ATR_Y] / WWAConsts.CHIP_SIZE,
                        ]);
                    } else {
                        line.push([
                            info[WWAConsts.ATR_X] / WWAConsts.CHIP_SIZE,
                            info[WWAConsts.ATR_Y] / WWAConsts.CHIP_SIZE,
                            info[WWAConsts.ATR_X2] / WWAConsts.CHIP_SIZE,
                            info[WWAConsts.ATR_Y2] / WWAConsts.CHIP_SIZE,
                        ]);
                    }
                }
            }
            array.push(line);
        }
        return array;
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

    private static _convertTextAlign(value: string): CanvasTextAlign | null {
        if (!value) {
            return null;
        }
        if (["center", "end", "left", "right", "start"].includes(value)) {
            return value as CanvasTextAlign;
        }
        // TODO 例外を投げるべき？
        console.warn(`textAlign プロパティで不正な値が検出されました。: ${value}`);
        return null;
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
