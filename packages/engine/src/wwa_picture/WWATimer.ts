import { TimePointName, TimePoint } from "./typedef";

/**
 * ピクチャ機能内部でフレームとミリ秒でカウントするタイマーです。
 */
export class WWATimer {

    private _milisecondTimer = 0;
    private _frameTimer = 0;
    private _points = new Map<TimePointName, TimePoint>();
    private _milisecondLimit: number;
    private _frameLimit: number;

    constructor() {
    }

    public addPoint(name: TimePointName, milisecondValue?: number, frameValue?: number) {
        if (!milisecondValue && !frameValue) {
            return;
        }
        const newTimePoint = createTimePoint(milisecondValue, frameValue);
        this._points.set(name, newTimePoint);
    };

    public enabled() {
        return this._points.size > 0;
    }

    public tick(frameMs: number) {
        // タイムオーバーの場合は、余計な処理を回避するために無効にする
        if (!this.enabled() || this.isTimeOver()) {
            return;
        }
        this._milisecondTimer += frameMs;
        this._frameTimer++;
    }

    public isOver(name: TimePointName, noPointResult: boolean) {
        if (this._points.has(name)) {
            const point = this._points.get(name);
            switch (point.type) {
                case "milisecond":
                    return this._milisecondTimer >= point.value;
                case "frame":
                    return this._frameTimer >= point.value;
                default:
                    return false;
            }
        }
        return noPointResult;
    }

    public isNotOver(name: TimePointName, noPointResult: boolean) {
        if (this._points.has(name)) {
            const point = this._points.get(name);
            switch (point.type) {
                case "milisecond":
                    return this._milisecondTimer < point.value;
                case "frame":
                    return this._frameTimer < point.value;
                default:
                    return false;
            }
        }
        return noPointResult;
    }

    public isTimeOver() {
        // TODO 実装する
        return false;
    }
}

export const createTimePoint = (milisecondValue?: number, frameValue?: number): TimePoint | undefined => {
    if (milisecondValue) {
        return {
            value: milisecondValue,
            type: "milisecond",
        };
    }
    if (frameValue) {
        return {
            value: frameValue,
            type: "frame",
        };
    }
    return undefined;
}
