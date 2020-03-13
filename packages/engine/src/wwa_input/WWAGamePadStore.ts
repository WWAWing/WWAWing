import { WWAInputStore, WWAInputState, WWAInputType } from "@wwawing/common-interface";

export enum GamePadButtonCode {
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
    BUTTON_CROSS_KEY_RIGHT = 15
}

export enum GamePadAxesCode {
    AXES_L_HORIZONTAL_INDEX = 0,
    AXES_L_VERTICAL_INDEX = 1,
    AXES_R_HORIZONTAL_INDEX = 2,
    AXES_R_VERTICAL_INDEX = 3,
    AXES_CROSS_KEY = 9
}

const STICK_ACTUATION_POINT = 0.7;

/**
 * アナログスティックの軸の反応条件を記したタイプです。
 * @todo 「反応条件」を名前に含みたい
 */
type GamePadAxe = {
    code: GamePadAxesCode // 反応するアナログスティックの軸のコード
    actuation: number // どこまで反応するのか
}

/**
 * アナログスティックの反応条件を記したタイプです。
 */
type GamePadAxesCodes = {
    x?: GamePadAxe,
    y?: GamePadAxe
}

/**
 * GamePadInputTable で反応するボタンあるいはアナログスティックの条件を記載したタイプです。
 */
type GamePadAvailableInput = {
    buttons?: GamePadButtonCode[],
    axes?: GamePadAxesCodes[]
}

/**
 * それぞれの操作に対して反応するボタンまたはアナログスティックの一覧です。
 */
const GamePadInputTable: { [type in WWAInputType]: GamePadAvailableInput } = {
    'UP': {
        buttons: [GamePadButtonCode.BUTTON_CROSS_KEY_UP],
        axes: [{
            y: {
                code: GamePadAxesCode.AXES_L_VERTICAL_INDEX,
                actuation: -STICK_ACTUATION_POINT,
            }
        }, {
            y: {
                code: GamePadAxesCode.AXES_R_VERTICAL_INDEX,
                actuation: -STICK_ACTUATION_POINT,
            }
        }]
    },
    'RIGHT': {
        buttons: [GamePadButtonCode.BUTTON_CROSS_KEY_RIGHT],
        axes: [{
            x: {
                code: GamePadAxesCode.AXES_L_HORIZONTAL_INDEX,
                actuation: STICK_ACTUATION_POINT,
            },
        }, {
            x: {
                code: GamePadAxesCode.AXES_R_HORIZONTAL_INDEX,
                actuation: STICK_ACTUATION_POINT,
            },
        }]
    },
    'DOWN': {
        buttons: [GamePadButtonCode.BUTTON_CROSS_KEY_DOWN],
        axes: [{
            y: {
                code: GamePadAxesCode.AXES_L_VERTICAL_INDEX,
                actuation: STICK_ACTUATION_POINT,
            }
        }, {
            y: {
                code: GamePadAxesCode.AXES_R_VERTICAL_INDEX,
                actuation: STICK_ACTUATION_POINT,
            }
        }]
    },
    'LEFT': {
        buttons: [GamePadButtonCode.BUTTON_CROSS_KEY_LEFT],
        axes: [{
            x: {
                code: GamePadAxesCode.AXES_L_HORIZONTAL_INDEX,
                actuation: -STICK_ACTUATION_POINT,
            }
        }, {
            x: {
                code: GamePadAxesCode.AXES_R_HORIZONTAL_INDEX,
                actuation: -STICK_ACTUATION_POINT,
            }
        }]
    },
    'YES': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_A]
    },
    'NO': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_B]
    },
    'MESSAGE': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_A, GamePadButtonCode.BUTTON_INDEX_B]
    },
    'ITEM_1': {},
    'ITEM_2': {},
    'ITEM_3': {},
    'ITEM_4': {},
    'ITEM_5': {},
    'ITEM_6': {},
    'ITEM_7': {},
    'ITEM_8': {},
    'ITEM_9': {},
    'ITEM_10': {},
    'ITEM_11': {},
    'ITEM_12': {},
    'ESTIMATE_REPORT': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_A],
    },
    'SPEED_UP': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_PLUS],
    },
    'SPEED_DOWN': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_MINUS],
    },
    'HOWOTO_CONTROL': {},
    'CONTROL_PANEL_SELECT': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_X],
    },
    'QUICK_LOAD': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_ZR],
    },
    'PASSOWRD_LOAD': {},
    'QUICK_SAVE': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_ZL],
    },
    'PASSWORD_SAVE': {},
    'RESTART_GAME': {
        buttons: [GamePadButtonCode.BUTTON_INDEX_R],
    },
    'GOTO_WWA': {},
    'SOUNDLOAD_STOP': {}
};

