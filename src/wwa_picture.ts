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
        public static isPrimaryAnimationTime: boolean = true;
        // 初期設定
        private _imageCrop: wwa_data.Coord;
        private _secondImageCrop: wwa_data.Coord;
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
        private _isVisible: boolean;
        private _isTimeout: boolean;
        private _intervalID: number;
        private _anims: Array<Animation>;
        private _zoom: WWAPictureZoom;

        constructor(
        imgCropX: number, imgCropY: number,
        secondImgCropX: number, secondImgCropY: number,
        soundNum: number, waitTime: number, message: Array<string>) {
            this._imageCrop = new wwa_data.Coord(imgCropX, imgCropY);
            this._secondImageCrop = new wwa_data.Coord(secondImgCropX, secondImgCropY);
            this.cropSize = new wwa_data.Coord(1, 1);
            this.repeat = new wwa_data.Coord(1, 1);
            this.nextPictureData = 0;
            this._startTimer = new wwa_data.Timer(waitTime, false, () => {
                this._isVisible = true;
                if (this._dispTimer !== void 0) {
                    this._dispTimer.start();
                }
            });
            this._isVisible = waitTime <= 0;
            this._isTimeout = false;
            this._anims = new Array();
            
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
            this.destPos = this._pos;
            this.destSize = this._size;
            this.destAngle = this._angle;
            this.destOpacity = this._opacity;
        }
        public update() {
            /*this._anims.forEach((anim) => {
                anim.update(this);
            }, this);*/
        }
        /** メッセージ表示後にイメージ表示を行いたいので、タイマーの開始はコンストラクタに含めない */
        public start() {
            this._startTimer.start();
            this._intervalID = setInterval(this.update, 10);
        }
        public addAnimation(anim: Animation) {
            this._anims.push(anim);
        }
        public isVisible(): boolean {
            return this._isVisible;
        }
        public isTimeOut(): boolean {
            return this._isTimeout;
        }
        public getImageCrop(): wwa_data.Coord {
            if (this.hasSecondaryImage()) {
                return PictureData.isPrimaryAnimationTime ? this._imageCrop : this._secondImageCrop;
            }
            return this._imageCrop;
        }
        public hasSecondaryImage(): boolean {
            return this._secondImageCrop.x != 0 || this._secondImageCrop.y != 0;
        }
        get width(): number {
            return this.repeat.x * wwa_data.WWAConsts.CHIP_SIZE;
        }
        get height(): number {
            return this.repeat.y * wwa_data.WWAConsts. CHIP_SIZE;
        }
        set pos(pos: wwa_data.Coord) {
            this._pos = pos;
        }
        set endTime(time: number) {
            this._dispTimer = new wwa_data.Timer(time, false, () => {
                this._isVisible = false;
                this._isTimeout = true;
                clearInterval(this._intervalID);
            });
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
        private _type: string;
        private _value: Array<string>;
        constructor(private _data: PictureData, line: string) {
            var property = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)/);
            if (property === null || property.length !== 3) {
                throw new Error("プロパティではありません");
            }
            this._type = property[1];
            this._value = property[2].split(",");
        }
        public setProperty() {
            try {
                if (this._type in propertyObject) {
                    propertyObject[this._type].set(this, this._data);
                } else {
                    throw new Error("プロパティが見つかりません");
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
    export interface PropertySetter {
        set(property: Property, data: PictureData);
    }
    class PosSetter implements PropertySetter {
        set(property: Property, data: PictureData) {
            var x = property.getIntValue(0);
            var y = property.getIntValue(1);
            data.pos = new wwa_data.Coord(x, y);
        }
        setAnimation(property: Property, data: PictureData) {
            var x = property.getIntValue(0);
            var y = property.getIntValue(1);
            data.addAnimation(new StraightAnimation(x, y));
        }
    }
    class TimeSetter implements PropertySetter {
        set(property: Property, data: PictureData) {
            var time = property.getIntValue(0);
            var next = property.getIntValue(1, 0);
            data.endTime = time;
            data.nextPictureData = next;
        }
    }
    class SizeSetter implements PropertySetter {
        set(property: Property, data: PictureData) {
            var w = property.getIntValue(0);
            var h = property.getIntValue(1);
            data.size = new wwa_data.Coord(w, h);
        }
    }
    class ClipSetter implements PropertySetter {
        set (property: Property, data: PictureData) {
            data.cropSize.x = property.getIntValue(0);
            data.cropSize.y = property.getIntValue(1);
        }
    }
    class AngleSetter implements PropertySetter {
        set (property: Property, data: PictureData) {
            var angle = property.getFloatValue(0);
            data.angle = angle;
        }
    }
    class RepeatSetter implements PropertySetter {
        set (property: Property, data: PictureData) {
            data.repeat.x = property.getIntValue(0);
            data.repeat.y = property.getIntValue(1);
        }
    }
    class OpacitySetter implements PropertySetter {
        set (property: Property, data: PictureData) {
            var v = property.getFloatValue(0);
            data.opacity = v;
        }
    }
    export interface Animation {
        update(data: PictureData): void;
    }
    class StraightAnimation implements Animation {
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
        update(data: PictureData): void {
            data.destPos.x += this._speedX;
            data.destPos.y += this._speedY;
        }
    }
    class CircleAnimation implements Animation {
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
        update(data: PictureData) {
            let x = Math.cos(this._deg) * this._distance;
            let y = Math.sin(this._deg) * this._distance;
            data.destAngle += this._speedDeg;
            this._speedDeg += this._accelDeg;
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
    var propertyObject: { [key: string]: PropertySetter } = {
        "pos": new PosSetter(),
        "time": new TimeSetter(),
        "size": new SizeSetter(),
        "clip": new ClipSetter(),
        "angle": new AngleSetter(),
        "repeat": new RepeatSetter(),
        "opacity": new OpacitySetter()
    }
}