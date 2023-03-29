import { MAX_PICTURE_LAYERS_COUNT } from "./config";
import { PictureRegistory } from "./typedef";

export default class WWAPicutre {
    private freeLayerElement: HTMLCanvasElement;
    private freeLayerCanvasContext: CanvasRenderingContext2D;
    private registory: (PictureRegistory | null)[];
    constructor() {
        this.freeLayerElement = document.createElement('canvas');
        this.freeLayerCanvasContext = this.freeLayerElement.getContext('2d');
        for (let index = 0; index <= MAX_PICTURE_LAYERS_COUNT; index++) {
            this.registory.push(null);
        }
    }
    public drawImage(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.freeLayerElement, 0, 0);
        // TODO registory からイメージ画像を描画する。 WWA イメージ画像をどこから持っていくか？
    }
}
