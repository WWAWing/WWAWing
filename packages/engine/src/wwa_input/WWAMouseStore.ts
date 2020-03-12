import { WWAInputStore, WWAInputType, WWAInputState } from "@wwawing/common-interface";
import { Direction } from "../wwa_data";

/**
 * inputType から方向を決めます。対応しない入力が渡された場合は null が出力されます。
 * @param inputType 
 */
function inputToDir(inputType: WWAInputType): Direction | null {
    switch (inputType) {
        case 'UP':
            return Direction.UP;
        case 'RIGHT':
            return Direction.RIGHT;
        case 'DOWN':
            return Direction.DOWN;
        case 'LEFT':
            return Direction.LEFT;
    }
    return null;
}

/**
 * マウスの入力状態を管理するクラスです。
 */
export default class MouseStore implements WWAInputStore {
    private _prevMouseState: boolean;
    private _mouseState: boolean;
    private _nextMouseState: boolean;
    private _prevMouseStateOnControllable: boolean;
    private _inputDir: Direction;
    private _touchID: number;


    constructor() {
        this._prevMouseState = false;
        this._mouseState = false;
        this._nextMouseState = false;
    }

    /**
     * マウスのクリック状態を取得します。
     *     マウスはボタン1つしか検知する必要がないため、何を押したかの引数は指定せず、単純に「押した」「押している」「押して無い」を決めます。
     */
    public getMouseState(forControllPlayer: boolean = false): WWAInputState {
        const targetPrevMouseState = forControllPlayer ? this._prevMouseStateOnControllable : this._prevMouseState;

        if (targetPrevMouseState) {
            if (this._mouseState) {
                return WWAInputState.PRESS;
            }
            return WWAInputState.UP;
        } else {
            if (this._mouseState) {
                return WWAInputState.DOWN;
            }
            return WWAInputState.NONE;
        }
    }

    /**
     * @see WWAInputStore.checkButtonState
     */
    public checkButtonState(inputType: WWAInputType, forControllPlayer: boolean = false): WWAInputState[] {
        const dir = inputToDir(inputType);
        if (dir !== null) {
            if (this._inputDir !== dir) {
                return [WWAInputState.NONE];
            }
        }

        return [this.getMouseState(forControllPlayer)];
    }

    /**
     * マウスの押下状態と押した方向を割り当てます。
     * @param dir 押した方向
     * @param touchID (タッチデバイス向け) タッチしたところの固有ID
     */
    public setPressInfo(dir: Direction, touchID?: number): void {
        this._nextMouseState = true;
        this._inputDir = dir;
        this._touchID = touchID;
    }

    /**
     * マウスの押下状態を解除します。
     */
    public setReleaseInfo(): void {
        this._touchID = void 0;
        this._nextMouseState = false;
    }

    /**
     * @see WWAInputStore.memorizeKeyStateOnControllableFrame
     */
    public memorizeKeyStateOnControllableFrame(): void {
        this._prevMouseStateOnControllable = this._mouseState;
    }

    /**
     * マウス操作は押している時間で操作に影響が無いため、未使用です。
     */
    public getInputContinueFrameNum(): null {
        return null;
    }

    /**
     * @see WWAInputStore.update
     */
    public update(): void {
        this._prevMouseState = this._mouseState;
        this._mouseState = this._nextMouseState;
    }

    /**
     * @see WWAInputStore.clear
     */
    public clear(): void {
        this._nextMouseState = false;
    }

    public getTouchID(): number {
        return this._touchID;
    }
}
