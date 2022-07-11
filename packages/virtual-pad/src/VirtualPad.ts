export const VirtualPadButtonCodes = [
    "BUTTON_ENTER",
    "BUTTON_ESC",
    "BUTTON_SIDEBAR",
    "BUTTON_ESTIMATE",
    "BUTTON_FAST",
    "BUTTON_SLOW",
    "BUTTON_LEFT",
    "BUTTON_UP",
    "BUTTON_RIGHT",
    "BUTTON_DOWN"
] as const;

export type VirtualPadButtonCode = typeof VirtualPadButtonCodes[number];

/**
 * NONE: ボタンに一切触れていません
 * TOUCH: ボタンに触れ始めました
 * TOUCHING: ボタンに触れています
 * LEAVE: ボタンから離れました
 */
export type VirtualPadState = "NONE" | "TOUCH" | "TOUCHING" | "LEAVE";

export type VirtualPadButtons = { [key in string]: HTMLButtonElement };

type VirtualPadButtonTouching = {
    prev: boolean,
    current: boolean,
    next: boolean
};

type VirtualPadEventFunction = (buttonCode: VirtualPadButtonCode) => void;

const VirtualPadMoveButtonCodes = [
    "BUTTON_LEFT",
    "BUTTON_UP",
    "BUTTON_RIGHT",
    "BUTTON_DOWN"
];

/**
 * 仮想パッドの状態管理を行うクラスです。
 * @todo PCといった、タッチデバイスでないデバイスでは、このクラスのインスタンスを生成しないようにする。
 *     (this._enabled で判別しているけど、いちいち判定処理書くのつらい...)
 */
export default class VirtualPadStore {

    /**
     * 仮想パッドが有効か
     * @property
     */
    private _enabled: boolean;

    private _visible: boolean;

    private _onTouchStart: VirtualPadEventFunction | null;
    private _onTouchEnd: VirtualPadEventFunction | null;

    /**
     * 有効なボタンが格納されている配列です。各ボタンを繰り返し処理する場合に使用します。
     * @property
     */
    private _availableButtons: [VirtualPadButtonCode?];
    private _isTouchingButtons: {
        [key in VirtualPadButtonCode]?: VirtualPadButtonTouching
    };

    /**
     * 移動ボタンの要素自体です。主に移動ボタンで指を動かす際に使用します。
     * @property
     */
    private _moveButtonsElement: HTMLElement | null;

    /**
     * 操作ボタン群の親要素です。 {@code _moveButtonsElement} と併せて表示や非表示の切り替えに使用します。
     */
    private _buttonWrapperElement: HTMLElement | null;

    /**
     * @param buttons 仮想パッドの各要素
     * @param firstVisible インスタンス化時点で仮想パッドを表示するか
     * @param buttonWrapper 仮想パッドのボタン (主に右側) を覆う親要素
     * @param moveButtons 仮想パッドの移動ボタンの要素
     * @param onTouchStart 仮想パッドを押下した場合に発生するコールバック関数
     * @param onTouchEnd 仮想パッドを話した場合に発生するコールバック関数
     */
    constructor(
        buttons: VirtualPadButtons | null,
        firstVisible: boolean = false,
        buttonWrapper: HTMLElement | null = null,
        moveButtons: HTMLElement | null = null,
        onTouchStart: VirtualPadEventFunction | null = null,
        onTouchEnd: VirtualPadEventFunction | null = null,
    ) {
        this._enabled = buttons !== null;
        this._visible = firstVisible;
        this._onTouchStart = onTouchStart || null;
        this._onTouchEnd = onTouchEnd || null;
        this._availableButtons = [];
        this._isTouchingButtons = {};
        this._moveButtonsElement = moveButtons;
        this._buttonWrapperElement = buttonWrapper;

        this._setVisible(firstVisible);

        if (buttons === null) {
            return;
        }
        for (const buttonTypeString in buttons) {
            const button = buttons[buttonTypeString];
            if (!button) {
                continue;
            }
            // ここまでくれば buttonTypeString は VirtualPadButtonCode になる
            const buttonCode = buttonTypeString  as VirtualPadButtonCode;
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

            /**
             * 何かしらの割り込み処理が発生した場合に、緊急で仮想パッドを停止する処理です。
             * @param event 
             */
            const cancelVirtualPad = (event: TouchEvent) => {
                cancelBrowserTouchEvent(event);
                this.allClear();
            };

            button.addEventListener("touchstart", (event: TouchEvent) => {
                cancelBrowserTouchEvent(event);
                this.setTouchInfo(buttonCode);
            });

            // button.addEventListener("cancel", cancelVirtualPad);
            button.addEventListener("touchcancel", cancelVirtualPad);

            /**
             * 移動ボタンに関しては、指先を移動しながら操作することがあるため、 touchmove イベントにも対応します。
             */
            if (VirtualPadStore.isMoveButton(buttonCode)) {
                button.addEventListener("touchmove", this._detectMovingMoveButton.bind(this));
                button.addEventListener("touchend", this.allMoveClear.bind(this));
            } else {
                button.addEventListener("touchend", (event: TouchEvent) => {
                    cancelBrowserTouchEvent(event);
                    this.clearTouchInfo(buttonCode);
                });
            }
        }
        if (moveButtons !== null) {
            moveButtons.addEventListener("touchmove", this._detectMovingMoveButton.bind(this));
        }
    }

