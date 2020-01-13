import { WWAConsts, Direction } from "./wwa_data";

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
    KEY_F9 = 120,
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

export enum GamePadState {
    BUTTON_INDEX_B = 0,
    BUTTON_INDEX_A = 1,
    BUTTON_INDEX_Y = 2,
    BUTTON_INDEX_X = 3,
    BUTTON_INDEX_L = 4,
    BUTTON_INDEX_R = 5,
    BUTTON_INDEX_ZL = 6,
    BUTTON_INDEX_ZR = 7,
    BUTTON_INDEX_MINUS = 8,
    BUTTON_INDEX_PLUS = 9,
    BUTTON_CROSS_KEY_UP = 12,
    BUTTON_CROSS_KEY_DOWN = 13,
    BUTTON_CROSS_KEY_LEFT = 14,
    BUTTON_CROSS_KEY_RIGHT = 15,
    AXES_L_HORIZONTAL_INDEX = 0,
    AXES_L_VERTICAL_INDEX = 1,
    AXES_R_HORIZONTAL_INDEX = 2,
    AXES_R_VERTICAL_INDEX = 3,
    AXES_CROSS_KEY = 9
}

export class GamePadStore {
    private gamepad: any;
    private triggers: Array<boolean>;
    constructor() {
        this.gamepad = null;
        this.triggers = [];
        var i: number;
        for (i = 0; i < 16; i++) {
            this.triggers[i] = false;
        }
    }
    public update(): void {
        this.gamepad = null;
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : ((navigator as any).webkitGetGamepads ? (navigator as any).webkitGetGamepads : []);
        if (gamepads && gamepads.length > 0 && gamepads[0]) {
            var gamepad = gamepads[0];
            this.gamepad = gamepad;
        }
    }
    public buttonTrigger(...codes): boolean {
        if (!this.gamepad) {
            return false;
        }
        var i: number, len: number, code: number, buttonFlag: boolean, triggerLog: boolean;
        len = codes.length;
        for (i = 0; i < len; i++) {
            code = codes[i];
            var buttonData = this.gamepad.buttons[code];
            if (!buttonData) {
                return false;
            }
            if (typeof (buttonData) === "object") {
                buttonFlag = buttonData.pressed === true;
            } else if (buttonData === 1) {
                buttonFlag = true;
            } else {
                buttonFlag = false;
            }
            triggerLog = this.triggers[code];
            this.triggers[code] = buttonFlag;
            if (buttonFlag) {
                if (!triggerLog) {
                    return true;
                }
            }
        }
        return false;
    }
    public buttonPressed(...codes): boolean {
        if (!this.gamepad) {
            return false;
        }
        var i: number, len: number, code: number, buttonFlag: boolean;
        len = codes.length;
        for (i = 0; i < len; i++) {
            code = codes[i];
            var buttonData = this.gamepad.buttons[code];
            if (!buttonData) {
                return false;
            }
            if (typeof (buttonData) === "object") {
                buttonFlag = buttonData.pressed === true;
            } else if (buttonData === 1) {
                buttonFlag = true;
            } else {
                buttonFlag = false;
            }
            if (buttonFlag) {
                return true;
            }
        }
        return false;
    }
    public crossPressed(...codes): boolean {
        if (!this.gamepad) {
            return false;
        }
        var i: number, len: number, code: number;
        len = codes.length;
        for (i = 0; i < len; i++) {
            code = codes[i];
            switch (code) {
                case GamePadState.BUTTON_CROSS_KEY_UP:
                    if (this.gamepad.axes[GamePadState.AXES_L_VERTICAL_INDEX] <= -0.6 ||
                        this.gamepad.axes[GamePadState.AXES_R_VERTICAL_INDEX] <= -0.6 ||
                        this.stickFloor(GamePadState.AXES_CROSS_KEY) === -1 ||
                        this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                        return true;
                    }
                    break;
                case GamePadState.BUTTON_CROSS_KEY_DOWN:
                    if (this.gamepad.axes[GamePadState.AXES_L_VERTICAL_INDEX] >= 0.7 ||
                        this.gamepad.axes[GamePadState.AXES_R_VERTICAL_INDEX] >= 0.7 ||
                        this.stickFloor(GamePadState.AXES_CROSS_KEY) === 0.1 ||
                        this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                        return true;
                    }
                    break;
                case GamePadState.BUTTON_CROSS_KEY_LEFT:
                    if (this.gamepad.axes[GamePadState.AXES_L_HORIZONTAL_INDEX] <= -0.7 ||
                        this.gamepad.axes[GamePadState.AXES_R_HORIZONTAL_INDEX] <= -0.7 ||
                        this.stickFloor(GamePadState.AXES_CROSS_KEY) === 0.7 ||
                        this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                        return true;
                    }
                    break;
                case GamePadState.BUTTON_CROSS_KEY_RIGHT:
                    if (this.gamepad.axes[GamePadState.AXES_L_HORIZONTAL_INDEX] > 0.6 ||
                        this.gamepad.axes[GamePadState.AXES_R_HORIZONTAL_INDEX] > 0.6 ||
                        this.stickFloor(GamePadState.AXES_CROSS_KEY) === -0.5 ||
                        this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                        return true;
                    }
                    break;
            }
        }
        return false;
    }
    public vibration(isStrong: boolean) {
        if (!this.gamepad) {
            return false;
        }
        if (!this.gamepad.vibrationActuator) {
            return false;
        }
        if (isStrong) {
            this.gamepad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 100,
                weakMagnitude: 1,
                strongMagnitude: 0.5
            });
        } else {
            this.gamepad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 100,
                weakMagnitude: 0.5,
                strongMagnitude: 1
            });
        }
    }

    private stickFloor(...codes): number {
        if (!this.gamepad) {
            return 0;
        }
        var i: number, len: number, code: number, buttonFlag: boolean;
        len = codes.length;
        for (i = 0; i < len; i++) {
            code = codes[i];
            var value = this.gamepad.axes[code];
            if (typeof value !== "number") {
                return 0;
            }
            return Math.floor(value * 10) / 10;
        }
        return 0;
    }
}
