import { WWAConsts } from "../../wwa_data";

/**
 * 画面内のプレイヤーの位置をX座標で算出します。
 * 画面端にプレイヤーがいる場合は、カメラ座標 {@link cameraX} に基づいて判別します。
 * @param playerX プレイヤーのマップ内のX座標
 * @param cameraX ゲームのカメラで、一番左のマスの座標 (例えば {@link playerX} が `128` の場合、 `120`)
 * @returns 画面内のプレイヤーのX座標。
 */
export const getPlayerCoordPx = (playerX: number, cameraX: number) => {
    return (playerX - cameraX) * WWAConsts.CHIP_SIZE;
};

/**
 * 画面内のプレイヤーの位置をY座標で算出します。
 * 画面端にプレイヤーがいる場合は、カメラ座標 {@link cameraY} に基づいて判別します。
 * @param playerY プレイヤーのマップ内のY座標
 * @param cameraY ゲームのカメラで、一番下のマスの座標 (例えば {@link playerY} が `256` の場合、 `250`)
 * @returns 画面内のプレイヤーのY座標。
 */
export const getPlayerCoordPy = (playerY: number, cameraY: number) => {
    return (playerY - cameraY) * WWAConsts.CHIP_SIZE;
};
