/// <reference path="./wwa_parts_player.ts" />
/// <reference path="./wwa_data.ts" />

module wwa_camera {
    import Consts = wwa_data.WWAConsts;
    export class Camera {
        private _player: wwa_parts_player.Player;
        private _position: wwa_data.Position;
        private _positionPrev: wwa_data.Position;
        private _transitionStep: number;
        private _isResetting: boolean;
        /**
          現在のプレイヤー座標が含まれるカメラ位置(表示画面左上)を含むカメラを作ります.
          @param position: wwa_data.Position 現在のプレイヤー座標
        */

        constructor( position: wwa_data.Position) {
            this._position = null;
            this.reset(position);
        }

        public setPlayer( player: wwa_parts_player.Player ): void {
            this._player = player;
        }

        public isResetting(): boolean {
            return this._isResetting;
        }

        public getPosition(): wwa_data.Position {
            return this._position;
        }

        public getPreviousPosition():wwa_data.Position {
            return this._positionPrev;
        }

        public resetPreviousPosition(): void {
            this._positionPrev = null;
        }

        // throws OutOfWWAMapRangeError;
        public move(dir: wwa_data.Direction): void {
            var speed = wwa_data.speedList[ this._player.getSpeedIndex() ];
            this._position = this._position.getNextFramePosition(
                dir, speed *( Consts.H_PARTS_NUM_IN_WINDOW - 1 ), speed * ( Consts.V_PARTS_NUM_IN_WINDOW - 1 ));
        }

        public getTransitionStepNum(): number {
            return this._transitionStep;
        }

        public advanceTransitionStepNum(): number {
            ++this._transitionStep;
            if (this._transitionStep === wwa_data.WWAConsts.V_PARTS_NUM_IN_WINDOW) {
                this._isResetting = false;
                this._transitionStep = 0;
            }
            return this._transitionStep;
        }

        public isFinalStep(): boolean {
            if (this._isResetting === false) {
                throw new Error("リセット中ではありません。");
            }
            return this._transitionStep === wwa_data.WWAConsts.V_PARTS_NUM_IN_WINDOW - 1;

        }

        public reset(position: wwa_data.Position): void {
            this._positionPrev = this._position;
//            this._position = position.getScreenTopPosition();
            this._position = position.getDefaultCameraPosition();
            this._transitionStep = 0;
            this._isResetting = true;
        }


    }

}