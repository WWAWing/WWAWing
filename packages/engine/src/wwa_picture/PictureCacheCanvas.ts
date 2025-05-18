import { WWAConsts as Consts } from "../wwa_data";

export class PictureCacheCanvas {
    private canvas: OffscreenCanvas;
    public ctx: OffscreenCanvasRenderingContext2D;
    public imageBitmap: ImageBitmap;

    constructor(width: number, height: number) {
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext("2d", { alpha: true });
        // TODO オプションでオフにできるようにしたい
        this.ctx.imageSmoothingEnabled = false;
        this.updateImageBitmap();
    }

    /**
     * 内部の OffscreenCanvas をより軽量な ImageBitmap に変換生成します。
     * OffscreenCanvas の内容が変わった場合は必ず実行してください。
     */
    public updateImageBitmap() {
        this.imageBitmap = this.canvas.transferToImageBitmap();
    }

    /**
     * 内部の OffscreenCanvas を更新します。
     * PictureCacheCanvas は内部の　Canvas のサイズを最小限に抑えているため、描画位置の指定は　PictureCacheCanvas の描画側で実装してください。
     *
     * @param _image 読み取る画像
     * @param canvasX ピクチャ内で描画するX座標 (pos プロパティの値は含めないこと)
     * @param canvasY ピクチャ内で描画するY座標 (pos プロパティの値は含めないこと)
     * @param chipX 読み取る画像のX座標 (マス単位)
     * @param chipY 読み取る画像のX座標 (マス単位)
     * @param width 描画サイズの横幅
     * @param height 描画サイズの縦幅
     */
    public drawCanvas(_image, chipX: number, chipY: number, canvasX: number, canvasY: number, width = Consts.CHIP_SIZE, height = Consts.CHIP_SIZE): void {
        this.ctx.drawImage(
            _image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY,
            Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY,
            width, height
        );
    }
    public drawCanvasFree(image: HTMLImageElement, canvasX: number, canvasY: number, width: number, height: number): void {
        this.ctx.drawImage(image, canvasX, canvasY, width, height);
    }
    /**
     * フォントを描画します。色などの設定はあらかじめ ctx フィールドに設定しておいてください。
     */
    public drawFont(text: string, canvasX: number, canvasY: number, lineHeight?: number): void {
        if (lineHeight !== undefined) {
            const lines = text.split("\n");
            lines.forEach((line, index) => {
                // Canvas API では描画しているテキストから1行分の高さを簡単に算出することはできない (できても px 単位じゃなかったりする)
                // 引数 lineHeight の指定が必要
                this.ctx.fillText(line, canvasX, canvasY + (index * lineHeight));
            });
        } else {
            this.ctx.fillText(text, canvasX, canvasY);
        }
    }
    public updateSize(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    public clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
