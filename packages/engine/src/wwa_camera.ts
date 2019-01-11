
import { WWAConsts, Position, Direction, speedList } from "./wwa_data";
import { Player } from "./wwa_parts_player";

export class Camera {
    private _player: Player;
    private _position: Position;
    private _positionPrev: Position;
    private _transitionStep: number;
    private _isResetting: boolean;

    /**
    現在のプレイヤー座標が含まれるカメラ位置(表示画面左上)を含むカメラを作ります.
    @param position: Position 現在のプレイヤー座標
    */
    constructor(position: Position) {
        this._position = null;
        this.reset(position);
    }

    public setPlayer(player: Player): void {
        this._player = player;
    }

    public isResetting(): boolean {
        return this._isResetting;
    }

    public getPosition(): Position {
        return this._position;
    }

    public getPreviousPosition(): Position {
        return this._positionPrev;
    }

    public resetPreviousPosition(): void {
        this._positionPrev = null;
    }

    // throws OutOfWWAMapRangeError;
    public move(dir: Direction): void {
        var speed = speedList[this._player.getSpeedIndex()];
        this._position = this._position.getNextFramePosition(
            dir, speed * (WWAConsts.H_PARTS_NUM_IN_WINDOW - 1), speed * (WWAConsts.V_PARTS_NUM_IN_WINDOW - 1));
    }

    public getTransitionStepNum(): number {
        return this._transitionStep;
    }

    public advanceTransitionStepNum(): number {
        ++this._transitionStep;
        if (this._transitionStep === WWAConsts.V_PARTS_NUM_IN_WINDOW) {
            this._isResetting = false;
            this._transitionStep = 0;
        }
        return this._transitionStep;
    }

    public isFinalStep(): boolean {
        if (this._isResetting === false) {
            throw new Error("リセット中ではありません。");
        }
        return this._transitionStep === WWAConsts.V_PARTS_NUM_IN_WINDOW - 1;

    }

    public reset(position: Position): void {
        this._positionPrev = this._position;
        this._position = position.getDefaultCameraPosition();
        this._transitionStep = 0;
        this._isResetting = true;
    }
}

