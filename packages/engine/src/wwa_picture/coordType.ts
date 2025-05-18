import { WWAConsts } from "../wwa_data";
import { DrawCoordType } from "./typedef";

// 通常、ピクチャ機能は大量のピクチャの描画負荷を低減するため、描画サイズを最小限に設定しています。
// しかし text プロパティでテキスト描画をする場合、描画されるサイズがいくらあるのか容易に計測することができません
// そのため、この場合は画面内に描画できる最大サイズを算出して、描画可能範囲を広げるようにしています
// そして angle プロパティや rotate プロパティで回転する場合は、回転ではみ出た分が描画されないことがあります
// この場合は1マス分の余白を上下左右に設けて、描画可能範囲を広げるようにしています

export const getPictureCanvasSize = (
    type: DrawCoordType,
    width: number,
    height: number
) => {
    if (type === "maximum") {
        return {
            width: WWAConsts.MAP_WINDOW_WIDTH,
            height: WWAConsts.MAP_WINDOW_HEIGHT,
        }
    }
    if (type === "minimumWithMargin") {
        return {
            width: width + (WWAConsts.CHIP_SIZE * 2),
            height: height + (WWAConsts.CHIP_SIZE * 2),
        };
    }
    return {
        width,
        height,
    };
};

export const getDrawPictureOffsetInCacheCanvas = (
    type: DrawCoordType,
    posX: number,
    posY: number,
) => {
    if (type === "maximum") {
        return {
            x: posX,
            y: posY,
        };
    }
    if (type === "minimumWithMargin") {
        return {
            x: WWAConsts.CHIP_SIZE,
            y: WWAConsts.CHIP_SIZE,
        };
    }
    return {
        x: 0,
        y: 0,
    }
};

export const getDrawPictureCanvasCoords = (
    type: DrawCoordType,
    posX: number,
    posY: number,
    width: number,
    height: number
) => {
    if (type === "maximum") {
        return {
            x: 0,
            y: 0,
            width: WWAConsts.MAP_WINDOW_WIDTH,
            height: WWAConsts.MAP_WINDOW_HEIGHT,
        };
    }
    if (type === "minimumWithMargin") {
        return {
            x: posX - WWAConsts.CHIP_SIZE,
            y: posY - WWAConsts.CHIP_SIZE,
            width: width * (WWAConsts.CHIP_SIZE * 2),
            height: height * (WWAConsts.CHIP_SIZE * 2),
        };
    }
    return {
        x: posX,
        y: posY,
        width,
        height,
    };
};

export const getTranslateOffsetForRotate = (width: number, height: number) => {
    // TODO type が "maximum" の場合も考慮する
    return {
        x: WWAConsts.CHIP_SIZE + (width / 2),
        y: WWAConsts.CHIP_SIZE + (height / 2),
    };
};
