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
        if( !this._calcCustomCalcDamageFunc() ) {
            this._status.energy = Math.max(0, this._status.energy - amount);
        }
    }

    public battleEndProcess(): void {
        this._battleEndCallback();
    }

    public setStatus(status: Status): void {
        if(status.energy !== null) {
            this._status.energy = status.energy;
        }
        if(status.strength !== null) {
            this._status.strength = status.strength;
        }
        if(status.defence !== null) {
            this._status.defence = status.defence;
        }
    }
}

