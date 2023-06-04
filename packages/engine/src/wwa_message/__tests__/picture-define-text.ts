import { getPictureDefineText } from "../utils";

describe("pictureDefineText", () => {
    it("<picture> 以降のピクチャ定義が取得できる", () => {
        const messageText = `ピクチャを表示します。
<picture>
{
    "pos": [10, 10]
}`;
        const result = getPictureDefineText(messageText);
        expect(result).toBe(`
{
    "pos": [10, 10]
}`);
    });
});
