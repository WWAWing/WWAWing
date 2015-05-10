/// <reference path="./wwa_data.ts" />

module wwa_motion {

    import Dir = wwa_data.Direction;
    export class ObjectMovingData {
        private _currentPos: wwa_data.Position;


        public constructor(
            private _player: wwa_parts_player.Player,
            private _objectID: number,
            private _srcPos: wwa_data.Position,
            private _destPos: wwa_data.Position,
            private _dir: Dir
            ) {
            this._currentPos = this._srcPos.clone();
        }

        public update(): wwa_data.Position {
            var speedIndex = this._player.getSpeedIndex();
            this._currentPos = this._currentPos.getNextFramePosition(
                this._dir,
                wwa_data.speedList[ speedIndex ],
                wwa_data.speedList[ speedIndex ]);

            return this._currentPos;
        }

        public get isAchievedDestination(): boolean {
            return this._currentPos.equals(this._destPos);
        }

        public get currentPosition(): wwa_data.Position {
            return this._currentPos;
        }

        public get beforePosition(): wwa_data.Position {
            return this._srcPos;
        }

        public get destination(): wwa_data.Position {
            return this._destPos;
        }

        public get objID(): number {
            return this._objectID;
        }
    }


    export class ObjectMovingDataManager {

        private _queue: ObjectMovingData[];
        
        // TODO: シングルトンにする
        public constructor( private _wwa: wwa_main.WWA, private _player: wwa_parts_player.Player) {
            this.clear();
        }

        public add(objectID: number, srcPos: wwa_data.Position, destPos: wwa_data.Position, dir: wwa_data.Direction): void {
            this._queue.push(new ObjectMovingData(this._player, objectID, srcPos, destPos, dir));
        }
        

        //  動き終わったオブジェクトからなる配列を返します。
        public update(): ObjectMovingData[] {
            var endObjects: ObjectMovingData[] = [];
            var continueObjects: ObjectMovingData[] = [];
            for (var i = 0; i < this._queue.length; i++) {
                this._queue[i].update();
                if ( this._queue[i].isAchievedDestination) {
                    endObjects.push(this._queue[i]);
                    this._wwa.setPartsOnPosition(
                        wwa_data.PartsType.OBJECT,
                        0,
                        this._queue[i].beforePosition.getPartsCoord()
                        );
                    this._wwa.setPartsOnPosition(
                        wwa_data.PartsType.OBJECT,
                        this._queue[i].objID,
                        this._queue[i].destination.getPartsCoord()
                        );

                } else {
                    continueObjects.push(this._queue[i]);
                }
            }
            this._queue = continueObjects;
            return endObjects;
        }

        public clear() {
            this._queue = [];
        }

        // crop座標と描画先座標の組の配列を返すメソッドを実装せよ
        public get objectMovingData(): ObjectMovingData[] {
            return this.objectMovingData;
        }
        

        // 本当はnullを返したくはないんだけど、例外を投げると重くなるので
        public getOffsetByBeforePartsCoord(coord: wwa_data.Coord): wwa_data.Coord {
            var result = this._queue.filter((x) => {
                return x.beforePosition.getPartsCoord().equals(coord);
            });

            if (result.length === 0) {
                return null;
            }

            return result[0].currentPosition.getOffsetCoord();

        }


    }

}