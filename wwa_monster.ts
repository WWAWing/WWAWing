/// <reference path="./wwa_main.ts" />

module wwa_monster {
    export class Monster {

        constructor(
            private _partsID: number,
            private _position: wwa_data.Coord,
            private _imgCoord: wwa_data.Coord,
            private _status: wwa_data.Status,
            private _message: string,
            private _item: number,
            private _battleEndCallback: () => void
            ) {

        }

        get partsID(): number { return this._partsID; }
        get position(): wwa_data.Coord { return this._position; }
        get imgCoord(): wwa_data.Coord { return this._imgCoord; }
        get status(): wwa_data.Status { return this._status; }
        get message():string { return this._message; }
        get item(): number { return this._item; }

        public damage( amount: number): void {
            this._status.energy = Math.max(0, this._status.energy - amount);
        }

        public battleEndProcess(): void {
            this._battleEndCallback();
        }

    }

}
