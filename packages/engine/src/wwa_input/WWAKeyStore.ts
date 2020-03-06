import { WWAInputStore, WWAInputType, WWAInputState } from "@wwawing/common-interface";
import { WWAConsts } from "../wwa_data";

export enum KeyState {
    NONE,
    KEYDOWN,
    KEYPRESS,
    KEYUP,
    KEYPRESS_MESSAGECHANGE // TODO: 必要なのか調べる
}

/**
 * キーの名前と対応しているコードを記したオブジェクトです。
 */
export const KeyCode: {[key: string]: number} = {
    KEY_ENTER: 13,
    KEY_SHIFT: 16,
    KEY_ESC: 27,
    KEY_SPACE: 32,
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    KEY_1: 49,
    KEY_2: 50,
    KEY_3: 51,
    KEY_A: 65,
    KEY_C: 67,
    KEY_D: 68,
    KEY_E: 69,
    KEY_I: 73,
    KEY_M: 77,
    KEY_N: 78,
    KEY_P: 80,
    KEY_Q: 81,
    KEY_S: 83,
    KEY_W: 87,
    KEY_X: 88,
    KEY_Y: 89,
    KEY_Z: 90,
    KEY_F1: 112,
    KEY_F2: 113,
    KEY_F3: 114,
    KEY_F4: 115,
    KEY_F5: 116,
    KEY_F6: 117,
    KEY_F7: 118,
    KEY_F8: 119,
    KEY_F9: 120,
    KEY_F12: 123
}

/**
 * @todo KeyCode の値にしか対応出来ないようにしたいが、可能か？ 調べる
 * @see KeyCode
 */
export type KeyCodeValue = number;

const InputKeyTable: {[key in WWAInputType]: Array<KeyCodeValue>} = {
    UP: [KeyCode.KEY_UP],
    RIGHT: [KeyCode.KEY_RIGHT],
    DOWN: [KeyCode.KEY_DOWN],
    LEFT: [KeyCode.KEY_LEFT],
    YES: [KeyCode.KEY_Y],
    NO: [KeyCode.KEY_N],
    MESSAGE: [KeyCode.KEY_SPACE], // メッセージ送り
    ITEM_1: [KeyCode.KEY_1],
    ITEM_2: [KeyCode.KEY_2],
    ITEM_3: [KeyCode.KEY_3],
    ITEM_4: [KeyCode.KEY_Q],
    ITEM_5: [KeyCode.KEY_W],
    ITEM_6: [KeyCode.KEY_E],
    ITEM_7: [KeyCode.KEY_A],
    ITEM_8: [KeyCode.KEY_S],
    ITEM_9: [KeyCode.KEY_D],
    ITEM_10: [KeyCode.KEY_Z],
    ITEM_11: [KeyCode.KEY_X],
    ITEM_12: [KeyCode.KEY_C],
    ESTIMATE_REPORT: [KeyCode.KEY_M, KeyCode.KEY_F1], // 戦闘結果予測
    SPEED_UP: [KeyCode.KEY_P, KeyCode.KEY_F2],
    SPEED_DOWN: [KeyCode.KEY_I],
    HOWOTO_CONTROL: [KeyCode.KEY_F12], // ショートカットキーの一覧
    CONTROL_PANEL_SELECT: [],
    QUICK_LOAD: [KeyCode.KEY_F5],
    PASSOWRD_LOAD: [KeyCode.KEY_F3],
    QUICK_SAVE: [KeyCode.KEY_F6],
    PASSWORD_SAVE: [KeyCode.KEY_F4],
    RESTART_GAME: [KeyCode.KEY_F7],
    GOTO_WWA: [KeyCode.KEY_F8]
}

/**
 * キーボードの入力状態を管理するクラスです。
 * @todo wwa_input/KeyStore の移行を完了させる
 */
export default class WWAKeyStore implements WWAInputStore {
    /**
     * 許容できる同士対応キー数
     */
    public static KEY_BUFFER_MAX = 256;
    /**
     * 次入力されることが確定されたか？ の種類ごとの配列
     */
    private _nextKeyState: Array<boolean>;
    /**
     * 現在入力されているか？ の種類ごとの配列
     */
    private _keyState: Array<boolean>;
    /**
     * 前回入力されていたか？ の種類ごとの配列
     */
    private _prevKeyState: Array<boolean>;

