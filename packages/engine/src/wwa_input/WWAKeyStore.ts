import { WWAInputStore, WWAInputType, WWAInputState } from "@wwawing/common-interface";
import { WWAConsts } from "../wwa_data";

export enum KeyState {
    NONE,
    KEYDOWN,
    KEYPRESS,
    KEYUP,
    KEYPRESS_MESSAGECHANGE // TODO: 必要なのか調べる
}
export enum KeyCode {
    KEY_ENTER = 13,
    KEY_SHIFT = 16,
    KEY_ESC = 27,
    KEY_SPACE = 32,
    KEY_LEFT = 37,
    KEY_UP = 38,
    KEY_RIGHT = 39,
    KEY_DOWN = 40,
    KEY_1 = 49,
    KEY_2 = 50,
    KEY_3 = 51,
    KEY_A = 65,
    KEY_C = 67,
    KEY_D = 68,
    KEY_E = 69,
    KEY_I = 73,
    KEY_M = 77,
    KEY_N = 78,
    KEY_P = 80,
    KEY_Q = 81,
    KEY_S = 83,
    KEY_W = 87,
    KEY_X = 88,
    KEY_Y = 89,
    KEY_Z = 90,
    KEY_F1 = 112,
    KEY_F2 = 113,
    KEY_F3 = 114,
    KEY_F4 = 115,
    KEY_F5 = 116,
    KEY_F6 = 117,
    KEY_F7 = 118,
    KEY_F8 = 119,
    KEY_F9 = 120,
    KEY_F12 = 123
}

/**
 * キーに対して対応する操作を出力します。
 *     Enter キーのように複数の操作に対応している場合もあるため、配列として複数返せるようにしています。
 * @param keyCode キーの種類
 * @returns 対応した操作の配列
 * @example getKeyTable(KeyCode.ENTER).map(input => keyStore.setButtonInput(input));
 */
export function getKeyTable(keyCode: KeyCode): WWAInputType[] {
    switch (keyCode) {
        case KeyCode.KEY_ENTER:
            return [WWAInputType.YES, WWAInputType.MESSAGE];
        case KeyCode.KEY_Y:
            return [WWAInputType.YES];
        case KeyCode.KEY_ESC:
            return [WWAInputType.NO, WWAInputType.MESSAGE];
        case KeyCode.KEY_N:
            return [WWAInputType.NO];
        case KeyCode.KEY_SPACE:
            return [WWAInputType.MESSAGE];
        case KeyCode.KEY_UP:
            return [WWAInputType.UP];
        case KeyCode.KEY_RIGHT:
            return [WWAInputType.RIGHT];
        case KeyCode.KEY_DOWN:
            return [WWAInputType.DOWN];
        case KeyCode.KEY_LEFT:
            return [WWAInputType.LEFT];
        case KeyCode.KEY_1:
            return [WWAInputType.ITEM_1];
        case KeyCode.KEY_2:
            return [WWAInputType.ITEM_2];
        case KeyCode.KEY_3:
            return [WWAInputType.ITEM_3];
        case KeyCode.KEY_Q:
            return [WWAInputType.ITEM_4];
        case KeyCode.KEY_W:
            return [WWAInputType.ITEM_5];
        case KeyCode.KEY_E:
            return [WWAInputType.ITEM_6];
        case KeyCode.KEY_A:
            return [WWAInputType.ITEM_7];
        case KeyCode.KEY_S:
            return [WWAInputType.ITEM_8];
        case KeyCode.KEY_D:
            return [WWAInputType.ITEM_9];
        case KeyCode.KEY_Z:
            return [WWAInputType.ITEM_10];
        case KeyCode.KEY_X:
            return [WWAInputType.ITEM_11];
        case KeyCode.KEY_C:
            return [WWAInputType.ITEM_12];
        case KeyCode.KEY_M:
            return [WWAInputType.ESTIMATE_REPORT];
        case KeyCode.KEY_I:
            return [WWAInputType.SPEED_DOWN];
        case KeyCode.KEY_P:
            return [WWAInputType.SPEED_UP];
        case KeyCode.KEY_F1:
            return [WWAInputType.ESTIMATE_REPORT];
        case KeyCode.KEY_F2:
            return [WWAInputType.SPEED_UP];
        case KeyCode.KEY_F3:
            return [WWAInputType.PASSOWRD_LOAD];
        case KeyCode.KEY_F4:
            return [WWAInputType.PASSWORD_SAVE];
        case KeyCode.KEY_F5:
            return [WWAInputType.QUICK_LOAD];
        case KeyCode.KEY_F6:
            return [WWAInputType.QUICK_SAVE];
        case KeyCode.KEY_F7:
            return [WWAInputType.RESTART_GAME];
        case KeyCode.KEY_F8:
            return [WWAInputType.GOTO_WWA];
        case KeyCode.KEY_F12:
            return [WWAInputType.HOWOTO_CONTROL];
    }
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
    public checkButtonState(inputType: WWAInputType): WWAInputState {
        if (this._prevKeyState[inputType]) {
            if (this._keyState[inputType]) {
                return WWAInputState.PRESS;
            }
            return WWAInputState.UP;
        } else {
            if (this._keyState[inputType]) {
                return WWAInputState.DOWN;
            }
            return WWAInputState.NONE;
        }
    }

    /**
     * @todo 調べる
     */
    public getKeyStateForControllPlayer(keyCode: KeyCode): KeyState {
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
    public getKeyStateForMessageCheck(keyCode: KeyCode): KeyState {
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

    /**
     * @see WWAInputStore.setButtonInput
     */
    public setButtonInput(inputType: WWAInputType): void {
        this._nextKeyState[inputType] = true;
        this._keyInputContinueFrameNum[inputType] = -1;
    }

    /**
     * @see WWAInputStore.setButtonRelease
     */
    public setButtonRelease(inputType: WWAInputType): void {
        this._nextKeyState[inputType] = false;
        this._keyInputContinueFrameNum[inputType] = -1;
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
