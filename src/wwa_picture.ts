/// <reference path="./wwa_data.ts" />

module wwa_picture {
    export enum propertyType {
        UNDEFINED = 0,
        POS = 1,
        TIME = 2,
        NEXT = 3,
        SIZE = 4,
        CLIP = 5,
        ANGLE = 6,
        REPEAT = 7,
        FILL = 8,
        OPACITY = 9,
        TEXT = 11,
        TEXT_VAR = 12,
        FONT = 13,
        COLOR = 14,
        ANIM_STRAIGHT = 21,
        ANIM_CIRCLE = 22,
        ANIM_ZOOM = 23,
        ANIM_ROTATE = 24,
        ANIM_FADE = 25,
        ACCEL_STRAIGHT = 31,
        ACCEL_CIRCLE = 32,
        ACCEL_ZOOM = 33,
        ACCEL_ROTATE = 34,
        ACCEL_FADE = 35
    }
    export var propertyTable = {
        ""         : 0,
        "pos"      : 1,
        "time"     : 2,
        "next"     : 3,
        "size"     : 4,
        "clip"     : 5,
        "angle"    : 6,
        "repeat"   : 7,
        "fill"     : 8,
        "opacity"  : 9,
        "text"     : 11,
        "text_var" : 12,
        "font"     : 13,
        "color"    : 14,
        "anim_straight" : 21,
        "anim_circle"   : 22,
        "anim_zoom"     : 23,
        "anim_rotate"   : 24,
        "anim_fade"     : 25,
        "accel_straight" : 31,
        "accel_circle"   : 32,
        "accel_zoom"     : 33,
        "accel_rotate"   : 34,
        "accel_fade"     : 35
    };
    export class PictureData {
        // dest** は元変数から update 関数で出力した値
        public destPos: wwa_data.Coord;
        public destSize: wwa_data.Coord;
        public destAngle: wwa_data.Coord;
        public destOpacity: number;
        
        private _pos: wwa_data.Coord;
        private _size: wwa_data.Coord;
        private _angle: wwa_data.Coord;
        private _opacity: number;
        
        public imageCrop: wwa_data.Coord;
        public imageAnimCrop: wwa_data.Coord;
        public cropSize: wwa_data.Coord;
        public startTime: number;
        public endTime: number;

        private _soundNum: number;
        private _timer: number;
        private _anim: Array<WWAPictureAnimation>;
        private _zoom: WWAPictureZoom;
        
        constructor(
        imgCropX: number, imgCropY: number,
        imgAnimCropX: number, imgAnimCropY: number,
        soundNum: number, waitTime: number, message: Array<string>) {
            this.imageCrop = new wwa_data.Coord(imgCropX, imgCropY);
            this.imageAnimCrop = new wwa_data.Coord(imgAnimCropX, imgAnimCropY);
            this.cropSize = new wwa_data.Coord(1, 1);
            this.startTime = waitTime;
            this._timer = 0;

            this._pos = new wwa_data.Coord(0, 0);
            this._size = new wwa_data.Coord(wwa_data.WWAConsts.CHIP_SIZE, wwa_data.WWAConsts.CHIP_SIZE);

            this._soundNum = soundNum;
            message.forEach((line, index) => {
                var propery = new Property(line);
                this.setProperty(propery);
            }, this);
        }
        public setProperty(property: Property) {
            try {
                if (property.getType() === propertyType.POS) {
                    var x = property.getNumberValue(0);
                    var y = property.getNumberValue(1);
                    this._pos = new wwa_data.Coord(x, y);
                } else if (property.getType() === propertyType.TIME) {
                    var time = property.getNumberValue(0);
                    this.endTime = time;
                } else if (property.getType() === propertyType.NEXT) {
                } else if (property.getType() === propertyType.SIZE) {
                    var x = property.getNumberValue(0);
                    var y = property.getNumberValue(1);
                    this._size = new wwa_data.Coord(x, y);
                } else if (property.getType() === propertyType.CLIP) {
                    var x = property.getNumberValue(0);
                    var y = property.getNumberValue(1);
                    this.cropSize = new wwa_data.Coord(x, y);
                } else if (property.getType() === propertyType.ANGLE) {

                } else if (property.getType() === propertyType.REPEAT) {

                } else if (property.getType() === propertyType.FILL) {

                } else if (property.getType() === propertyType.OPACITY) {

                }
            } catch (e) {

            }
        }
        public update() {
            this.destPos = this._pos;
            this.destSize = this._size;
            this._timer++;
        }
        public isTimeOut(): boolean {
            if (this.endTime === undefined) {
                return false;
            }
            return this._timer >= this.endTime;
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