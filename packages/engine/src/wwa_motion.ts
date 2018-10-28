import { WWA } from "./wwa_main";
import { Direction as Dir, Position, speedList, PartsType, Coord, Direction } from "./wwa_data";
import { Player } from "./wwa_parts_player";


export class ObjectMovingData {
private _currentPos: Position;


public constructor(
private _player: Player,
private _objectID: number,
private _srcPos: Position,
private _destPos: Position,
private _dir: Dir
) {
this._currentPos = this._srcPos.clone();
}

public update(): Position {
var speedIndex = this._player.getSpeedIndex();
this._currentPos = this._currentPos.getNextFramePosition(
this._dir,
speedList[speedIndex],
speedList[speedIndex]);

return this._currentPos;
}

public get isAchievedDestination(): boolean {
return this._currentPos.equals(this._destPos);
}

public get currentPosition(): Position {
return this._currentPos;
}

public get beforePosition(): Position {
return this._srcPos;
}

public get destination(): Position {
return this._destPos;
}

public get objID(): number {
return this._objectID;
}
}


export class ObjectMovingDataManager {

private _queue: ObjectMovingData[];

// TODO: シングルトンにする
public constructor(private _wwa: WWA, private _player: Player) {
this.clear();
}

public add(objectID: number, srcPos: Position, destPos: Position, dir: Direction): void {
this._queue.push(new ObjectMovingData(this._player, objectID, srcPos, destPos, dir));
}


//  動き終わったオブジェクトからなる配列を返します。
public update(): ObjectMovingData[] {
var endObjects: ObjectMovingData[] = [];
var continueObjects: ObjectMovingData[] = [];
for (var i = 0; i < this._queue.length; i++) {
this._queue[i].update();
if (this._queue[i].isAchievedDestination) {
endObjects.push(this._queue[i]);
this._wwa.setPartsOnPosition(
PartsType.OBJECT,
0,
this._queue[i].beforePosition.getPartsCoord()
);
this._wwa.setPartsOnPosition(
PartsType.OBJECT,
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
public getOffsetByBeforePartsCoord(coord: Coord): Coord {
var result = this._queue.filter((x) => {
return x.beforePosition.getPartsCoord().equals(coord);
});

if (result.length === 0) {
return null;
}

return result[0].currentPosition.getOffsetCoord();

}

}

