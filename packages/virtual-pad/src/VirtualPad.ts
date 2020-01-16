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

type VirtualPadEventFunction = (buttonCode: VirtualPadButtonCode) => void;

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
    private _moveButtonsElement: HTMLElement;

    /**
     * @param buttons 仮想パッドの各要素
     * @param moveButtons 仮想パッドの移動ボタンの要素
     * @param onTouchStart 仮想パッドを押下した場合に発生するコールバック関数
     * @param onTouchEnd 仮想パッドを話した場合に発生するコールバック関数
     */
    constructor(
        buttons: VirtualPadButtons | {},
        moveButtons: HTMLElement = null,
        onTouchStart: VirtualPadEventFunction = null,
        onTouchEnd: VirtualPadEventFunction = null
    ) {
        this._enabled = Object.keys(buttons).length > 0;
        this._onTouchStart = onTouchStart || null;
        this._onTouchEnd = onTouchEnd || null;
        this._availableButtons = [];
        this._isTouchingButtons = {};
        this._moveButtonsElement = moveButtons;

        for (let buttonTypeString in buttons) {
            /**
             * for in ... で渡される buttonTypeScript は必ず文字列型になります。
             *     このまま buttons の配列のキーに渡すと、正しく要素が受け取れません。
             *     このため、一度 parseInt で数字に変換した上で渡しています。
             */
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
                this.setTouchInfo(buttonCode);
                cancelBrowserTouchEvent(event);
            });

            button.addEventListener("touchend", () => {
                this.allClear();
            });
            button.addEventListener("cancel", () => {
                this.allClear();
            });

            /**
             * 移動ボタンに関しては、指先を移動しながら操作することがあるため、 touchmove イベントにも対応します。
             */
            if (VirtualPadStore.isMoveButton(buttonCode)) {
                button.addEventListener("touchmove", this._detectMovedButton.bind(this));
            }
        }
        if (moveButtons !== null) {
            moveButtons.addEventListener("touchmove", this._detectMovedButton.bind(this));
        }
    }

    /**
     * TouchMove した要素から触れた先の要素に、触れたことを呼び出します。
     * @param event 
     */
    private _detectMovedButton(event: TouchEvent) {
        event.preventDefault();
        this.allClear();
        
        // 中央のポジションを取得
        const moveButtonRect = this._moveButtonsElement.getBoundingClientRect();
        const centerPositionX = moveButtonRect.left + (moveButtonRect.width / 2);
        const centerPositionY = moveButtonRect.top + (moveButtonRect.height / 2);

        const touch = event.targetTouches.item(0);
        const touchX = touch.pageX - centerPositionX;
        const touchY = touch.pageY - centerPositionY;

        if (touchX >= touchY) { // 上と右
            /**
             * touchY をマイナスにして、グラフの空間上で擬似的に表現します。
             */
            if (touchX <= -touchY) { // 上
                this.setTouchInfo(VirtualPadButtonCode.BUTTON_UP);
            } else { // 右
                this.setTouchInfo(VirtualPadButtonCode.BUTTON_RIGHT);
            }
        } else { // 左と下
            if (touchX >= -touchY) { // 下
                this.setTouchInfo(VirtualPadButtonCode.BUTTON_DOWN);
            } else { // 左
                this.setTouchInfo(VirtualPadButtonCode.BUTTON_LEFT);
            }
        }
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
        return state === VirtualPadState.TOUCH;
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
        return state === VirtualPadState.TOUCH || state === VirtualPadState.TOUCHING;
    }

    /**
     * 今の仮想パッドのボタンの状態を出力します
     * @param buttonType 
     */
    public getButtonState(buttonType: VirtualPadButtonCode): VirtualPadState {
        if (!this._enabled) {
            return VirtualPadState.NONE;
        }

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
        if (!this._enabled) {
            return;
        }

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

            /**
             * ボタンの状態に応じて、コールバック関数を実行
             */
            switch (this.getButtonState(buttonCode)) {
                case VirtualPadState.TOUCH:
                    this._onTouchStart(buttonCode);
                    break;
                case VirtualPadState.LEAVE:
                    this._onTouchEnd(buttonCode);
                    break;
            }
        })
    }
}
