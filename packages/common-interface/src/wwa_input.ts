/**
 * WWAの入力の状態管理を行うインターフェイスです。
 *     1つのコントローラーに対して必ずこの interface を抽象化したクラスを用意する必要があります。
 *     コントローラーとは、マウスやキーボードなどの操作デバイス1つ1つのことを指します。
 */
export interface WWAInputStore {
    /**
     * 入力状態を次のフレームに送ります。
     */
    update(): void;
    /**
     * 入力状態を確認し、それぞれのInputStoreに対応したStateを出力します。
     *     MキーとF1キーのように、1つの操作に対して複数の操作方法が存在する場合があるかもしれないので、配列で出力します。
     * @param inputType 確認したいボタンの種類
     * @param forControllPlayer プレイヤー操作用の入力状態を使用するか
     */
    checkButtonState(inputType: WWAInputType, forControllPlayer?: boolean): Array<WWAInputState>;
    /**
     * 入力状態をクリアします。
     */
    clear(): void;
    /**
     * 現在の入力の状態をプレイヤー操作用の状態に移します。
     */
    memorizeKeyStateOnControllableFrame(): void;
    /**
     * 指定した入力状態がどのくらい続いているか調べます。
     *     対応していない場合は null になります。
     */
    getInputContinueFrameNum(inputType: WWAInputType): number | null;
}

export enum WWAInputState {
    NONE,
    DOWN,
    PRESS,
    UP,
    PRESS_MESSAGECHANGE
}

/**
 * WWADirectionType は入力した方向を種別化するためのタイプです。
 *     プレイヤーの操作関係で4方向のみ対応できるようにするために、後述の WWAInputType と別にしています。
 */
export type WWADirectionType =
    'UP' |
    'RIGHT' |
    'DOWN' |
    'LEFT';

/**
 * WWAInputType はWWAで入力した内容を種別化するためのタイプです。
 *     Enter と Yes のように複数のボタンに対応したとしても、この WWAInputType では YES と同じ扱いとなります。
 *     この後 WWA のアップデートで新しい操作が追加された場合は、この type に文字列を書き加えてください。
 */
export type WWAInputType =
    WWADirectionType |
    'YES' |
    'NO' |
    'MESSAGE' | // メッセージ送り
    'ITEM_1' |
    'ITEM_2' |
    'ITEM_3' |
    'ITEM_4' |
    'ITEM_5' |
    'ITEM_6' |
    'ITEM_7' |
    'ITEM_8' |
    'ITEM_9' |
    'ITEM_10' |
    'ITEM_11' |
    'ITEM_12' |
    'ESTIMATE_REPORT' | // 戦闘結果予測
    'SPEED_UP' |
    'SPEED_DOWN' |
    'HOWOTO_CONTROL' | // ショートカットキーの一覧
    'CONTROL_PANEL_SELECT' |
    'QUICK_LOAD' |
    'PASSOWRD_LOAD' |
    'QUICK_SAVE' |
    'PASSWORD_SAVE' |
    'RESTART_GAME' |
    'GOTO_WWA' |
    'SOUNDLOAD_STOP' | // サウンド読み込みの中止
    'SHOW_VARIABLES';

/**
 * WWAInputStore を種別化するための enum です。
 *     特定のコントローラーだけに対して操作を確認したい場合に使用します。
 */
export enum WWAInputStoreType {
    MOUSE,
    KEYBOARD,
    GAMEPAD,
    VIRTUALPAD
}
