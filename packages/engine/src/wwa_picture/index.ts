import { PictureRegistory } from "@wwawing/common-interface/lib/wwa_data";
import { CacheCanvas } from "../wwa_cgmanager";
import { WWAConsts } from "../wwa_data";
import { MAX_PICTURE_LAYERS_COUNT } from "./config";
import { PictureMacroArgs, TextMacroArgs, PictureItem } from "./typedef";

export default class WWAPicutre {
    private _pictures: PictureItem[];
    constructor() {
        for (let index = 0; index < MAX_PICTURE_LAYERS_COUNT; index++) {
            this._pictures[index] = null;
        }
    }

    public static convertPictureImageRegistory(args: PictureMacroArgs): PictureRegistory | null {
        if (args.srcPosX === 0 && args.srcPosY === 0) {
            return null;
        }
        return {
            type: "image",
            x: args.destPosX,
            y: args.destPosY,
            layerNumber: args.layerNumber,
            imageX: args.srcPosX,
            imageY: args.srcPosY,
            imageWidth: args.srcWidth,
            imageHeight: args.srcHeight,
        };
    }

    public static convertPictureTextRegistory(args: TextMacroArgs): PictureRegistory {
        return {
            type: "text",
            x: args.destPosX,
            y: args.destPosY,
            layerNumber: args.layerNumber,
            text: args.text,
            font: "sans-serif", // TODO 仮
            size: args.sizePt,
        };
    }

    public registPictureImage(registory: PictureRegistory) {
        const canvas = registory.type === "text"
            ? new CacheCanvas(
                WWAConsts.CHIP_SIZE * WWAConsts.H_PARTS_NUM_IN_WINDOW,
                WWAConsts.CHIP_SIZE * WWAConsts.V_PARTS_NUM_IN_WINDOW,
                true
            )
            : new CacheCanvas(
                registory.imageWidth * WWAConsts.CHIP_SIZE,
                registory.imageHeight * WWAConsts.CHIP_SIZE,
                true
            );
        this._pictures[registory.layerNumber] = {
            ...registory,
            canvas,
        }
    }

    public registPictureText(args: TextMacroArgs) {
        this._pictures[args.layerNumber] = {
            canvas: new CacheCanvas(
                WWAConsts.CHIP_SIZE * WWAConsts.H_PARTS_NUM_IN_WINDOW,
                WWAConsts.CHIP_SIZE * WWAConsts.V_PARTS_NUM_IN_WINDOW,
                true
            ),
            layerNumber: args.layerNumber,
            type: "text",
            x: args.destPosX,
            y: args.destPosY,
            text: args.text,
            font: "sans-serif", // TODO 仮
            size: args.sizePt,
        }
    }

    public deletePicture(layerNumber: number) {
        if (!this._pictures[layerNumber]) {
            return;
        }
        this._pictures[layerNumber].canvas.clear();
        this._pictures[layerNumber] = null;
    }

    public forEachPictures(caller: (picture: PictureItem) => void) {
        this._pictures.forEach((picture) => {
            if (picture === null) {
                return;
            }
            caller(picture);
        });
    }

    public updatePictures(image: HTMLImageElement) {
        this.forEachPictures((picture) => {
            if (picture.layerNumber !== 0) {
                picture.canvas.clear();
            }
            switch (picture.type) {
                case "image":
                    picture.canvas.drawCanvas(
                        image,
                        picture.imageX,
                        picture.imageY,
                        picture.x,
                        picture.y
                    );
                    break;
                case "text":
                    console.warn("現在未実装です。");
            }
        })
    }
}
