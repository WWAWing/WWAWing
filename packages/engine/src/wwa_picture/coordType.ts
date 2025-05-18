import { WWAConsts } from "../wwa_data";
import { DrawCoordType } from "./typedef";

// 通常、ピクチャ機能は大量のピクチャの描画負荷を低減するため、描画サイズを最小限に設定しています。
// しかし text プロパティでテキスト描画をする場合、描画されるサイズがいくらあるのか容易に計測することができません
// そのため、この場合は画面内に描画できる最大サイズを算出して、描画可能範囲を広げるようにしています

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
    return {
        x: posX,
        y: posY,
        width,
        height,
    };
};
