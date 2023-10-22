
import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { WWAConsts as Consts, Coord } from "./wwa_data";
import WWAPicutre from "./wwa_picture";
import * as util from "./wwa_util";
import { WWA } from "./wwa_main";

export class CacheCanvas {
    public cvs: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    private _isTransparent: boolean;
    public constructor(width: number, height: number, isTransparent: boolean) {
        this.cvs = document.createElement("canvas");
        this.cvs.width = width;
        this.cvs.height = height;
        this.ctx = this.cvs.getContext("2d", { alpha: isTransparent });
        // TODO オプションでオフにできるようにしたい
        this.ctx.imageSmoothingEnabled = false;
        this._isTransparent = isTransparent;
        //document.body.appendChild(this.cvs);
    }
    public drawCanvas(_image, chipX: number, chipY: number, canvasX: number, canvasY: number, width = Consts.CHIP_SIZE, height = Consts.CHIP_SIZE): void {
        this.ctx.drawImage(
            _image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY,
            width, height
        );
    }
    public drawFont(text: string, canvasX: number, canvasY: number, customFont?: string, colorR = 0, colorG = 0, colorB = 0, textAlign?: CanvasTextAlign): void {
        this.ctx.save();
        const wwaStyle = getComputedStyle(util.$id("wwa-wrapper"));
        this.ctx.font = customFont ?? wwaStyle.font;
        if (textAlign) {
            this.ctx.textAlign = textAlign;
        }
        this.ctx.fillStyle = `rgb(${colorR}, ${colorG}, ${colorB})`;
        this.ctx.fillText(text, canvasX, canvasY);
        this.ctx.restore();
    }
    public clear() {
        this.clearRect(0, 0, this.cvs.width, this.cvs.height);
    }

    /**
     * yLimit より上の領域を削除します。
     * @param yLimit Y座標の境界値
     */
    public clearRectWithLowerYLimit(yLimit: number) {
        this.clearRect(0, 0, this.cvs.width, yLimit);
    }

    private clearRect(x: number, y: number, width: number, height: number) {
        if (!this._isTransparent) {
            this.ctx.fillStyle = "#9E9E9E";
            this.ctx.fillRect(x, y, width, height);
        } else {
            this.ctx.clearRect(x, y, width, height);
        }
    }
}

export class CGManager {
    private _ctx: CanvasRenderingContext2D;
    private _isLoaded: boolean = false;
    private _fileName: string;
    private _loadCompleteCallBack: () => void;
    private _image: HTMLImageElement;
    private _frameCanvas: CacheCanvas;
    private _backCanvas: CacheCanvas;
    private _objectCanvases: CacheCanvas[];
    private _effectCanvases: CacheCanvas[];
    public picture: WWAPicutre;
    public mapCache: number[] = void 0;
    public mapObjectCache: number[] = void 0;
    public mapCacheYLimit: number = 0;
    public cpPartsLog: Coord;
    private _frameCoord: Coord;

    private _load(): void {
        this._frameCoord

        if (this._isLoaded) {
            return;
        }
        this.mapCache = [
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
        ];
        this.mapObjectCache = [
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
        ]; 

        this._image = new Image();
        this._image.addEventListener("load", () => {
            this.createFrame();
            this._loadCompleteCallBack();
        });
        this._image.addEventListener("error", () => {
            throw new Error("Image Load Failed!!\nfile name:" + this._fileName);
        });
        this._image.src = this._fileName;
        this._isLoaded = true;
    }

