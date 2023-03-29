export type PictureRegistory = {
    type: 'picture',
    x: number,
    y: number,
    imageX: number,
    imageY: number,
    imageWidth: number,
    imageHeight: number
} | {
    type: 'text',
    x: number,
    y: number,
    text: string,
    font: string,
    size: number,
};
