/// <reference path="./wwa_data.ts" />

module wwa_picture {
    export enum propertyType {
        UNDEFINED = 0,
        POS = 1,
        DELAY = 2,
        TIME = 3,
        SIZE = 4,
        CLIP = 5,
        NEXT = 6
    }
    export var propertyTable = {
        ""      : 0,
        "pos"   : 1,
        "delay" : 2,
        "time"  : 3,
        "size"  : 4,
        "clip"  : 5,
        "next"  : 6
    };
    export class WWAPictureData {
        private _startTime: number;
        private _pos: wwa_data.Coord;
        private _size: wwa_data.Coord;
        private _opacity: number;
        private _anim: Array<WWAPictureAnimation>;
        private _zoon: WWAPictureZoom;
        constructor() {
        }
        public parseToItem(message: string) {
            var lines = message
                .split(/\n\<c\>/i)[0]
                .split(/\<c\>/i)[0]
                .split(/\n/i);
            lines.forEach((value, i) => {
                var property = value.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)/);
                if (property === null || property.length !== 3) {
                    throw new Error("プロパティではありません");
                }
                
            });
        }
        public setItem(item) {
            this._pos = new wwa_data.Coord(item.pos__X, item.pos__Y);
            this._size = new wwa_data.Coord(item.size__X, item.size__Y);
            this._opacity = item.opacity;
        }
        public update() {
        }
    }
    export interface WWAPictureAnimation {
        // updateメソッドはX座標とY座標の差分を返します
        update(): wwa_data.Coord;
    }
    class StraightAnimation implements WWAPictureAnimation {
        private _speedX: number;
        private _speedY: number;
        private _accelX: number;
        private _accelY: number;
        constructor(x: number, y: number) {
            this._speedX = x;
            this._speedY = y;
            this._accelX = 0;
            this._accelY = 0;
        }
        setAccel(x: number, y: number) {
            this._accelX = x;
            this._accelY = y;
        }
        update(): wwa_data.Coord {
            return new wwa_data.Coord(this._accelX, this._accelY);
        }
    }
    class CircleAnimation implements WWAPictureAnimation {
        private _distance: number;
        private _speedDeg: number;
        private _accelDeg: number;
        private _deg: number;
        constructor(distance: number, deg: number) {
            this._distance = distance;
            this._speedDeg = deg;
            this._accelDeg = 0;
            this._deg = 0;
        }
        setAccel(deg: number) {
            this._accelDeg = deg;
        }
        update(): wwa_data.Coord {
            let x = Math.cos(this._deg) * this._distance;
            let y = Math.sin(this._deg) * this._distance;
            this._deg += this._speedDeg;
            this._speedDeg += this._accelDeg;
            return new wwa_data.Coord(x, y);
        }
    }
    export class WWAPictureZoom {
        private _zoom: number;
        private _accelZoom: number;
        constructor(zoom: number) {
            this._zoom = zoom;
            this._accelZoom = 0;
        }
        setAccel(zoom: number) {
            this._accelZoom = zoom;
        }
        update(): number {
            this._zoom += this._accelZoom;
            return this._zoom;
        }
    }
}