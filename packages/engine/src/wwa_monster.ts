import { Coord, Status } from "./wwa_data";
export class Monster {

    constructor(
        private _partsID: number,
        private _position: Coord,
        private _imgCoord: Coord,
        private _status: Status,
        private _message: string,
        private _item: number,
        private _battleEndCallback: () => void,
        private _calcCustomCalcDamageFunc: () => boolean
    ) {

    }

    get partsID(): number { return this._partsID; }
    get position(): Coord { return this._position; }
    get imgCoord(): Coord { return this._imgCoord; }
    get status(): Status { return this._status; }
    get message(): string { return this._message; }
    get item(): number { return this._item; }

    public damage(amount: number): void {
        // Playerから敵を攻撃した時に呼ばれるユーザ定義関数
        this._calcCustomCalcDamageFunc();
        // if( !this._calcCustomCalcDamageFunc() ) {
            this._status.energy = Math.max(0, this._status.energy - amount);
        // }
    }

    public battleEndProcess(): void {
        this._battleEndCallback();
    }

}

