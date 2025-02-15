interface MessageFace {
    type: "face",
    data: {
        destPosX: number;
        destPosY: number;
        srcPosX: number;
        srcPosY: number;
        srcWidth: number;
        srcHeight: number;
    }
}

interface MessagePartsMove {
    type: "move",
    data: {
        moveNum: number;
    }
}

export type PageAdditionalItem = MessageFace | MessagePartsMove;
