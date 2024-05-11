import { WWAConsts } from "../../wwa_data";

export const getPlayerCoordPx = (playerX: number) => {
    return (playerX % (WWAConsts.H_PARTS_NUM_IN_WINDOW - 1)) * WWAConsts.CHIP_SIZE;
};

export const getPlayerCoordPy = (playerY: number) => {
    return (playerY % (WWAConsts.V_PARTS_NUM_IN_WINDOW - 1)) * WWAConsts.CHIP_SIZE;
};
