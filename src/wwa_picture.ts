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
        // dest** は元変数から update 関数で出力した値
        public destPos: wwa_data.Coord;
        public destSize: wwa_data.Coord;
        
        public imageCrop: wwa_data.Coord;
        public cropSize: wwa_data.Coord;
        public startTime: number;
        public endTime: number;
        
        private _available: boolean;
        private _pos: wwa_data.Coord;
        private _size: wwa_data.Coord;
        private _soundNum: number;
        private _opacity: number;
        private _anim: Array<WWAPictureAnimation>;
        private _zoom: WWAPictureZoom;
        constructor() {
            this._available = false;
        }
        // イメージの場所や各行の配列を引数にします
        public setData(imgCropX: number, imgCropY: number, soundNum: number, message: Array<string>) {
            this.imageCrop = new wwa_data.Coord(imgCropX, imgCropY);
            this.cropSize = new wwa_data.Coord(1, 1);

            this._pos = new wwa_data.Coord(0, 0);
            this._size = new wwa_data.Coord(wwa_data.WWAConsts.CHIP_SIZE, wwa_data.WWAConsts.CHIP_SIZE);

            this._soundNum = soundNum;
            message.forEach((line, index) => {
                var propery = new wwa_picture.Property(line);
                this.setProperty(propery);
            }, this);
            this._available = true;
        }
        public setProperty(property: Property) {
            try {
                if (property.getType() === propertyType.POS) {
                    var x = property.getNumberValue(0);
                    var y = property.getNumberValue(1);
                    this._pos = new wwa_data.Coord(x, y);
                } else if (property.getType() === propertyType.DELAY) {
                    var time = property.getNumberValue(0);
                    this.startTime = time;
                } else if (property.getType() === propertyType.TIME) {
                    var time = property.getNumberValue(0);
                    this.endTime = time;
                } else if (property.getType() === propertyType.SIZE) {
                    var x = property.getNumberValue(0);
                    var y = property.getNumberValue(1);
                    this._size = new wwa_data.Coord(x, y);
                } else if (property.getType() === propertyType.CLIP) {
                    var x = property.getNumberValue(0);
                    var y = property.getNumberValue(1);
                    this.cropSize = new wwa_data.Coord(x, y);
                }
            } catch (e) {

            }
        }
        public isAvailable(): boolean {
            return this._available;
        }
        public update() {
            this.destPos = this._pos;
            this.destSize = this._size;
        }
    }
    export class Property {
        private _key: string;
        private _value: Array<string>;
        constructor(line: string) {
            var property = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)/);
            if (property === null || property.length !== 3) {
                throw new Error("プロパティではありません");
            }
            this._key = property[1];
            this._value = property[2].split(",");
        }
        public getType(): propertyType {
            return propertyTable[this._key];
        }
        public getNumberValue(num: number): number {
            return parseInt(this._value[num], 10);
        }
        public getStringValue(num: number): string {
            return this._value[num];
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