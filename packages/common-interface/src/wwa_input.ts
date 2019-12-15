/**
 * WWAの入力の状態管理を行うインターフェイスです。
 */
export default interface WWAInputStore {
    /**
     * 入力状態を次のフレームに送ります。
     */
    update(): void;
    /**
     * 入力状態を確認し、それぞれのInputStoreに対応したStateを出力します。
     */
    checkButtonState(): WWAInputState;
}

export enum WWAInputState {
    NONE,
    DOWN,
    PRESS,
    UP,
    PRESS_MESSAGECHANGE
}
