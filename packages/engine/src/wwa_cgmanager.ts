
import { WWAConsts as Consts, Coord } from "./wwa_data";

export class CacheCanvas {
    public cvs: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public constructor(width: number, height: number, alpha: boolean) {
        this.cvs = document.createElement("canvas");
        this.cvs.width = width;
        this.cvs.height = height;
        this.ctx = this.cvs.getContext("2d", { alpha: alpha });
        //document.body.appendChild(this.cvs);
    }
    public drawCanvas(_image, chipX: number, chipY: number, canvasX: number, canvasY: number): void {
        this.ctx.drawImage(
            _image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE
        );
    }
    public clear() {
        this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
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
    public mapCache: number[] = void 0;
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
        this._frameCanvas = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW , true);
        this._backCanvas = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW , false);
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
    public copyBackCanvasWithUpperYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number): void {
        if (!this._isLoaded) {
            throw new Error("No image was loaded.");
        }
        var delLength = Math.max(0, canvasY + Consts.CHIP_SIZE - yLimit);
        if (delLength >= Consts.CHIP_SIZE) {
            return;
        }
        this._backCanvas.ctx.drawImage(
            this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE
        );
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
    public clearBackCanvas(): void {
        this._backCanvas.clear();
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

    public constructor(ctx: CanvasRenderingContext2D, fileName: string, _frameCoord: Coord, loadCompleteCallBack: () => void) {
        this._ctx = ctx;
        this._fileName = fileName;
        this._loadCompleteCallBack = loadCompleteCallBack;
        this._load();
        this._frameCoord = _frameCoord.clone();
        this.cpPartsLog = new Coord(0, 0);
    }
}

