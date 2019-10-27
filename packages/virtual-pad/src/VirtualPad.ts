
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

export type VirtualPadButtons = {
    [VirtualPadButtonCode.BUTTON_ENTER]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_ESC]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_SIDEBAR]?: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_ESTIMATE]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_FAST]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_SLOW]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_LEFT]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_UP]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_RIGHT]: HTMLButtonElement,
    [VirtualPadButtonCode.BUTTON_DOWN]: HTMLButtonElement
};

type VirtualPadButtonTouching = {
    prev: boolean,
    current: boolean,
    next: boolean
};

/**
 * 仮想パッドの状態管理を行うクラスです。
 */
export default class VirtualPadStore {

    private _enabled: boolean;

    /**
     * 有効なボタンが格納されている配列です。各ボタンを繰り返し処理する場合に使用します。
     * @property
     */
    private _availableButtons: [VirtualPadButtonCode?];
    private _isTouchingButtons: {
        [key in VirtualPadButtonCode]?: VirtualPadButtonTouching
    };

    /**
     * @param buttons 仮想パッドの各要素
     */
    constructor(buttons: VirtualPadButtons) {
        this._enabled = true;
        this._availableButtons = [];
        this._isTouchingButtons = {};

        for (let buttonTypeString in buttons) {
            let buttonCode = parseInt(buttonTypeString);
            let button: HTMLButtonElement = buttons[buttonCode];
            this._availableButtons.push(buttonCode);

            /**
             * type 属性について
             *     HTML側の各仮想パッドボタンは、 type 属性を元に各ボタンを特定しています。
             *     各仮想パッドボタンの種類を判別するために、初期化時に type 属性を割り振っています。
             */
            button.setAttribute("type", buttonTypeString);

            this._isTouchingButtons[buttonCode] = {
                prev: false,
                current: false,
                next: false
            };
            
            const cancelBrowserTouchEvent = (event: TouchEvent) => {
                if (event.cancelable) {
                    event.preventDefault();
                }
            };

            button.addEventListener('touchstart', (event: TouchEvent) => {
                if (!this._enabled) {
                    event.preventDefault();
                    return;
                }
                this.setTouchInfo(buttonCode);
                cancelBrowserTouchEvent(event);
            });

            button.addEventListener("touchend", () => {
                this.allClear();
            });
            button.addEventListener("cancel", () => {
                this.allClear();
            });

        }

        [ // 移動ボタン
            VirtualPadButtonCode.BUTTON_LEFT,
            VirtualPadButtonCode.BUTTON_UP,
            VirtualPadButtonCode.BUTTON_RIGHT,
            VirtualPadButtonCode.BUTTON_DOWN
        ].forEach((targetButtonCode) => {
            const targetButtonElement = buttons[targetButtonCode];
            
            targetButtonElement.addEventListener("touchmove", (event: TouchEvent): void => {
                event.preventDefault();
                this.allClear();

                const touch = event.targetTouches.item(0);
                const element = document.elementFromPoint(touch.pageX, touch.pageY);
                if (element === null) {
                    return;
                }

                const touchButtonType = element.getAttribute("type");
                const touchButtonCode = parseInt(touchButtonType);
                if (VirtualPadStore.isMoveButton(touchButtonCode)) {
                    this.setTouchInfo(touchButtonCode);
                }
            });
        });
    }

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
     * すべてのボタンのタッチ信号をキャンセルします。
     */
    public allClear(): void {
        this._availableButtons.forEach((buttonCode) => {
            this._isTouchingButtons[buttonCode].next = false;
        });
    }

    /**
     * 押したボタンが移動ボタンか判定します。
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

    /**
     * 今の仮想パッドボタンの状態を次の状態に送ります。
     */
    public update() {
        this._availableButtons.forEach((buttonCode) => {
            let currentButtonTouching = this._isTouchingButtons[buttonCode];
            this._isTouchingButtons[buttonCode].prev = currentButtonTouching.current;
            this._isTouchingButtons[buttonCode].current = currentButtonTouching.next;
        })
    }
}
