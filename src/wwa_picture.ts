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
        // 初期設定
        public imageCrop: wwa_data.Coord;
        public imageAnimCrop: wwa_data.Coord;
        private _startTimer: wwa_data.Timer;
        private _dispTimer: wwa_data.Timer;
        private _soundNum: number;
        // プロパティ指定
        public destPos: wwa_data.Coord;
        public destSize: wwa_data.Coord;
        public destAngle: number;
        public destOpacity: number;
        public cropSize: wwa_data.Coord;
        public repeat: wwa_data.Coord;
        public nextPictureData: number;
        public nextParts: number;
        // dest** は元変数から update 関数で出力した値
        private _pos: wwa_data.Coord;
        private _size: wwa_data.Coord;
        private _angle: number;
        private _opacity: number;
        // 内部制御用
        private _timer: wwa_data.Timer; // 参照される側
        private _anim: Array<WWAPictureAnimation>;
        private _zoom: WWAPictureZoom;

        public startTimeOutCallBack: () => void;
        public dispTimeOutCallBack: () => void;
        
        constructor(
        imgCropX: number, imgCropY: number,
        secondImgCropX: number, secondImgCropY: number,
        soundNum: number, waitTime: number, message: Array<string>) {
            this.imageCrop = new wwa_data.Coord(imgCropX, imgCropY);
            this.imageAnimCrop = new wwa_data.Coord(secondImgCropX, secondImgCropY);
            this.cropSize = new wwa_data.Coord(1, 1);
            this.repeat = new wwa_data.Coord(1, 1);
            this.nextPictureData = 0;
            this._startTimer = new wwa_data.Timer(waitTime, () => {
                if (this._startTimer.isTimeOut() && this._dispTimer !== undefined) {
                    this._changeTimer(this._dispTimer);
                }
            });
            this._timer = this._startTimer;
            
            // 既定値を設定
            this._pos = new wwa_data.Coord(0, 0);
            this._size = new wwa_data.Coord(wwa_data.WWAConsts.CHIP_SIZE, wwa_data.WWAConsts.CHIP_SIZE);
            this._angle = 0;
            this._opacity = 1.0;
            this._soundNum = soundNum;

            message.forEach((line, index) => {
                var property = new Property(this, line);
                property.setProperty();
            }, this);
            this._timer.start();
        }
        public update() {
            this._timer.tick();
            if (this.isVisible()) {
                this._animate();
            }
        }
        private _animate() {
            this.destPos = this._pos;
            this.destSize = this._size;
            this.destAngle = this._angle;
            this.destOpacity = this._opacity;
        }
        public isVisible(): boolean {
            if (!this._startTimer.isSet) {
                return true;
            }
            return this._startTimer.isTimeOut();
        }
        public isTimeOut(): boolean {
            return this._timer.isTimeOut();
        }
        private _changeTimer(newTimer: wwa_data.Timer) {
            this._timer.stop();
            this._timer = newTimer;
            this._timer.start();
        }
        public hasSecondaryImage(): boolean {
            return this.imageAnimCrop.x != 0 || this.imageAnimCrop.y != 0;
        }
        set pos(pos: wwa_data.Coord) {
            this._pos = pos;
        }
        set endTime(time: number) {
            this._dispTimer = new wwa_data.Timer(time);
            if (!this._startTimer.isSet) {
                this._timer = this._dispTimer;
            }
        }
        set size(size: wwa_data.Coord) {
            this._size = size;
        }
        set angle(angle: number) {
            this._angle = angle;
        }
        set opacity(opacity: number) {
            if (opacity > 1.0) {
                this._opacity = 1.0;
            } else {
                this._opacity = opacity;
            }
        }
    }
    export class Property {
        private _type: propertyType;
        private _value: Array<string>;
        constructor(private _data: PictureData, line: string) {
            var property = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)/);
            if (property === null || property.length !== 3) {
                throw new Error("プロパティではありません");
            }
            this._type = propertyTable[property[1]];
            this._value = property[2].split(",");
        }
        public setProperty() {
            try {
                if (this._type === propertyType.POS) {
                    var x = this.getIntValue(0);
                    var y = this.getIntValue(1);
                    this._data.pos = new wwa_data.Coord(x, y);
                } else if (this._type === propertyType.TIME) {
                    var time = this.getIntValue(0);
                    var next = this.getIntValue(1, 0);
                    this._data.endTime = time;
                    this._data.nextPictureData = next;
                } else if (this._type === propertyType.NEXT) {
                } else if (this._type === propertyType.SIZE) {
                    var w = this.getIntValue(0);
                    var h = this.getIntValue(1);
                    this._data.size = new wwa_data.Coord(w, h);
                } else if (this._type === propertyType.CLIP) {
                    var w = this.getIntValue(0);
                    var h = this.getIntValue(1);
                    this._data.cropSize = new wwa_data.Coord(w, h);
                } else if (this._type === propertyType.ANGLE) {
                    var angle = this.getFloatValue(0);
                    this._data.angle = angle;
                } else if (this._type === propertyType.REPEAT) {
                    var w = this.getIntValue(0);
                    var h = this.getIntValue(1);
                    this._data.repeat = new wwa_data.Coord(w, h);
                } else if (this._type === propertyType.FILL) {
                    // SCREEN_WIDTH は横幅14マスなんだよなあ、ステータス欄を除外するように調整したい
                    this._data.repeat = new wwa_data.Coord(wwa_data.WWAConsts.SCREEN_WIDTH / wwa_data.WWAConsts.CHIP_SIZE, wwa_data.WWAConsts.SCREEN_HEIGHT / wwa_data.WWAConsts.CHIP_SIZE);
                } else if (this._type === propertyType.OPACITY) {
                    var v = this.getFloatValue(0);
                    this._data.opacity = v;
                }
            } catch (e) {

            }
        }
        public getIntValue(num: number, fallback: number = 0): number {
            var value = parseInt(this._value[num], 10);
            if (isNaN(value)) {
                return fallback;
            }
            return value;
        }
        public getFloatValue(num: number, fallback: number = 0.0): number {
            var value = parseFloat(this._value[num]);
            if (isNaN(value)) {
                return fallback;
            }
            return value;
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