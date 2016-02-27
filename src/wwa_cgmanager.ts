/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_input.ts" />
/// <reference path="./wwa_camera.ts" />
/// <reference path="./wwa_main.ts" />

module wwa_cgmanager {
    import Consts = wwa_data.WWAConsts;
    import Position = wwa_data.Position;
    export class CGManager {
        private _ctx: CanvasRenderingContext2D;
        private _ctxSub: CanvasRenderingContext2D;
        private _isLoaded: boolean = false;
        private _fileName: string;
        private _loadCompleteCallBack: () => void;
        private _image: HTMLImageElement;

        private _load(): void {

            if ( this._isLoaded) {
                return;
            }

            this._image = new Image();
            this._image.addEventListener("load", () => {
                this._loadCompleteCallBack();
            });
            this._image.addEventListener("error", () => {
                throw new Error("Image Load Failed!!\nfile name:" + this._fileName); 
            });
            this._image.src = this._fileName;
            this._isLoaded = true;
        }
        
        public drawCanvas(chipX: number, chipY: number, canvasX: number, canvasY: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
           );
        }

        public drawCanvasWithSize(chipX: number, chipY: number, width: number, height: number, canvasX: number, canvasY: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
                Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height, canvasX, canvasY,
                Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height
           );
        }


        public drawCanvasWithUpperYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, canvasY + Consts.CHIP_SIZE - yLimit);
            if ( delLength >= Consts.CHIP_SIZE) {
                return;
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
           );
        }

        public drawCanvasWithLowerYLimit(chipX: number, chipY: number, canvasX: number, canvasY: number, yLimit: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, yLimit - canvasY);
            if (delLength >= Consts.CHIP_SIZE) {
                return;
            }
            ctx.drawImage(
                this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength,
                Consts.CHIP_SIZE, Consts.CHIP_SIZE
           );
        }

        public clearCanvas(x: number, y: number, w: number, h: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.clearRect(x, y, w, h);
        }

        public drawBase(x: number, y: number, w: number, h: number, isSub: boolean = false): void {
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.fillStyle = "#9E9E9E";
            ctx.fillRect(x, y, w, h);
        }



        public constructor(ctx: CanvasRenderingContext2D, ctxSub: CanvasRenderingContext2D, fileName: string, loadCompleteCallBack: () => void) {
            this._ctx = ctx;
            this._ctxSub = ctxSub;
            this._fileName = fileName;  
            this._loadCompleteCallBack = loadCompleteCallBack;
            this._load();
        } 
    }

}
