
export enum VirtualPadButtonCode {
    BUTTON_ENTER,
    BUTTON_ESC,
    BUTTON_SIDEBAR,
    BUTTON_ESTIMATE,
    BUTTON_FAST,
    BUTTON_SLOW,
    BUTTON_LEFT,
    BUTTON_UP,
    BUTTON_RIGHT,
    BUTTON_DOWN
}

/**
 * enum 型の個数は Object.entries(...).length で利用できるが、VSCodeが見つからないとエラーが発生しているため、暫定措置として定数を別途作成。
 * @var {number} VIRTUAL_PAD_BUTTON_COUNT
 * @see VirtualPadButtonCode
 */
const VIRTUAL_PAD_BUTTON_COUNT = 10;

/**
 * NONE: ボタンに一切触れていません
 * TOUCH: ボタンに触れ始めました
 * TOUCHING: ボタンに触れています
 * LEAVE: ボタンから離れました
 */
export enum VirtualPadState {
    NONE,
    TOUCH,
    TOUCHING,
    LEAVE
}

/**
 * 仮想パッドの状態管理を行うクラスです。
 */
export default class VirtualPadStore {
    private _buttonCount: number;
    private _isTouchingButtons: {
        prev: boolean,
        current: boolean,
        next: boolean
    }[];

    public checkTouchButton(buttonType: VirtualPadButtonCode): boolean {
        const state = this.getButtonState(buttonType);
        return state === VirtualPadState.TOUCH || state === VirtualPadState.TOUCHING;
    }

    public getButtonState(buttonType: VirtualPadButtonCode): VirtualPadState {
        const touched = this._isTouchingButtons[buttonType].prev;
        const isTouching = this._isTouchingButtons[buttonType].current;
        if (touched && isTouching) {
            return VirtualPadState.TOUCHING;
        } else if (isTouching) {
            return VirtualPadState.TOUCH;
        } else if (touched) {
            return VirtualPadState.LEAVE;
        }
        return VirtualPadState.NONE;
    }

    /**
     * ボタンにタッチ信号を与えます
     * @param buttonType 
     */
    public setTouchInfo(buttonType: VirtualPadButtonCode) {
        this._isTouchingButtons[buttonType].next = true;
    }

    /**
     * すべてのボタンのタッチ信号をキャンセルします
     */
    public allClear(): void {
        this._isTouchingButtons = this._isTouchingButtons.map((buttonState) => {
            buttonState.next = false;
            return buttonState;
        });
    }

    /**
     * 押したボタンが移動ボタンか判定します
     * @param buttonType 
     */
    public static isMoveButton(buttonType: VirtualPadButtonCode): boolean {
        if (buttonType === VirtualPadButtonCode.BUTTON_LEFT ||
            buttonType === VirtualPadButtonCode.BUTTON_UP ||
            buttonType === VirtualPadButtonCode.BUTTON_RIGHT ||
            buttonType === VirtualPadButtonCode.BUTTON_DOWN) {
            return true;
        }
        return false;
    }

    public update() {
        this._isTouchingButtons.forEach((isTouchingButton) => {
            isTouchingButton.prev = isTouchingButton.current;
            isTouchingButton.current = isTouchingButton.next;
        });
    }

    constructor() {
        this._buttonCount = VIRTUAL_PAD_BUTTON_COUNT;
        this._isTouchingButtons = new Array(this._buttonCount);
        for (let count = 0; count < this._buttonCount; count++) {
            this._isTouchingButtons[count] = {
                prev: false,
                current: false,
                next: false
            };
        }
    }
}
