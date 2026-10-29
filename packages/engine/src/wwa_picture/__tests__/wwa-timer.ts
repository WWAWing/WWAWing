import { WWATimer } from "../WWATimer";

describe("WWATimer", () => {
    it("タイムリミットが追加したポイントの最大値になっている", () => {
        const timer = new WWATimer();
        timer.addPoint("start", 100);
        timer.addPoint("startAnim", undefined, 5);
        timer.addPoint("endAnim", undefined, 50);
        timer.addPoint("wait", undefined, 99999);
        timer.addPoint("end", 1000);
        const { milisecond, frame } = timer.timeLimit;
        expect(milisecond).toBe(1000);
        expect(frame).toBe(99999);
    });
    it("タイムリミットを過ぎると無効化される", () => {
        const timer = new WWATimer();
        timer.addPoint("start", undefined, 1);
        timer.addPoint("end", undefined, 2);
        timer.tick(1);
        timer.tick(1);
        timer.tick(1);
        expect(timer.enabled()).toBe(false);
    });
});
