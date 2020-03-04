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
     * @param inputType 確認したいボタンの種類
     * @returns {WWAInputState}
     */
    checkButtonState(inputType: WWAInputType): WWAInputState;
    /**
     * 指定したボタンに入力状態をセットします。
     * @param inputType セットしたいボタンの種類
     */
    setButtonInput(inputType: WWAInputType): void;
    /**
     * 指定したボタンに入力状態解除をセットします。
     * @param inputType 解除したいボタンの種類
     */
    setButtonRelease(inputType: WWAInputType): void;
}

export enum WWAInputState {
    NONE,
    DOWN,
    PRESS,
    UP,
    PRESS_MESSAGECHANGE
}

/**
 * WWAInputType はWWAで入力した内容を種別化するための enum です。
 *     Enter と Yes のように複数のボタンに対応したとしても、この WWAInputType では YES と同じ扱いとなります。
 *     この後 WWA のアップデートで新しい操作が追加された場合は、この enum を書き加えてください。
 *     現在は enum で管理されていますが、管理が難しい (例: 特定の番号のアイテムを呼び出す) 場合は、文字列で対応するかもしれません。
 */
export enum WWAInputType {
    UP,
    RIGHT,
    DOWN,
    LEFT,
    YES,
    NO,
    MESSAGE, // メッセージ送り
    ITEM_1,
    ITEM_2,
    ITEM_3,
    ITEM_4,
    ITEM_5,
    ITEM_6,
    ITEM_7,
    ITEM_8,
    ITEM_9,
    ITEM_10,
    ITEM_11,
    ITEM_12,
    ESTIMATE_REPORT, // 戦闘結果予測
    SPEED_UP,
    SPEED_DOWN,
    HOWOTO_CONTROL, // ショートカットキーの一覧
    CONTROL_PANEL_SELECT,
    QUICK_LOAD,
    PASSOWRD_LOAD,
    QUICK_SAVE,
    PASSWORD_SAVE,
    RESTART_GAME,
    GOTO_WWA
}

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