    private createFrame(): void {
        this._frameCanvas.clear();
        // 左上端
        this._frameCanvas.drawCanvas(this._image, this._frameCoord.x, this._frameCoord.y, 0, 0);
        // 右上端
        this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 2, this._frameCoord.y, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, 0);
        // 左下端
        this._frameCanvas.drawCanvas(this._image, this._frameCoord.x, this._frameCoord.y + 2, 0, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE);
        // 右下端
        this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 2, this._frameCoord.y + 2, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE);

        for (var i = 1; i < Consts.H_PARTS_NUM_IN_WINDOW - 1; i++) {
            // 上
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 1, this._frameCoord.y, Consts.CHIP_SIZE * i, 0);
            // 下
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 1, this._frameCoord.y + 2, Consts.CHIP_SIZE * i, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE);
        }
        for (var i = 1; i < Consts.V_PARTS_NUM_IN_WINDOW - 1; i++) {
            // 左
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x, this._frameCoord.y + 1, 0, Consts.CHIP_SIZE * i);
            // 右
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 2, this._frameCoord.y + 1, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, Consts.CHIP_SIZE * i);
        }
    }
    public updateEffects(effectCoords: Coord[]): void {
        var i: number;
        if (!effectCoords) {
            return;
        }
        var len: number = effectCoords.length;
        var effectCanvas: CacheCanvas;
        for (i = 0; i < len; i++) {
            var coord: Coord = effectCoords[i];
            effectCanvas = this._effectCanvases[i];
            if (!effectCanvas) {
                effectCanvas = this._effectCanvases[i] = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW, true);
            } else {
                effectCanvas.clear();
            }

            for (var y = 0; y < Consts.V_PARTS_NUM_IN_WINDOW; y++) {
                for (var x = 0; x < Consts.H_PARTS_NUM_IN_WINDOW; x++) {
                    effectCanvas.drawCanvas(this._image,
                        coord.x,
                        coord.y,
                        x * Consts.CHIP_SIZE,
                        y * Consts.CHIP_SIZE);
                }
            }
        }
    }

    public updatePictures(regitories: PictureRegistory[]): void {
        this.picture.clearAllPictures();
        regitories.forEach((registory) => {
            this.picture.registerPicture(registory);
        });
    }
    public updatePicturesCache(isMainAnimation = true): void {
        this.picture.updatePicturesCache(this._image, isMainAnimation);
    }

    public drawFrame(): void {
        // 全
        //this._ctx.drawImage(this._frameCanvas.cvs,
        //    0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW,
        //    0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
        // 上
        this._ctx.drawImage(this._frameCanvas.cvs,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE);
        // 下
        this._ctx.drawImage(this._frameCanvas.cvs,
            0, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE,
            0, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE);
        // 左
        this._ctx.drawImage(this._frameCanvas.cvs,
            0, Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2),
            0, Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2));
        // 右
        this._ctx.drawImage(this._frameCanvas.cvs,
            Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2),
            Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2));

    }

    public drawEffect(id: number): void {
        var effectCanvas: CacheCanvas = this._effectCanvases[id];
        if (!effectCanvas) {
            return;
        }
        this._ctx.drawImage(effectCanvas.cvs,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
    }

    public drawPictures(): void {
        this.picture.forEachPictures((picture) => {
            this._ctx.drawImage(picture.cvs,
                0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW,
                0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
        });
    }

    public drawCanvas(chipX: number, chipY: number, canvasX: number, canvasY: number): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        this._ctx.drawImage(
            this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE
        );
    }

    public drawCanvasWithSize(chipX: number, chipY: number, width: number, height: number, canvasX: number, canvasY: number): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        this._ctx.drawImage(
            this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
            Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height, canvasX, canvasY,
            Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height
        );
    }


    public drawCanvasWithUpperYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        var delLength = Math.max(0, canvasY + Consts.CHIP_SIZE - yLimit);
        if (delLength >= Consts.CHIP_SIZE) {
            return;
        }
        this._ctx.drawImage(
            this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE
        );
    }

    /**
     * 指定したキャッシュキャンバスに画像データを書き込みます。
     * @param cacheCanvas 
     * @param delLengthFunc 
     */
    private copyCanvas(cacheCanvas: CacheCanvas, delLengthFunc: (canvasY: number, yLimit: number) => number):
        (chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number) => void
    {
        return (chipX, chipY, canvasX, canvasY, yLimit) => {
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            const delLength = Math.max(0, delLengthFunc(canvasY, yLimit));
            if (delLength >= Consts.CHIP_SIZE) {
                return;
            }
            cacheCanvas.ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
            );
        };
    }

    public copyBackCanvasWithUpperYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        this.copyCanvas(this._backCanvas, (canvasY, yLimit) => canvasY + Consts.CHIP_SIZE - yLimit)(chipX, chipY, canvasX, canvasY, yLimit);
    }

    public copyBackCanvasWithLowerYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        this.copyCanvas(this._backCanvas, (canvasY, yLimit) => yLimit - canvasY)(chipX, chipY, canvasX, canvasY, yLimit);
    }

    public copyObjectCanvasWithUpperYLimit(frameType: number, chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        this.copyCanvas(this._objectCanvases[frameType], (canvasY, yLimit) => canvasY + Consts.CHIP_SIZE - yLimit)(chipX, chipY, canvasX, canvasY, yLimit);
    }

    public copyObjectCanvasWithLowerYLimit(frameType: number, chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        this.copyCanvas(this._objectCanvases[frameType], (canvasY, yLimit) => yLimit - canvasY)(chipX, chipY, canvasX, canvasY, yLimit);
    }

    public drawBackCanvas(): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        this._ctx.drawImage(
            this._backCanvas.cvs,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW
        );
    }
    public drawObjectCanvas(frameType: number): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        this._ctx.drawImage(
            this._objectCanvases[frameType].cvs,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW,
            0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW
        );
    }
    public clearBackCanvas(): void {
        this._backCanvas.clear();
    }
    public clearBackCanvasWithLowerYLimit(yLimit: number): void {
        this._backCanvas.clearRectWithLowerYLimit(yLimit);
    }
    public clearObjectCanvases(): void {
        var i;
        for (i = 0; i < 2; i++) {
            this._objectCanvases[i].clear();
        }
    }
    public clearObjectCanvasesWithLowerYLimit(yLimit: number): void {
        var i;
        for (i = 0; i < 2; i++) {
            this._objectCanvases[i].clearRectWithLowerYLimit(yLimit);
        }
    }

    public drawCanvasWithLowerYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        var delLength = Math.max(0, yLimit - canvasY);
        if (delLength >= Consts.CHIP_SIZE) {
            return;
        }
        this._ctx.drawImage(
            this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE
        );
    }

    public clearCanvas(x: number, y: number, w: number, h: number): void {
        this._ctx.clearRect(x, y, w, h);
    }

    public drawBase(x: number, y: number, w: number, h: number): void {
        this._ctx.fillStyle = "#9E9E9E";
        this._ctx.fillRect(x, y, w, h);
    }

    /**
     * フレーム画像を変更し、そのフレーム画像から Canvas を再作成します。
     * @param frameCoord フレーム画像一番左上端の座標
     */
    public setFrameImage(frameCoord: Coord): void {
        this._frameCoord = frameCoord;
        this.createFrame();
    }

    public constructor(ctx: CanvasRenderingContext2D, fileName: string, _frameCoord: Coord, wwa: WWA, loadCompleteCallBack: () => void) {

        this._frameCanvas = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW, true);
        this._backCanvas = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW, false);
        this._objectCanvases = [];
        this._effectCanvases = [];
        this.picture = new WWAPicutre(wwa);
        var i;
        for (i = 0; i < 2; i++) {
            this._objectCanvases[i] = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW, true);
        }
        this._ctx = ctx;
        this._fileName = fileName;
        this._loadCompleteCallBack = loadCompleteCallBack;
        this._load();
        this._frameCoord = _frameCoord.clone();
        this.cpPartsLog = new Coord(0, 0);
    }
}