    /**
     * TouchMove した要素から触れた先の要素に、触れたことを呼び出します。
     * @param event 
     */
    private _detectMovingMoveButton(event: TouchEvent) {
        event.preventDefault();
        this.allMoveClear();

        const touch = event.targetTouches.item(0);
        if (!this._moveButtonsElement || touch === null) {
            return;
        }
        
        // 中央のポジションを取得
        const moveButtonRect = this._moveButtonsElement.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const centerPositionX = moveButtonRect.left - bodyRect.left + (moveButtonRect.width / 2);
        const centerPositionY = moveButtonRect.top - bodyRect.top + (moveButtonRect.height / 2);

        const touchX = touch.pageX - centerPositionX;
        const touchY = touch.pageY - centerPositionY;

        if (touchX >= touchY) { // 上と右
            /**
             * touchY をマイナスにして、グラフの空間上で擬似的に表現します。
             */
            if (touchX <= -touchY) { // 上
                this.setTouchInfo("BUTTON_UP");
            } else { // 右
                this.setTouchInfo("BUTTON_RIGHT");
            }
        } else { // 左と下
            if (touchX >= -touchY) { // 下
                this.setTouchInfo("BUTTON_DOWN");
            } else { // 左
                this.setTouchInfo("BUTTON_LEFT");
            }
        }
    }

    private _setVisible(visible: boolean) {
        if (this._moveButtonsElement !== null) {
            this._moveButtonsElement.style.display = visible ? "grid" : "none";
        }
        if (this._buttonWrapperElement !== null) {
            this._buttonWrapperElement.style.display = visible ? "grid" : "none";
        }
        this._visible = visible;
    }

    /**
     * 指定したボタンが押されたかを判別します。
     *     戦闘予測ボタンといった、1回しか押さないボタンの判定に使用します。
     * @param buttonType 
     */
    public checkTouchButton(buttonType: VirtualPadButtonCode): boolean {
        if (!this._enabled) {
            return false;
        }
        const state = this.getButtonState(buttonType);
        return state === "TOUCH";
    }

    /**
     * 指定したボタンが押されているかを判別します。
     *     移動ボタンといった、長時間押すボタンの判定に使用します。
     * @param buttonType 
     */
    public checkTouchingButton(buttonType: VirtualPadButtonCode): boolean {
        if (!this._enabled) {
            return false;
        }
        const state = this.getButtonState(buttonType);
        return state === "TOUCH" || state === "TOUCHING";
    }

    /**
     * 今の仮想パッドのボタンの状態を出力します
     * @param buttonType 
     */
    public getButtonState(buttonType: VirtualPadButtonCode): VirtualPadState {
        const button = this._isTouchingButtons[buttonType];
        if (!this._enabled || button === undefined) {
            return "NONE";
        }

        const touched = button.prev;
        const isTouching = button.current;
        if (touched && isTouching) {
            return "TOUCHING";
        } else if (isTouching) {
            return "TOUCH";
        } else if (touched) {
            return "LEAVE";
        }
        return "NONE";
    }

    /**
     * ボタンにタッチ信号を与えます
     * @param buttonType 
     */
    public setTouchInfo(buttonType: VirtualPadButtonCode) {
        if (!this._enabled || this._isTouchingButtons[buttonType] === undefined) {
            return;
        }

        (this._isTouchingButtons[buttonType] as VirtualPadButtonTouching).next = true;
    }

    /**
     * ボタンのタッチ信号を解除します
     * @param buttonType 
     */
    public clearTouchInfo(buttonType: VirtualPadButtonCode) {
        if (!this._enabled || this._isTouchingButtons[buttonType] === undefined) {
            return;
        }

        (this._isTouchingButtons[buttonType] as VirtualPadButtonTouching).next = false;
    }

    /**
     * すべての移動ボタンのタッチ信号をキャンセルします
     */
    public allMoveClear(): void {
        VirtualPadMoveButtonCodes.forEach((buttonCode) => {
            if (this._availableButtons.includes(buttonCode as VirtualPadButtonCode)) {
                this.clearTouchInfo(buttonCode as VirtualPadButtonCode);
            }
        });
    }

    /**
     * すべてのボタンのタッチ信号をキャンセルします。
     */
    public allClear(): void {
        this._availableButtons.forEach((buttonCode) => {
            if (buttonCode !== undefined && this._isTouchingButtons[buttonCode] !== undefined) {
                (this._isTouchingButtons[buttonCode] as VirtualPadButtonTouching).next = false;
            }
        });
    }

    /**
     * 押したボタンが移動ボタンか判定します。
     * @param buttonType 
     */
    public static isMoveButton(buttonType: VirtualPadButtonCode): boolean {
        return VirtualPadMoveButtonCodes.includes(buttonType);
    }

    /**
     * 今の仮想パッドボタンの状態を次の状態に送ります。
     */
    public update() {
        this._availableButtons.forEach((buttonCode) => {
            if (buttonCode === undefined) {
                return;
            }
            const currentButtonTouching = this._isTouchingButtons[buttonCode];
            if (currentButtonTouching === undefined) {
                return;
            }
            (this._isTouchingButtons[buttonCode] as VirtualPadButtonTouching).prev = currentButtonTouching.current;
            (this._isTouchingButtons[buttonCode] as VirtualPadButtonTouching).current = currentButtonTouching.next;

            /**
             * ボタンの状態に応じて、コールバック関数を実行
             */
            switch (this.getButtonState(buttonCode)) {
                case "TOUCH":
                    this._onTouchStart?.(buttonCode);
                    break;
                case "LEAVE":
                    this._onTouchEnd?.(buttonCode);
                    break;
            }
        });
    }

    public toggleVisible() {
        this._setVisible(!this._visible);
    }
}