/**
 * @todo Webkit 向けの挙動については一旦無視して、 Chrome/Firefox 向けの実装が終わったら WWAWebkitGamepadStore の実装に移る
 */
export class WWAGamePadStore implements WWAInputStore {
    private gamepad: Gamepad;
    private triggers: Array<boolean>;
    constructor() {
        this._setGamePad();
        this.triggers = [];
        var i: number;
        for (i = 0; i < 16; i++) {
            this.triggers[i] = false;
        }
    }
    public update(): void {
        this._setGamePad();
    }

    /**
     * @see WWAInputStore.checkButtonState
     */
    public checkButtonState(inputType: WWAInputType): WWAInputState[] {
        if (!this.gamepad) {
            return [WWAInputState.NONE];
        }

        const inputCodes = GamePadInputTable[inputType];
        const inputButtons = inputCodes.buttons || [];
        const inputAxes = inputCodes.axes || [];

        const buttonStates: WWAInputState[] = inputButtons.map(code => {
            const buttonData = this.gamepad.buttons[code];
            if (!buttonData) {
                return WWAInputState.NONE;
            }
            const isPressed = buttonData.pressed;
            const isTrigger = this.triggers[code];
            this.triggers[code] = isPressed;
            if (isPressed) {
                if (!isTrigger) {
                    return WWAInputState.DOWN;
                }
                return WWAInputState.PRESS;
            } else {
                if (isTrigger) {
                    return WWAInputState.UP;
                }
                return WWAInputState.NONE;
            }
        });

        const axesStates = inputAxes.map(axesCodes => {
            const x = axesCodes.x ? this._checkAxe(axesCodes.x) : true;
            const y = axesCodes.y ? this._checkAxe(axesCodes.y) : true;
            if (x && y) {
                return WWAInputState.PRESS;
            }
            return WWAInputState.NONE;
        });

        return buttonStates.concat(axesStates);
    }

    /**
     * ゲームパッドAPIの仕様上、クリア処理を施す必要が無いため、何も実行しません。
     */
    public clear(): void {
    }

    public getInputContinueFrameNum(): null {
        return null;
    }

    /**
     * @todo もしかしたら実装する必要があるかもしれない、調べる
     */
    public memorizeKeyStateOnControllableFrame(): void {
    }

    private _setGamePad() {
        this.gamepad = null;
        const gamepads = navigator.getGamepads();
        if (gamepads && gamepads.length > 0 && gamepads[0]) {
            const gamepad = gamepads[0];
            this.gamepad = gamepad;
        }
    }

    /**
     * アナログスティックの軸の条件と、いまのゲームパッドの状態を比較して、反応しているか確認します。
     * @param axe アナログスティックの条件 (内容は GamePadAxe を参照のこと)
     */
    private _checkAxe(axe: GamePadAxe): boolean {
        const axesValue = this.gamepad.axes[axe.code];
        const actuationPoint = axe.actuation;
        return (actuationPoint > 0 && axesValue >= actuationPoint) ||
               (actuationPoint < 0 && axesValue <= actuationPoint);
    }

}
