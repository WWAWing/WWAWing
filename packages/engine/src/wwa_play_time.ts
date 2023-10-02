/**
 * プレイ時間を計算してくれるやつ
 * ロードやTIME代入などを実施する場合はインスタンスを作り直してください。
 */
export class PlayTimeCalculator {
    /**
     * 最後にプレイ時間を計算した時刻
     */
    private lastCalculatedTimeUnixMs: number;

    /**
     * 最後に計算されたプレイ時間
     */
    private lastCalculatedPlayTimeMs: number;

    /**
     * @param baseTimeMs プレイ時間の初期値。この時間からカウントされます。
     */
    constructor(baseTimeMs: number = 0) {
        this.lastCalculatedTimeUnixMs = Date.now();
        this.lastCalculatedPlayTimeMs = baseTimeMs;
    }

    /**
     * プレイ時間を計算して返します。
     * @returns プレイ時間
     */
    public calculateTimeMs(): number {
        const now = Date.now();
        // 前回計算が走った時刻から現在までの時間を、前回計算した時刻を加算するとプレイ時間になる
        const newPlayTime = now - this.lastCalculatedTimeUnixMs + this.lastCalculatedPlayTimeMs;
        this.lastCalculatedTimeUnixMs = now;
        this.lastCalculatedPlayTimeMs = newPlayTime;
        return newPlayTime;
    }

    /**
     * HHHH:MM:SS 形式のプレイ時間文字列を計算して返します。
     */
    public calculatePlayTimeFormat(): string {
        return PlayTimeCalculator.formatPlayTimeText(
          this.calculateTimeMs() / 1000
        );
   }

    /**
     * HHHH:MM:SS 形式のプレイ時間文字列を返します。
     * @param 変換する時間（秒）
     */
    public static formatPlayTimeText(timeSec: number): string {
        const flooredSec = Math.floor(timeSec);
        // FIY: 0とのビットOR( | ) は 小数点以下切り捨て
        return flooredSec >= 60 * 60 * 10000 ?
            "9999:99:99" :
            ("000" + ((flooredSec / 60 / 60) | 0)).slice(-4) +
            ":" + ("0" + (((flooredSec / 60) | 0) % 60)).slice(-2) +
            ":" + ("0" + (flooredSec % 60)).slice(-2);
    }

}
