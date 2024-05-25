export interface WWAPictureAnimation {
    getImgPos(isMainAnimation: boolean): [number, number];
    hasImg(): boolean;
    switchAnimation();
}

export class WWAPictureMultipleAnimation implements WWAPictureAnimation {
    private currentAnimation = 0;
    private readonly cropsCount: number;
    constructor(private imgCrops: [number, number][]) {
        this.cropsCount = imgCrops.length;
    }

    public getImgPos() {
        return this.imgCrops[this.currentAnimation];
    }

    public hasImg() {
        return this.cropsCount > 0;
    }

    public switchAnimation() {
        this.currentAnimation++;
        if (this.currentAnimation >= this.cropsCount) {
            this.currentAnimation = 0;
        }
    }
}

export class WWAPictureDefaultAnimation implements WWAPictureAnimation {

    private readonly hasSubAnimation: boolean;
    
    constructor(
        private readonly _imgMainX: number,
        private readonly _imgMainY: number,
        private readonly _imgSubX: number,
        private readonly _imgSubY: number,
    ) {
        this.hasSubAnimation = this._imgSubX !== 0 || this._imgSubY !== 0;
    }

    public getImgPos(isMainAnimation: boolean): [number, number] {
        if (isMainAnimation || !this.hasSubAnimation) {
            return [this._imgMainX, this._imgMainY];
        }
        return [this._imgSubX, this._imgSubY];
    }

    public hasImg() {
        return this._imgMainX !== 0 || this._imgMainY !== 0 || this._imgSubX !== 0 || this._imgSubY !== 0;
    }

    public switchAnimation() {
        // 何もしない
    }
}