    /**
     * @todo 調べる
     */
    private _prevKeyStateOnControllable: Array<boolean>;

    /**
     * @todo 調べる
     */
    private _keyInputContinueFrameNum: Array<number>;

    /**
     * @see WWAInputStore.checkButtonState
     */
    public checkButtonState(inputType: WWAInputType): Array<WWAInputState> {
        return InputKeyTable[inputType].map(keyCode => {
            if (this._prevKeyState[keyCode]) {
                if (this._keyState[keyCode]) {
                    return WWAInputState.PRESS;
                }
                return WWAInputState.UP;
            } else {
                if (this._keyState[keyCode]) {
                    return WWAInputState.DOWN;
                }
                return WWAInputState.NONE;
            }
        });
    }

    /**
     * @todo 調べる
     */
    public getKeyStateForControllPlayer(keyCode: KeyCodeValue): KeyState {
        if (this._prevKeyStateOnControllable[keyCode]) {
            if (this._keyState[keyCode]) {
                return KeyState.KEYPRESS;
            }
            return KeyState.KEYUP;
        } else {
            if (this._keyState[keyCode]) {
                return KeyState.KEYDOWN;
            }
            return KeyState.NONE;
        }
    }

    /**
     * @todo 調べる
     */
    public getKeyStateForMessageCheck(keyCode: KeyCodeValue): KeyState {
        if (this._prevKeyState[keyCode]) {
            if (this._keyState[keyCode]) {
                return (
                    this._keyInputContinueFrameNum[keyCode] >=
                        WWAConsts.KEYPRESS_MESSAGE_CHANGE_FRAME_NUM ?
                        KeyState.KEYPRESS_MESSAGECHANGE : KeyState.KEYPRESS
                );
            }
            return KeyState.KEYUP;
        } else {
            if (this._keyState[keyCode]) {
                return KeyState.KEYDOWN;
            }
            return KeyState.NONE;
        }
    }

    public setPressInfo(keyCode: KeyCodeValue): void {
        this._nextKeyState[keyCode] = true;
        this._keyInputContinueFrameNum[keyCode] = -1;
    }

    public setReleaseInfo(keyCode: KeyCodeValue): void {
        this._nextKeyState[keyCode] = false;
        this._keyInputContinueFrameNum[keyCode] = -1;
    }

    /**
     * @see WWAInputStore.update
     */
    public update(): void {
        var i: number;
        this._prevKeyState = this._keyState.slice();
        this._keyState = this._nextKeyState.slice();
        for (i = 0; i < WWAKeyStore.KEY_BUFFER_MAX; i++) {
            if (this._keyState[i]) {
                this._keyInputContinueFrameNum[i]++;
            }
        }
    }

    public memorizeKeyStateOnControllableFrame(): void {
        this._prevKeyStateOnControllable = this._keyState.slice();
    }

    public allClear(): void {
        var i: number;
        this._nextKeyState = new Array(WWAKeyStore.KEY_BUFFER_MAX);
        for (i = 0; i < WWAKeyStore.KEY_BUFFER_MAX; i++) {
            this._nextKeyState[i] = false;
        }
    }

    constructor() {
        var i: number;
        this._nextKeyState = new Array(WWAKeyStore.KEY_BUFFER_MAX);
        this._keyState = new Array(WWAKeyStore.KEY_BUFFER_MAX);
        this._prevKeyState = new Array(WWAKeyStore.KEY_BUFFER_MAX);
        this._prevKeyStateOnControllable = new Array(WWAKeyStore.KEY_BUFFER_MAX);
        this._keyInputContinueFrameNum = new Array(WWAKeyStore.KEY_BUFFER_MAX);
        for (i = 0; i < WWAKeyStore.KEY_BUFFER_MAX; i++) {
            this._nextKeyState[i] = false;
            this._keyState[i] = false;
            this._prevKeyState[i] = false;
            this._prevKeyStateOnControllable[i] = false;
            this._keyInputContinueFrameNum[i] = 0;
        }
    }
}
