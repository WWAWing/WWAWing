import { WWAConsts, Direction, Coord } from "./wwa_data";

export enum KeyState {
    NONE,
    KEYDOWN,
    KEYPRESS,
    KEYUP,
    KEYPRESS_MESSAGECHANGE
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
    KEY_F12 = 123
}

export class KeyStore {
    public static KEY_BUFFER_MAX = 256;
    private _nextKeyState: Array<boolean>;
    private _keyState: Array<boolean>;
    private _prevKeyState: Array<boolean>;

    private _prevKeyStateOnControllable: Array<boolean>;
    private _keyInputContinueFrameNum: Array<number>;

    public checkHitKey(keyCode: KeyCode): boolean {
        var s = this.getKeyState(keyCode);
        return (s === KeyState.KEYDOWN || s === KeyState.KEYPRESS);
    }

    public getKeyState(keyCode: KeyCode): KeyState {
        if (this._prevKeyState[keyCode]) {
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

    public setPressInfo(keyCode: KeyCode): void {
        this._nextKeyState[keyCode] = true;
        this._keyInputContinueFrameNum[keyCode] = -1;
    }

    public setReleaseInfo(keyCode: KeyCode): void {
        this._nextKeyState[keyCode] = false;
        this._keyInputContinueFrameNum[keyCode] = -1;
    }

    public update(): void {
        var i: number;
        this._prevKeyState = this._keyState.slice();
        this._keyState = this._nextKeyState.slice();
        for (i = 0; i < KeyStore.KEY_BUFFER_MAX; i++) {
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
        this._nextKeyState = new Array(KeyStore.KEY_BUFFER_MAX);
        for (i = 0; i < KeyStore.KEY_BUFFER_MAX; i++) {
            this._nextKeyState[i] = false;
        }
    }

    constructor() {
        var i: number;
        this._nextKeyState = new Array(KeyStore.KEY_BUFFER_MAX);
        this._keyState = new Array(KeyStore.KEY_BUFFER_MAX);
        this._prevKeyState = new Array(KeyStore.KEY_BUFFER_MAX);
        this._prevKeyStateOnControllable = new Array(KeyStore.KEY_BUFFER_MAX);
        this._keyInputContinueFrameNum = new Array(KeyStore.KEY_BUFFER_MAX);
        for (i = 0; i < KeyStore.KEY_BUFFER_MAX; i++) {
            this._nextKeyState[i] = false;
            this._keyState[i] = false;
            this._prevKeyState[i] = false;
            this._prevKeyStateOnControllable[i] = false;
            this._keyInputContinueFrameNum[i] = 0;
        }
    }
}

export enum MouseState {
    NONE,
    MOUSEDOWN,
    MOUSEPRESS,
    MOUSEUP
}

export class MouseStore {
    private _prevMouseState: boolean;
    private _mouseState: boolean;
    private _nextMouseState: boolean;
    private _prevMouseStateOnControllable: boolean;
    private _inputDir: Direction;
    private _touchID: number;


    public checkClickMouse(dir?: Direction): boolean {
        var s: MouseState;
        if (dir !== void 0) {
            s = this.getMouseState(dir);
        } else {
            s = this.getMouseState();
        }
        return (s === MouseState.MOUSEDOWN || s === MouseState.MOUSEPRESS);
    }

    public getMouseState(dir?: Direction): MouseState {
        if (dir !== void 0) {
            if (this._inputDir !== dir) { return MouseState.NONE; }
        }
        if (this._prevMouseState) {
            if (this._mouseState) {
                return MouseState.MOUSEPRESS;
            }
            return MouseState.MOUSEUP;
        } else {
            if (this._mouseState) {
                return MouseState.MOUSEDOWN;
            }
            return MouseState.NONE;
        }
    }

    public getMouseStateForControllPlayer(dir?: Direction): MouseState {
        if (dir !== void 0) {
            if (this._inputDir !== dir) { return MouseState.NONE; }
        }
        if (this._prevMouseStateOnControllable) {
            if (this._mouseState) {
                return MouseState.MOUSEPRESS;
            }
            return MouseState.MOUSEUP;
        } else {
            if (this._mouseState) {
                return MouseState.MOUSEDOWN;
            }
            return MouseState.NONE;
        }
    }

    public setPressInfo(dir: Direction, touchID?: number): void {
        this._nextMouseState = true;
        this._inputDir = dir;
        this._touchID = touchID;
    }

    public setReleaseInfo(): void {
        this._touchID = void 0;
        this._nextMouseState = false;
    }

    public memorizeMouseStateOnControllableFrame(): void {
        this._prevMouseStateOnControllable = this._mouseState;
    }

    public update(): void {
        this._prevMouseState = this._mouseState;
        this._mouseState = this._nextMouseState;
    }

    public clear(): void {
        this._nextMouseState = false;
    }

    public getTouchID(): number {
        return this._touchID;
    }
    constructor() {
        this._prevMouseState = false;
        this._mouseState = false;
        this._nextMouseState = false;
    }

}

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

export class VirtualPadStore {
    private _buttonCount: number;
    private _isTouchingButtons: {
        prev: boolean,
        current: boolean,
        next: boolean
    }[];
    private _touchButtonSize: Coord;

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

    public allClear(): void {
        this._isTouchingButtons = this._isTouchingButtons.map((buttonState) => {
            buttonState.next = false;
            return buttonState;
        });
    }

    /**
     * 触れ始めたボタンと座標に応じて、最適なボタンにタッチ信号を与えます
     * @param targetButtonType 
     * @param clientX 
     * @param clientY 
     */
    public setEnterInfo(targetButtonType: VirtualPadButtonCode, clientX: number, clientY: number) {
        if (clientX > 0 &&
            clientX < this._touchButtonSize.x &&
            clientY > 0 &&
            clientY < this._touchButtonSize.y) {
            this.setTouchInfo(targetButtonType);
            return;
        }
        const touchButtonCoords: { [key: number]: {x: number, y: number} } = {
            [VirtualPadButtonCode.BUTTON_LEFT]: {
                x: -1 * this._touchButtonSize.x,
                y: 0
            },
            [VirtualPadButtonCode.BUTTON_UP]: {
                x: 0,
                y: -1 * this._touchButtonSize.y
            },
            [VirtualPadButtonCode.BUTTON_RIGHT]: {
                x: this._touchButtonSize.x,
                y: 0
            },
            [VirtualPadButtonCode.BUTTON_DOWN]: {
                x: 0,
                y: this._touchButtonSize.y
            }
        }
        let touchingX = clientX + touchButtonCoords[targetButtonType].x;
        let touchingY = clientY + touchButtonCoords[targetButtonType].y;
        for (let buttonType in touchButtonCoords) {
            const buttonCoord = touchButtonCoords[buttonType];
            if (touchingX > buttonCoord.x &&
                touchingX < buttonCoord.x + this._touchButtonSize.x &&
                touchingY > buttonCoord.y &&
                touchingY < buttonCoord.y + this._touchButtonSize.y) {
                this.setTouchInfo(parseInt(buttonType));
                break;
            }
        }
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

    constructor() {
        this._buttonCount = Object.entries(VirtualPadButtonCode).length;
        this._isTouchingButtons = new Array(this._buttonCount);
        for (let count = 0; count < this._buttonCount; count++) {
            this._isTouchingButtons[count] = {
                prev: false,
                current: false,
                next: false
            };
        }
        this._touchButtonSize = new Coord(100, 100); // TODO: 自動取得できるようにする。
    }

    public update() {
        this._isTouchingButtons.forEach((isTouchingButton) => {
            isTouchingButton.prev = isTouchingButton.current;
            isTouchingButton.current = isTouchingButton.next;
        });
    }
}
