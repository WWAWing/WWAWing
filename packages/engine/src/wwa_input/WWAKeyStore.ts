import { WWAInputStore, WWAInputType, WWAInputState } from "@wwawing/common-interface";
import { WWAConsts } from "../wwa_data";

export enum KeyState {
    NONE,
    KEYDOWN,
    KEYPRESS,
    KEYUP,
    KEYPRESS_MESSAGECHANGE // TODO: 必要なのか調べる
}

const InputKeyTable: {[key in WWAInputType]: Array<string>} = {
    UP: ['ArrowUp'],
    RIGHT: ['ArrowRight'],
    DOWN: ['ArrowDown'],
    LEFT: ['ArrowLeft'],
    YES: ['y'],
    NO: ['n'],
    MESSAGE: [' '], // メッセージ送り
    ITEM_1: ['1'],
    ITEM_2: ['2'],
    ITEM_3: ['3'],
    ITEM_4: ['q'],
    ITEM_5: ['w'],
    ITEM_6: ['e'],
    ITEM_7: ['a'],
    ITEM_8: ['s'],
    ITEM_9: ['d'],
    ITEM_10: ['z'],
    ITEM_11: ['x'],
    ITEM_12: ['c'],
    ESTIMATE_REPORT: ['m', 'F1'], // 戦闘結果予測
    SPEED_UP: ['p', 'F2'],
    SPEED_DOWN: ['i'],
    HOWOTO_CONTROL: ['F12'], // ショートカットキーの一覧
    CONTROL_PANEL_SELECT: [],
    QUICK_LOAD: ['F5'],
    PASSOWRD_LOAD: ['F3'],
    QUICK_SAVE: ['F6'],
    PASSWORD_SAVE: ['F4'],
    RESTART_GAME: ['F7'],
    GOTO_WWA: ['F8']
}

/**
 * キーボードの入力状態を管理するクラスです。
 * @todo wwa_input/KeyStore の移行を完了させる
 */
export default class WWAKeyStore implements WWAInputStore {
    /**
     * 次入力されることが確定されたキー情報
     */
    private _nextKeyState: Array<string>;
    /**
     * 現在入力されているキー情報
     */
    private _keyState: Array<string>;
    /**
     * 前回入力されていたキー情報
     */
    private _prevKeyState: Array<string>;

    /**
     * @todo 調べる
     */
    private _prevKeyStateOnControllable: Array<string>;

    /**
     * @todo 調べる
     */
    private _keyInputContinueFrameNum: Map<string, number>;

    constructor() {
        this._nextKeyState = [];
        this._keyState = [];
        this._prevKeyState = [];
        this._prevKeyStateOnControllable = [];
        this._keyInputContinueFrameNum = new Map();
    }

    /**
     * @see WWAInputStore.checkButtonState
     */
    public checkButtonState(inputType: WWAInputType): Array<WWAInputState> {
        return InputKeyTable[inputType].map(key => {
            if (this._prevKeyState.includes(key)) {
                if (this._keyState.includes(key)) {
                    return WWAInputState.PRESS;
                }
                return WWAInputState.UP;
            } else {
                if (this._keyState.includes(key)) {
                    return WWAInputState.DOWN;
                }
                return WWAInputState.NONE;
            }
        });
    }

    /**
     * @todo 調べる
     */
    public getKeyStateForControllPlayer(key: string): KeyState {
        if (this._prevKeyStateOnControllable.includes(key)) {
            if (this._keyState.includes(key)) {
                return KeyState.KEYPRESS;
            }
            return KeyState.KEYUP;
        } else {
            if (this._keyState.includes(key)) {
                return KeyState.KEYDOWN;
            }
            return KeyState.NONE;
        }
    }

    /**
     * @todo 調べる
     */
    public getKeyStateForMessageCheck(key: string): KeyState {
        if (this._prevKeyState.includes(key)) {
            if (this._keyState.includes(key)) {
                return (
                    this._keyInputContinueFrameNum.get(key) >=
                        WWAConsts.KEYPRESS_MESSAGE_CHANGE_FRAME_NUM ?
                        KeyState.KEYPRESS_MESSAGECHANGE : KeyState.KEYPRESS
                );
            }
            return KeyState.KEYUP;
        } else {
            if (this._keyState.includes(key)) {
                return KeyState.KEYDOWN;
            }
            return KeyState.NONE;
        }
    }

    public setPressInfo(key: string): void {
        if (!this._nextKeyState.includes(key)) {
            this._nextKeyState.push(key);
        }
        this._keyInputContinueFrameNum.set(key, -1);
    }

    public setReleaseInfo(key: string): void {
        if (this._nextKeyState.includes(key)) {
            this._nextKeyState.splice(this._nextKeyState.indexOf(key), 1);
        }
        this._keyInputContinueFrameNum.delete(key);
    }

    /**
     * @see WWAInputStore.update
     */
    public update(): void {
        this._prevKeyState = this._keyState.slice();
        this._keyState = this._nextKeyState.slice();
        this._keyState.forEach(key => {
            const keyFrameValue = this._keyInputContinueFrameNum.get(key);
            this._keyInputContinueFrameNum.set(key, keyFrameValue + 1);
        });
    }

    public memorizeKeyStateOnControllableFrame(): void {
        this._prevKeyStateOnControllable = this._keyState.slice();
    }

    public allClear(): void {
        this._nextKeyState = [];
    }
}
