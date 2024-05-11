import { getPlayerCoordPx, getPlayerCoordPy } from "../symbols";

describe("symbols", () => {
    describe("getPlayerCoordPx", () => {
        test("現在座標からプレイヤーのピクセル座標を算出する (10以上)", () => {
            expect(getPlayerCoordPx(19)).toBe(360);
        });
        test("現在座標からプレイヤーのピクセル座標を算出する (10未満)", () => {
            expect(getPlayerCoordPx(3)).toBe(120);
        });
        test("画面の端にいる場合で、左端にいる場合は左端のピクセル座標を算出する", () => {
            expect(getPlayerCoordPx(10)).toBe(0);
        });
        test("画面の端にいる場合で、右端にいる場合は右端のピクセル座標を算出する", () => {
            expect(getPlayerCoordPx(20)).toBe(400);
        });
    });
    describe("getPlayerCoordPy", () => {
        test("現在座標からプレイヤーのピクセル座標を算出する (10以上)", () => {
            expect(getPlayerCoordPy(96)).toBe(240);
        });
        test("現在座標からプレイヤーのピクセル座標を算出する (10未満)", () => {
            expect(getPlayerCoordPy(5)).toBe(200);
        });
        test("現在座標からプレイヤーのピクセル座標を算出する", () => {
            expect(getPlayerCoordPy(96)).toBe(240);
        });
        test("画面の端にいる場合で、上端にいる場合は上端のピクセル座標を算出する", () => {
            expect(getPlayerCoordPy(30)).toBe(0);
        });
        test("画面の端にいる場合で、下端にいる場合は下端のピクセル座標を算出する", () => {
            expect(getPlayerCoordPy(40)).toBe(400);
        });
    });
});
