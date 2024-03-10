import { PictureProperties } from "@wwawing/common-interface/lib/wwa_picture";

type TimeType = "milisecond" | "frame";

/**
 * ピクチャ機能内部でフレームあるいはミリ秒でカウントするタイマーです。
 */
export class WWATimer {

    private _timer = 0;

    constructor(
        private _limitTime: number,
        private _timeType: TimeType
    ) {
    }

    public static createTimer(msTimeValue?: number, frameTimeValue?: number) {
        if (msTimeValue) {
            return new WWATimer(msTimeValue, "milisecond");
        } else if (frameTimeValue) {
            return new WWATimer(frameTimeValue, "frame");
        }
    }
    
    private static _getTimeValue (value: PictureProperties["time"] | PictureProperties["timeFrame"]) {
        return Array.isArray(value) ? value[0] : value;
    }

    public static createTimerOrArray(
        msTimeValue?: PictureProperties["time"],
        frameTimeValue?: PictureProperties["timeFrame"]
    ) {
        return WWATimer.createTimer(this._getTimeValue(msTimeValue), this._getTimeValue(frameTimeValue));
    }

    public tick(frameMs: number) {
        // タイムオーバーの場合は、余計な処理を回避するために無効にする
        if (this.isTimeOver()) {
            return;
        }
        switch (this._timeType) {
            case "milisecond":
                this._timer += frameMs;
                break;
            case "frame":
                this._timer++;
        }
    }

    public isTimeOver() {
        return this._timer >= this._limitTime;
    }
}
