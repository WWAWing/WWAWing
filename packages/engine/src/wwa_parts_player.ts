import { SystemMessage } from "@wwawing/common-interface";
import { WWA } from "./wwa_main";
import {
    Position,
    Direction,
    WWAConsts as Consts,
    Status,
    EquipmentStatus,
    speedList,
    PartsType,
    ItemMode,
    SystemSound,
    AppearanceTriggerType,
    Coord,
    type BattleTurnResult,
} from "./wwa_data";
import { Camera } from "./wwa_camera";
import { Monster } from "./wwa_monster";
import * as util from "./wwa_util";

export class Parts {
    protected _position: Position;
    protected _wwa: WWA;
    public getPosition(): Position {
        return this._position;
    }
    constructor(pos: Position) {
        this._position = pos;
    }
}

export class PartsObject extends Parts {
    constructor(pos: Position) {
        super(pos);
    }
}

export class PartsMap extends Parts {
    constructor(pos: Position) {
        super(pos);
    }
}

export enum PlayerState {
    CONTROLLABLE,
    MOVING,
    CAMERA_MOVING,
    MESSAGE_WAITING,
    LOCALGATE_JUMPED,
    BATTLE,
    ESTIMATE_WINDOW_WAITING,
    PASSWORD_WINDOW_WAITING,
    LOCALGATE_JUMPED_WITH_MESSAGE,
}

export class Player extends PartsObject {
    protected _status: Status;
    protected _equipStatus: EquipmentStatus;
    protected _energyMax: number;
    protected _dir: Direction;
    protected _jumpWaitFramesRemain: number;
    protected _camera: Camera;
    protected _state: PlayerState;
    protected _isPartsEventExecuted: boolean;
    protected _samePosLastExecutedMapID: number;
    protected _samePosLastExecutedObjID: number;
    protected _executedObjPartsID_onSamePosition: number;
    protected _isMovingImage: boolean; // 将来静止中の描画パターンを増やすつもりはないので boolean で

    protected _partsAppeared: boolean;

    protected _energyValueElement: HTMLElement;
    protected _strengthValueElement: HTMLElement;
    protected _defenceValueElement: HTMLElement;
    protected _goldValueElement: HTMLElement;

    /**
     * index は 0...11
     */
    protected _itemBox: number[];
    protected _itemBoxElement: HTMLDivElement[];
    protected _itemUsingEvent: EventListener[];
    protected _readyToUseItemPos1To12: number;
    protected _isReadyToUseItem: boolean;

    protected _battleFrameCounter: number;
    protected _isPlayerTurn: boolean;
    protected _battleTurnLength: number;

    protected _enemy: Monster;
    protected _moves: number;
    // 現状使われていないに等しいが、セーブデータに互換性のため入っている。
    protected _frameCount: number;

    protected _moveMacroWaitingRemainMoves: number;
    protected _moveObjectAutoExecTimer: number;

    protected _afterMoveMacroFlag: boolean;

    protected _isClickableItemGot: boolean;

    protected _isPreparedForLookingAround: boolean;
    protected _lookingAroundTimer: number;

    protected _speedIndex: number;

    protected _messageDelayFrameCount: number;

    // ダメージが発生していないターンの長さ (0ダメージターンがあるごとに加算)
    // プレイヤーターン, 敵ターンともに1ターンとしてカウントする。
    // 戦闘開始からでなくとも、途中から0ダメージターンが規定回数が超えた場合も終了。
    // 戦闘していない場合は 0。
    protected _battleNoDamageTurnLength: number;

    public move(): void {
        if (this.isControllable()) {
            this.controll(this._dir);
            return;
        }
        if (this._state === PlayerState.CAMERA_MOVING) {
            try {
                this._camera.move(this._dir);
            } catch (e) {
                // この時点で範囲外になることはないとは思うが...
            }
            if (this._isOnCameraStopPosition()) {
                this._state = PlayerState.CONTROLLABLE;
                // カメラ画面が動き終わった際にユーザー定義独自関数を呼び出す
                this._wwa.callCameraMoveUserDefineFunction();
            }
        } else if (this._state === PlayerState.MOVING) {
            try {
                var next = this._position.getNextFramePosition(
                    this._dir, speedList[this._speedIndex], speedList[this._speedIndex]);
            } catch (e) {
                // この時点で範囲外になることはないとは思うが...
            }
            if (next.isJustPosition()) {
                this._state = PlayerState.CONTROLLABLE;
                this.toggleMovingImage();
                this._moves++;
                this._isPartsEventExecuted = false;
                this._samePosLastExecutedMapID = void 0;
                this._samePosLastExecutedObjID = void 0;
                /** プレイヤーが動いた歳ユーザ定義独自関数を呼び出す */
                this._wwa.callMoveUserDefineFunction();
            }
            this._position = next;
        }
    }

    public controll(moveDir: Direction): void {
        var nextFramePos: Position;
        var nextJustPos: Position;
        if (this.isControllable()) {
            this._isPreparedForLookingAround = false;
            this._dir = moveDir;

            try {
                nextFramePos = this._position.getNextFramePosition(
                    this._dir, speedList[this._speedIndex], speedList[this._speedIndex]);
                nextJustPos = this._position.getNextJustPosition(moveDir);
            } catch (e) {
                // 範囲外座標
                return;
            }

            if (this._isOnCameraMovingPosition()) {
                ////////////////////// 本番ではデバッグ消すこと！！！//////////////////////
                if (this._wwa.getMapIdByPosition(nextJustPos) !== 0 || this._wwa.isOldMap() || this._wwa.debug) {
                    //                    if (this._wwa.getMapIdByPosition(nextJustPos) !== 0 ) {
                    // カメラが動く場合、カメラが動かせることを確認して、カメラ移動モードに入る
                    try {
                        this._camera.move(this._dir);
                        this._state = PlayerState.CAMERA_MOVING;
                    } catch (e) {
                        // 範囲外座標
                        this._state = PlayerState.CONTROLLABLE;
                    }
                }
                return;
            }

            if (!this.canMoveTo(nextJustPos)) {
                if (this._wwa.getMapTypeByPosition(nextJustPos) === Consts.MAP_WALL) {
                    this._wwa.checkMap(nextJustPos.getPartsCoord());
                }
                this._wwa.checkObject(nextJustPos.getPartsCoord());
                return;
            }

            // カメラが動く場所(画面端)でなくて、移動可能なら移動モードに入って終わり
            this._position = nextFramePos;
            this._state = PlayerState.MOVING;

            if (this._wwa.getMapAttributeByPosition(this._position.getNextJustPosition(moveDir), Consts.ATR_TYPE) !== Consts.MAP_LOCALGATE) {
                this._wwa.moveObjects(true);
            }

        }
    }

    public setDir(newDir: Direction): void {
        this._isPreparedForLookingAround = false;
        this._dir = newDir;
    }


    // 座標posに移動できるならtrue, 移動できないならfalse
    public canMoveTo(pos: Position): boolean {

        if (pos === null) {
            return false;
        }


        /////////// DEBUG //////////////
        if (this._wwa.debug) {
            return true;
        }
        ////////////////////////////////

        var w = this._wwa.getMapWidth();
        var pc = pos.getPartsCoord();
        var po = pos.getOffsetCoord();

        // 背景衝突判定1: 背景がない場合
        if (this._wwa.getMapIdByPosition(pos) === 0 && !this._wwa.isOldMap()) {
            return false;
        }

        // 背景衝突判定2: 壁
        if (this._wwa.getMapTypeByPosition(pos) === Consts.MAP_WALL) {
            return false;
        }

        // 物体衝突判定1: 物体がない場合
        if (this._wwa.getObjectIdByPosition(pos) === 0) {
            return true;
        }

        // 物体衝突判定2: 通り抜け可能通常物体
        if (this._wwa.getObjectTypeByPosition(pos) === Consts.OBJECT_NORMAL &&
            this._wwa.getObjectAttributeByPosition(pos, Consts.ATR_MODE) === Consts.PASSABLE_OBJECT) {
            return true;
        }

        // 物体衝突判定3: 通り抜け可能扉 (鍵アイテム所持時はアイテム処理を行うため通り抜け不可）
        if (this._wwa.getObjectTypeByPosition(pos) === Consts.OBJECT_DOOR &&
            this._wwa.getObjectAttributeByPosition(pos, Consts.ATR_NUMBER) === Consts.PASSABLE_OBJECT) {
            if (this.hasItem(this._wwa.getObjectAttributeByPosition(pos, Consts.ATR_ITEM))) {
                return false;
            }
            return true;
        }

        // その他の物体
        return false;
    }

    // プレイヤーが動いているかどうか。カメラが動いている場合も動いているとする。
    public isMoving(): boolean {
        return this._state == PlayerState.MOVING || this._state == PlayerState.CAMERA_MOVING;
    }

    private _isOnCameraMovingPosition(): boolean {
        var camPos = this._camera.getPosition().getPartsCoord();
        var pPos = this.getPosition().getPartsCoord();
        return (
            (pPos.x - camPos.x === Consts.H_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.RIGHT) ||
            (pPos.x === camPos.x && this._dir === Direction.LEFT) ||
            (pPos.y - camPos.y === Consts.V_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.DOWN) ||
            (pPos.y === camPos.y && this._dir === Direction.UP)
        );
    }

    private _isOnCameraStopPosition(): boolean {
        var camPos = this._camera.getPosition().getPartsCoord();
        var pPos = this.getPosition().getPartsCoord();
        return (
            (pPos.x - camPos.x === Consts.H_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.LEFT) ||
            (pPos.x === camPos.x && this._dir === Direction.RIGHT) ||
            (pPos.y - camPos.y === Consts.V_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.UP) ||
            (pPos.y === camPos.y && this._dir === Direction.DOWN)
        );
    }


    public isControllable(): boolean {
        var isAfterMoveMacro = this._afterMoveMacroFlag;
        this._afterMoveMacroFlag = false;
        return (
            this._state === PlayerState.CONTROLLABLE &&
            !this._partsAppeared &&
            (
                (
                    this._wwa.getMapTypeByPosition(this._position) !== Consts.MAP_LOCALGATE &&
                    this._wwa.getMapTypeByPosition(this._position) !== Consts.MAP_URLGATE
                ) ||
                !this._wwa.isPrevFrameEventExecuted()
            ) &&
            this._moveMacroWaitingRemainMoves === 0 && this._moveObjectAutoExecTimer === 0 &&
            !isAfterMoveMacro && this._wwa.canInput()
        );
    }



    public getCopyOfItemBox(): number[] {
        return this._itemBox.slice();
    }

    public getDir(): Direction {
        return this._dir;
    }

    public isMovingImage(): boolean {
        return this._isMovingImage;
    }

    public toggleMovingImage(): void {
        if (this._isMovingImage) {
            this._isMovingImage = false;
        } else {
            this._isMovingImage = true;
        }
    }

    public getEnergyMax(): number {
        return this._energyMax;
    }

    public isJumped(): boolean {
        return this._state === PlayerState.LOCALGATE_JUMPED || this._state === PlayerState.LOCALGATE_JUMPED_WITH_MESSAGE;
    }

    public setMessageWaiting(): void {
        this._state = PlayerState.MESSAGE_WAITING;
    }

    public isWaitingMessage(): boolean {
        return this._state === PlayerState.MESSAGE_WAITING;
    }

    public isDelayFrame(): boolean {
        return this._messageDelayFrameCount > 0;
    }
    public updateDelayFrame(): void {
        this._messageDelayFrameCount--;
    }

    public setDelayFrame(): void {
        this._messageDelayFrameCount = 1;
    }

    public clearMessageWaiting(): void {
        if (this._state !== PlayerState.MESSAGE_WAITING && this._state !== PlayerState.LOCALGATE_JUMPED_WITH_MESSAGE) {
            return;
        }
        if (this._state === PlayerState.MESSAGE_WAITING) {
            this._state = PlayerState.CONTROLLABLE;
        } else if (this._state === PlayerState.LOCALGATE_JUMPED_WITH_MESSAGE) {
            this._state = PlayerState.LOCALGATE_JUMPED;
        }
        this._isPartsEventExecuted = true;
        if (this._isPreparedForLookingAround) {
            this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
        }
    }

    public setEstimateWindowWating(): void {
        this._state = PlayerState.ESTIMATE_WINDOW_WAITING;
    }

    public isWaitingEstimateWindow(): boolean {
        return this._state === PlayerState.ESTIMATE_WINDOW_WAITING;
    }

    public clearEstimateWindowWaiting(): void {
        if (this._state === PlayerState.ESTIMATE_WINDOW_WAITING) {
            this._state = PlayerState.CONTROLLABLE;
        }
    }

    public setPasswordWindowWating(): void {
        this._state = PlayerState.PASSWORD_WINDOW_WAITING;
    }

    public isWaitingPasswordWindow(): boolean {
        return this._state === PlayerState.PASSWORD_WINDOW_WAITING;
    }

    public clearPasswordWindowWaiting(): void {
        if (this._state === PlayerState.PASSWORD_WINDOW_WAITING) {
            this._state = PlayerState.CONTROLLABLE;
        }
    }

    public isPartsEventExecuted(): boolean {
        return this._isPartsEventExecuted;
    }

    public resetEventExecutionInfo(): void {
        this._isPartsEventExecuted = false;
    }

    public getLastExecPartsIDOnSamePosition(type: PartsType): number {
        return type === PartsType.MAP ? this._samePosLastExecutedMapID : this._samePosLastExecutedObjID
    }

    public setLastExecInfoOnSamePosition(type: PartsType, id: number) {
        if (type === PartsType.MAP) {
            this._samePosLastExecutedMapID = id;
        } else {
            this._samePosLastExecutedObjID = id;
        }
    }

    public processAfterJump(): void {
        if (this._state !== PlayerState.LOCALGATE_JUMPED && this._state !== PlayerState.LOCALGATE_JUMPED_WITH_MESSAGE) {
            return;
        }
        if (--this._jumpWaitFramesRemain === 0) {
            this._state = this._state === PlayerState.LOCALGATE_JUMPED ? PlayerState.CONTROLLABLE : PlayerState.MESSAGE_WAITING;
        }
    }

    public jumpTo(pos: Position): boolean {
        var prevCameraPos = this._camera.getPosition();
        var prevPos = this.getPosition();

        if (this._position.equals(pos)) {
            return false;
        }

        this._position = pos;
        if (!pos.isInCameraRange(this._camera, true)) {
            this._camera.reset(pos);
        }

        this._state = this._state === PlayerState.MESSAGE_WAITING ? PlayerState.LOCALGATE_JUMPED_WITH_MESSAGE : PlayerState.LOCALGATE_JUMPED;
        this._jumpWaitFramesRemain = Consts.LOCALGATE_PLAYER_WAIT_FRAME;
        this._samePosLastExecutedMapID = void 0;
        this._samePosLastExecutedObjID = void 0;

        // ジャンプ先がジャンプゲートの場合、下向きに設定
        if (pos.hasLocalGate()) {
            this._dir = Direction.DOWN;
            // 隣接4方向のジャンプゲートがある場合、ジャンプゲートの反対方向に向きを設定
        } else if (pos.getPartsCoord().y <= this._wwa.getMapWidth() - 2 && pos.getNextJustPosition(Direction.DOWN).hasLocalGate()) {
            this._dir = Direction.UP;
        } else if (pos.getPartsCoord().y >= 1 && pos.getNextJustPosition(Direction.UP).hasLocalGate()) {
            this._dir = Direction.DOWN;
        } else if (pos.getPartsCoord().x <= this._wwa.getMapWidth() - 2 && pos.getNextJustPosition(Direction.RIGHT).hasLocalGate()) {
            this._dir = Direction.LEFT;
        } else if (pos.getPartsCoord().x >= 1 && pos.getNextJustPosition(Direction.LEFT).hasLocalGate()) {
            this._dir = Direction.RIGHT;
        } else {
            this._dir = Direction.DOWN;
        }

        if (!this._camera.getPosition().equals(prevCameraPos)) {
            this._isPreparedForLookingAround = true;
            this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
        }

        // ジャンプゲートで移動した際に呼ばれるユーザ定義独自関数
        this._wwa.callJumpGateUserDefineFunction();

        return true;
    }

    // システムジャンプ (ロードなどによる強制移動)
    public systemJumpTo(pos: Position): void {
        this._position = pos;
        this._camera.reset(pos);
        this._camera.resetPreviousPosition();
        this._state = PlayerState.LOCALGATE_JUMPED;
        this._jumpWaitFramesRemain = Consts.LOCALGATE_PLAYER_WAIT_FRAME;
        this._samePosLastExecutedMapID = void 0;
        this._samePosLastExecutedObjID = void 0;
        this._dir = Direction.DOWN; // 向きは仮
        this._isPreparedForLookingAround = true;
        this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
    }

    public addStatusAll(s: Status): Status {
        this._status.add(s);
        if (this.isDead()) {
            this._status.energy = 0;
        }
        if (this._energyMax !== 0) {
            this._status.energy = Math.min(this._status.energy, this._energyMax);
        }
        this.updateStatusValueBox();
        return this._status;
    }

    public setEnergyMax(em: number): number {
        this._energyMax = em;
        if (em !== 0) {
            this._status.energy = Math.min(this._status.energy, this._energyMax);
        }
        this.updateStatusValueBox();
        return em;
    }
    public setEnergy(e: number): number {
        this._status.energy = e;
        if (this.isDead()) {
            this._status.energy = 0;
        }
        if (this._energyMax !== 0) {
            this._status.energy = Math.min(this._status.energy, this._energyMax);
        }
        this.updateStatusValueBox();
        return e;
    }

    public damage(amount: number): void {
        this._status.energy = Math.max(0, this._status.energy - amount);
        if (this.isDead()) {
            this._status.energy = 0;
        }
        if (this._energyMax !== 0) {
            this._status.energy = Math.min(this._status.energy, this._energyMax);
        }
        this.updateStatusValueBox();
    }
    public setStrength(s: number): number {
        this._status.strength = s;
        this.updateStatusValueBox();
        return s;
    }
    public setDefence(d: number): number {
        this._status.defence = d;
        this.updateStatusValueBox();
        return d;
    }
    public setGold(g: number): number {
        this._status.gold = g;
        this.updateStatusValueBox();
        return g;
    }

    // 装備品込みのステータスを返す
    public getStatus(): Status {
        return this._status.plus(this._equipStatus);
    }

    // 装備品なしのステータスを返す
    public getStatusWithoutEquipments(): Status {
        // クローンハック
        return this._status.plus(new EquipmentStatus(0, 0));
    }

    // 装備品のステータスを返す
    public getStatusOfEquipments(): EquipmentStatus {
        // クローンハック
        return this._equipStatus.plus(new EquipmentStatus(0, 0));
    }

    public updateStatusValueBox(): void {
        const totalStatus = this._status.plus(this._equipStatus);
        this._energyValueElement.textContent = this._wwa.isVisibleStatus("energy") ? String(totalStatus.energy) : "";
        this._strengthValueElement.textContent = this._wwa.isVisibleStatus("strength") ? String(totalStatus.strength) : "";
        this._defenceValueElement.textContent = this._wwa.isVisibleStatus("defence") ? String(totalStatus.defence) : "";
        this._goldValueElement.textContent = this._wwa.isVisibleStatus("gold") ? String(totalStatus.gold) : "";
        // メッセージに表示されているステータスのアップデート
        this._wwa._messageWindow?.update();
        // スコア表示のアップデート
        this._wwa.updateScore();
    }

    readonly itemTransitioningClassName = "item-transitioning";
    readonly overwittenItemClassName = "item-overwritten";
    readonly overwittenItemSelector = `.${this.overwittenItemClassName}`;
    /**
     * アイテムエフェクト開始の setTimeout のタイマーを保持する配列
     * 添字はアイテムボックス位置 (0-11)
     */
    readonly itemEffectStartTimers: (number | undefined)[] = new Array(Consts.ITEMBOX_SIZE);
    /**
     * 全アイテムボックスのDOMの更新を行います。
     * アイテムボックスの内部状態の変更後に呼ぶことでアイテムボックスの見た目が更新されます。
     * 
     * ## animationOption
     * - insertPos: アニメーションが走るアイテムボックスを指定します。 1以上12以下です。
     * - itemScreenPixelCoord: アニメーションの起点になる画面座標(フィールド上のアイテム地点)です。
     * - itemBoxScreenPixelCoord: アニメーションの終点になる画面座標(アイテムボックス)です。
     * - itemBoxBackgroundImageCoord: アイテムボックスの背景画像の画像内座標(px単位)です。
     * - overwrittenObjectId: 上書きされる物体パーツのIDを指定すると、上書き演出になります。
     * 
     * @param animationOption オブジェクトがあるとアニメーションが走ります。
     */
    public updateItemBox(animationOption?: {
        insertPos: number/*1-12*/,
        itemScreenPixelCoord: Coord,
        itemBoxScreenPixelCoord: Coord,
        itemBoxBackgroundImageCoord: Coord,
        overwrittenObjectId?: number
    }): void {
        for (let i = 0; i < this._itemBoxElement.length; i++) {
            const targetItemBoxElement = this._itemBoxElement[i];
            const parentElement = util.$qs("#item" + i) as HTMLDivElement;

            // 該当位置がアイテムなしの場合
            if (this._itemBox[i] === 0) {
                targetItemBoxElement.style.backgroundPosition = "-40px 0px";
                this.disposeItemEffect(i, this._itemBoxElement[i], parentElement);
                continue;
            }
            const cx = this._wwa.getObjectCropXById(this._itemBox[i]);
            const cy = this._wwa.getObjectCropYById(this._itemBox[i]);

            // 該当位置がアニメーション対象アイテムでない場合
            if (!animationOption || i !== animationOption.insertPos - 1) {
                targetItemBoxElement.style.backgroundPosition = "-" + cx + "px -" + cy + "px";
                this.disposeItemEffect(i, this._itemBoxElement[i], parentElement);
                continue;
            }

            // 該当位置がアニメーション対象アイテムの場合
            const dx = animationOption.itemScreenPixelCoord.x - animationOption.itemBoxScreenPixelCoord.x;
            const dy = animationOption.itemScreenPixelCoord.y - animationOption.itemBoxScreenPixelCoord.y;
            const durationMs = (-dx) * Consts.DEFAULT_FRAME_INTERVAL / Consts.ITEM_EFFECT_SPEED_PIXEL_PER_FRAME;
            const useBlank = animationOption.overwrittenObjectId === 0 || animationOption.overwrittenObjectId === undefined;
            const overwrittenCx = useBlank ? animationOption.itemBoxBackgroundImageCoord.x : this._wwa.getObjectCropXById(animationOption.overwrittenObjectId);
            const overwrittenCy = useBlank ? animationOption.itemBoxBackgroundImageCoord.y : this._wwa.getObjectCropYById(animationOption.overwrittenObjectId);
            targetItemBoxElement.style.left = dx + "px";
            targetItemBoxElement.style.top = dy + "px";
            if (typeof this.itemEffectStartTimers[i] === "number") {
                clearInterval(this.itemEffectStartTimers[i]);
            }
            this.itemEffectStartTimers[i] = window.setTimeout(() => {
                this.itemEffectStartTimers[i] = undefined;
                this.startItemEffect(
                    i,
                    targetItemBoxElement,
                    parentElement,
                    {
                        target: { x: cx, y: cy },
                        overwritten: { x: overwrittenCx, y: overwrittenCy },
                    },
                    durationMs
                );
            }, Consts.DEFAULT_FRAME_INTERVAL);
        }
    }

    /**
     * アイテムエフェクトを開始します。
     * @param index アイテムボックス番号 0-11
     * @param targetItemBoxElement 動かすアイテムのdiv要素
     * @param parentElement 動かすアイテムの親のdiv要素
     * @param crops target: 動かすアイテムの画像上のxy座標, overwritten: 上書きされるアイテムの画像上のxy座標
     * @param durationMs エフェクトにかかる時間
     */
    private startItemEffect(
        index: number,
        targetItemBoxElement: HTMLDivElement,
        parentElement: HTMLDivElement,
        crops: {
            target: { x:number, y: number },
            overwritten: { x: number, y: number },
        },
        durationMs: number
    ) {
        const prevOverwrittenItemElement = parentElement.querySelector(this.overwittenItemSelector);
        if (prevOverwrittenItemElement) {
            parentElement.removeChild(prevOverwrittenItemElement)
        }
        const overwrittenItemElement = document.createElement("div");
        overwrittenItemElement.classList.add(this.overwittenItemClassName);
        overwrittenItemElement.style.backgroundPosition = "-" + crops.overwritten.x + "px -" + crops.overwritten.y + "px";
        overwrittenItemElement.style.backgroundImage = parentElement.style.backgroundImage;
        parentElement.appendChild(overwrittenItemElement);
        targetItemBoxElement.style.backgroundPosition = "-" + crops.target.x + "px -" + crops.target.y + "px";
        targetItemBoxElement.style.transitionDuration = durationMs + "ms";
        targetItemBoxElement.style.transitionProperty = "left,top";
        targetItemBoxElement.style.transitionTimingFunction = "linear";
        targetItemBoxElement.style.left = "0";
        targetItemBoxElement.style.top = "0";
        parentElement.classList.add(this.itemTransitioningClassName);
        targetItemBoxElement.addEventListener("transitionend", () => {
            this.disposeItemEffect(index, targetItemBoxElement, parentElement);
        }, { once: true });
    }
 
    /**
     * アイテムエフェクトを破棄します。アイテムエフェクトが動いていない時は何も起きません。
     * @param index アイテムボックス番号 0-11
     * @param itemBoxElement 破棄するエフェクトの対象のアイテムのdiv要素
     * @param parentElement 破棄するエフェクト対象アイテムの親のdiv要素
     */
    private disposeItemEffect(index: number, itemBoxElement: HTMLDivElement, parentElement: HTMLDivElement) {
        if (typeof this.itemEffectStartTimers[index] === "number") {
            clearInterval(this.itemEffectStartTimers[index]);
            this.itemEffectStartTimers[index] = undefined;
        }
        itemBoxElement.style.transitionDuration = "0s";
        itemBoxElement.style.transitionProperty = "";
        itemBoxElement.style.left = "0";
        itemBoxElement.style.top = "0";
        if (parentElement.classList.contains(this.itemTransitioningClassName)) {
            parentElement.classList.remove(this.itemTransitioningClassName);
        }
        const overwrittenItemElement = parentElement.querySelector(this.overwittenItemSelector);
        if (overwrittenItemElement) {
            parentElement.removeChild(overwrittenItemElement)
        }
    }

    public isDead(): boolean {
        return this._status.energy <= 0;
    }

    /**
     * プレイヤーに新たにアイテムを持たせます
     * 
     * ## 引数 itemPos が 0
     *  小さい順で一番小さい空きの場所に格納されます。
     * 
     * ## itemPos が 非0, isOverwriteが true
     *  指定位置が埋まっている場合に上書きされます。
     * 
     * ## itemPos が 非0, isOverwriteが false
     *  既に指定位置にあるパーツの格納位置設定が、追加するアイテムと同じなら上書きされます。
     *  違う場合は既に格納位置にあるパーツが、小さい順で一番小さい空きの場所に移動した上で、
     *  新たに追加しようとするパーツが itemPos 番目に格納されます。
     * 
     * @param objID 持たせる物体パーツの番号
     * @param itemPos アイテムボックス格納位置 
     * @param isOverwrite itemPosが0でない場合に使用される上書き設定。詳しくはdoc本文を参照
     * @param animationOption オブジェクトが与えられる場合は 画面座標 screenPixelCoord からアイテムボックスまでのアニメーションが発生します。また、itemBoxBackgroundImageCoord をアイテムボックス背景画像のゲーム使用画像内座標[px]として利用します。
     */
    public addItem(objID: number, itemPos: number = 0, isOverwrite: boolean = false, animationOption?: {
            screenPixelCoord: Coord,
            itemBoxBackgroundImageCoord: Coord
        }): void {
        var insertPos: number;
        var oldInsertPos: number;
        var oldObjID: number;
        var itemPos_partsData = this._wwa.getObjectAttributeById(objID, Consts.ATR_NUMBER);
        var overwrittenObjectId: number = 0;
        if (itemPos === 0 && itemPos_partsData !== 0) {
            itemPos = itemPos_partsData;
        }

        // 任意位置挿入
        if (itemPos === 0) {

            if (objID === 0) {
                return;
            }

            insertPos = this._getBlankItemPos();

            if (insertPos === Consts.ITEMBOX_IS_FULL) {
                /** ユーザ定義関数用処理 */
                this._wwa.setEvalCalcWwaNodeEarnedItem(objID, -1);
                this._wwa.callGetItemFullUserDefineFunction();
                this._wwa.clearEvalCalcWwaNodeEarnedItem();
                throw new Error("これ以上、アイテムを持てません。");
            }
            overwrittenObjectId = this._itemBox[insertPos - 1];
            this._forceSetItemBox(insertPos, objID);

            // 特定位置挿入 (上書きしない: 取得しているアイテムはずらす)
        } else if (isOverwrite === false) {
            insertPos = itemPos;
            oldObjID = this._itemBox[insertPos - 1];
            if (this._wwa.getObjectAttributeById(oldObjID, Consts.ATR_NUMBER) !==
                this._wwa.getObjectAttributeById(objID, Consts.ATR_NUMBER)) {
                oldInsertPos = this._getBlankItemPos();
                if (oldInsertPos !== Consts.ITEMBOX_IS_FULL) {
                    this._forceSetItemBox(oldInsertPos, oldObjID);
                    this._forceSetItemBox(insertPos, objID);
                } else {
                    /** ユーザ定義関数用処理 */
                    this._wwa.setEvalCalcWwaNodeEarnedItem(objID, -1);
                    this._wwa.callGetItemFullUserDefineFunction();
                    this._wwa.clearEvalCalcWwaNodeEarnedItem();
                    throw new Error("これ以上、アイテムを持てません。");
                }
            } else {
                overwrittenObjectId = this._itemBox[insertPos - 1];
                this._forceSetItemBox(insertPos, objID);
            }
            // 特定位置挿入（上書きする）
        } else {
            insertPos = itemPos;
            overwrittenObjectId = this._itemBox[insertPos - 1];
            this._forceSetItemBox(insertPos, objID);
        }
        this._updateEquipmentStatus();
        this.updateItemBox(animationOption ? {
            insertPos,
            itemScreenPixelCoord: animationOption.screenPixelCoord,
            itemBoxBackgroundImageCoord: animationOption.itemBoxBackgroundImageCoord,
            itemBoxScreenPixelCoord: new Coord(
                Consts.MAP_WINDOW_WIDTH + (insertPos - 1) % 3 * Consts.CHIP_SIZE,
                Consts.ITEMBOX_TOP_Y + Math.floor((insertPos - 1) / 3) * Consts.CHIP_SIZE),
            overwrittenObjectId
        } : undefined);
    }
    private _forceSetItemBox(pos1To12: number, id: number): void {
        var self = this;
        var border = util.$qsh("#item" + (pos1To12 - 1) + ">.item-click-border");
        var itemType = this._wwa.getObjectAttributeById(id, Consts.ATR_MODE);
        this.removeItemByItemPosition(pos1To12);
        this._itemBox[pos1To12 - 1] = id;
        // カスタムイベント関数処理
        this._wwa.setEvalCalcWwaNodeEarnedItem(id, pos1To12);
        this._wwa.callGetItemUserDefineFunction();
        this._wwa.clearEvalCalcWwaNodeEarnedItem();
        if (id !== 0 && itemType !== ItemMode.NORMAL) {
            const mes = this._wwa.resolveSystemMessage(SystemMessage.Key.ITEM_SELECT_TUTORIAL);
            if (!this._isClickableItemGot) {
                if (mes !== "BLANK") {
                    this._wwa.registerSystemMessagePage(mes);
                }
                this._isClickableItemGot = true;
            }
            border.style.display = "block";
            ((pos: number): void => {
                self._itemUsingEvent[pos - 1] = () => {
                    if (self.isControllable() || (self._wwa._messageWindow.isItemMenuChoice())) {
                        self._wwa._itemMenu.close();
                        self._wwa._setNextPage();
                        self._wwa.onselectitem(pos);
                    }
                };
            })(pos1To12);
            border.addEventListener("click", this._itemUsingEvent[pos1To12 - 1]);
        }
    }

    private _getBlankItemPos(): number {
        var insertPos: number;
        for (insertPos = 1; insertPos < this._itemBox.length + 1; insertPos++) {
            if (this._itemBox[insertPos - 1] === 0) {
                return insertPos;
            }
        }
        return Consts.ITEMBOX_IS_FULL;
    }


    private _updateEquipmentStatus(): void {
        var i;
        var newStatus = new EquipmentStatus(0, 0);
        for (i = 0; i < Consts.ITEMBOX_SIZE; i++) {
            if (this._itemBox[i] !== 0) {
                newStatus.strength += this._wwa.getObjectAttributeById(this._itemBox[i], Consts.ATR_STRENGTH);
                newStatus.defence += this._wwa.getObjectAttributeById(this._itemBox[i], Consts.ATR_DEFENCE);
            }
        }

        var diff = newStatus.minus(this._equipStatus);
        this._wwa.setStatusChangedEffect(diff);
        this._equipStatus = newStatus;
        this.updateStatusValueBox();
    }

    public hasItem(partsID: number): boolean {
        for (var i = 0; i < Consts.ITEMBOX_SIZE; i++) {
            if (this._itemBox[i] === partsID) {
                return true;
            }
        }
        return false;
    }

    public canUseItem(itemPos: number) {
        var partsID = this._itemBox[itemPos - 1];
        if (partsID === 0) {
            return false;
        }
        if (this._wwa.getObjectAttributeById(partsID, Consts.ATR_MODE) === ItemMode.NORMAL) {
            return false;
        }
        return true;
    }

    public useItem(): number {
        var itemID: number;
        var messageID: number;
        itemID = this._itemBox[this._readyToUseItemPos1To12 - 1];
        if (this._wwa.getObjectAttributeById(itemID, Consts.ATR_MODE) !== ItemMode.NOT_DISAPPEAR) {
            this.removeItemByItemPosition(this._readyToUseItemPos1To12);
        }
        var bg = <HTMLDivElement>(util.$id("item" + (this._readyToUseItemPos1To12 - 1)));

        setTimeout((): void => {
            if (bg.classList.contains("onpress")) {
                bg.classList.remove("onpress");
            }
        }, Consts.DEFAULT_FRAME_INTERVAL);

        /** アイテム関係の値を独自関数で使用できるようセットする */
        this._wwa.setEvalCalcWwaNodeEarnedItem(itemID, this._readyToUseItemPos1To12);
        /** アイテムを使用した際のユーザ定義独自関数を呼び出す */
        this._wwa.callUseItemUserDefineFunction();
        this._wwa.clearEvalCalcWwaNodeEarnedItem();
        this._isReadyToUseItem = false;
        this._readyToUseItemPos1To12 = void 0;

        return itemID;
    }

    public canHaveMoreItems(): boolean {
        return this._getBlankItemPos() !== Consts.ITEMBOX_IS_FULL;
    }

    public removeItemByItemPosition(itemPos: number): void {
        var border: HTMLElement;
        if (this._itemBox[itemPos - 1] === 0) {
            return;
        }
        if (this._wwa.getObjectAttributeById(this._itemBox[itemPos - 1], Consts.ATR_MODE) !== ItemMode.NORMAL) {
            border = util.$qsh("#item" + (itemPos - 1) + ">.item-click-border");
            border.removeEventListener("click", this._itemUsingEvent[itemPos - 1]);
            border.style.display = "none";
        }
        this._itemBox[itemPos - 1] = 0;
        this._updateEquipmentStatus();
        this.updateItemBox();
    }

    public removeItemByPartsID(partsID: number): void {
        var border: HTMLElement;
        if (!this.hasItem(partsID)) {
            throw new Error("アイテムを持っていない");
        }
        for (var i = 0; i < Consts.ITEMBOX_SIZE; i++) {
            if (this._itemBox[i] === partsID) {
                if (this._wwa.getObjectAttributeById(this._itemBox[i], Consts.ATR_MODE) !== ItemMode.NORMAL) {
                    border = util.$qsh("#item" + i + ">.item-click-border");
                    border.removeEventListener("click", this._itemUsingEvent[i]);
                    border.style.display = "none";
                }
                this._itemBox[i] = 0;
                this._updateEquipmentStatus();
                this.updateItemBox();
                return;
            }
        }

    }

    public clearItemBox(): void {
        for (var i = 1; i <= Consts.ITEMBOX_SIZE; i++) {
            this.removeItemByItemPosition(i);
        }
        this._updateEquipmentStatus();
        this.updateItemBox();
    }

    public hasGold(gold: number): boolean {
        return this._status.gold >= gold;
    }

    public payGold(gold: number): void {
        if (!this.hasGold(gold)) {
            throw new Error("お金が足りない");
        }
        this.setGold(this._status.gold - gold);
    }

    public earnGold(gold: number): void {
        this.setGold(this._status.gold + gold);
    }

    public setPartsAppearedFlag(): void {
        this._partsAppeared = true;
    }

    public clearPartsAppearedFlag(): void {
        this._partsAppeared = false;
    }

    public isPartsAppearedTime(): boolean {
        return this._partsAppeared === true;
    }

    public startBattleWith(enemy: Monster): void {
        this._isPlayerTurn = true;
        this._battleFrameCounter = Consts.BATTLE_INTERVAL_FRAME_NUM;
        this._battleTurnLength = 0;
        this._battleNoDamageTurnLength = 0;
        this._enemy = enemy;
        this._state = PlayerState.BATTLE;
    }

    public isFighting(): boolean {
        return this._state === PlayerState.BATTLE;
    }

    public isTurn(): boolean {
        return this._isPlayerTurn;
    }

    public getTurnNum(): number {
        return this._battleTurnLength;
    }

    public isBattleStartFrame(): boolean {
        return this._battleFrameCounter === Consts.BATTLE_INTERVAL_FRAME_NUM && this._battleTurnLength === 0;
    }

    public calcBattleResultForPlayerTurn(playerStatus: Status, enemyStatus: Status, estimating: boolean = false): BattleTurnResult {
        const userDefinedDamageResult = this._wwa.callUserDefinedBattleDamageFunction("playerToEnemy", (estimating || undefined) && {
            playerStatus,
            enemyStatus
        });
        if (userDefinedDamageResult) {
            return userDefinedDamageResult;
        }
        return { damage: this._calcDamageDefault(playerStatus, enemyStatus) };
    }

    public calcBattleResultForEnemyTurn(enemyStatus: Status, playerStatus: Status, estimating: boolean = false): BattleTurnResult {
        const userDefinedDamageResult = this._wwa.callUserDefinedBattleDamageFunction("enemyToPlayer", (estimating || undefined) && {
            playerStatus,
            enemyStatus
        });
        if (userDefinedDamageResult) {
            return userDefinedDamageResult;
        }
        return { damage: this._calcDamageDefault(enemyStatus, playerStatus) };
    }


    // アルテリオス計算式によるデフォルトダメージ計算。
    // 攻撃側攻撃力 - 防御側防御力 がダメージとなる。
    private _calcDamageDefault(offenceSideStatus: Status, defenceSideStatus: Status): number {
        const damage = offenceSideStatus.strength - defenceSideStatus.defence
        return damage > 0? damage: 0;
    }

    public fight(): void {
        if (!this.isFighting()) {
            throw new Error("バトルが開始されていません。");
        }
        if (this._battleTurnLength === 0 && this._battleFrameCounter === Consts.BATTLE_INTERVAL_FRAME_NUM) {
            this._wwa.showMonsterWindow();
        }
        if (--this._battleFrameCounter > 0) {
            return;
        }

        this._battleTurnLength++;
        if (this._wwa.isBattleSpeedIndexForQuickBattle(this._speedIndex) || this._battleTurnLength > Consts.BATTLE_SPEED_CHANGE_TURN_NUM) {
            if (this._battleTurnLength === 1) {
                this._wwa.playSound(SystemSound.ATTACK);
                this._wwa.vibration(false);
            }
            this._battleFrameCounter = 1;
        } else {
            this._battleFrameCounter = Consts.BATTLE_INTERVAL_FRAME_NUM;
            this._wwa.playSound(SystemSound.ATTACK);
            this._wwa.vibration(true);
        }

        var playerStatus = this.getStatus();
        var enemyStatus = this._enemy.status;
        let abortedByDamageCalculation = false;

        if (this._isPlayerTurn) {
            // デフォルトのダメージ計算式を使用している場合に限り、
            // プレイヤーが敵にダメージを与えられず、敵もプレイヤーにダメージを与えられない場合
            // プレイヤーが最初に攻撃する前にシステムメッセージ CANNOT_DAMAGE_MONSTER（相手の防御能力が高すぎる！）を表示して戦闘終了する。
            // カスタムダメージ計算式を利用した場合は、ダメージ量がターンによって変わる可能性があるため、事前にこのようなダメージ判定を実施するのは困難なためこの判定を実施しない。
            // まつゆき個人としては、デフォルトのダメージ計算式の場合についてもこの仕様はなくてもいいと感じているが、生命力が 0 でダメージが通らないモンスターに対して
            // 倒せる判定になるかどうかが過去のバージョンと異なってしまうため、無念ではあるがこの仕様を残す判断をした。
            if (
                this._battleTurnLength === 1 &&
                this._wwa.isUsingDefaultDamageCalcFunction() &&
                playerStatus.strength <= enemyStatus.defence &&
                playerStatus.defence >= enemyStatus.strength
            ) {
                this._enemy.battleEndProcess();
                this._wwa.registerSystemMessagePageByKey(SystemMessage.Key.CANNOT_DAMAGE_MONSTER);
                this._battleTurnLength = 0;
                this._enemy = null;
                this._state = PlayerState.CONTROLLABLE;
                return;
            }
            const { damage, aborted} = this.calcBattleResultForPlayerTurn(playerStatus, enemyStatus);
            // プレイヤーターン
            this._enemy.damage(damage);
            abortedByDamageCalculation = Boolean(aborted);
            // プレイヤー勝利
            if(this._enemy.status.energy <= 0) {
                this._wwa.playSound(this._wwa.getObjectAttributeById(this._enemy.partsID, Consts.ATR_SOUND));
                //                        this._wwa.appearParts(this._enemy.position, AppearanceTriggerType.OBJECT, this._enemy.partsID);
                this.earnGold(enemyStatus.gold);
                this._wwa.setStatusChangedEffect(new Status(0, 0, 0, enemyStatus.gold));
                if (this._enemy.item !== 0) {
                    this._wwa.setPartsOnPosition(PartsType.OBJECT, this._enemy.item, this._enemy.position);
                } else {
                    // 本当はif文でわける必要ないけど、可読性のため設置。
                    this._wwa.setPartsOnPosition(PartsType.OBJECT, 0, this._enemy.position);
                }
                // 注)ドロップアイテムがこれによって消えたり変わったりするのは原作からの仕様
                this._wwa.reserveAppearPartsInNextFrame(this._enemy.position, AppearanceTriggerType.OBJECT, this._enemy.partsID);
                this._state = PlayerState.CONTROLLABLE; // メッセージキューへのエンキュー前にやるのが大事!!(エンキューするとメッセージ待ちになる可能性がある）
                this._wwa.registerPageByMessage(this._enemy.message, {triggerParts: { id: this._enemy.partsID, type: PartsType.OBJECT, position: this._enemy.position } });
                this._enemy.battleEndProcess();
                this._battleTurnLength = 0;
                this._battleNoDamageTurnLength = 0;
                this._enemy = null;
            }
            // 前回のダメージログを記録
            if (this._enemy !== null) {
                if (damage === 0) {
                    this._battleNoDamageTurnLength++;
                } else {
                    this._battleNoDamageTurnLength = 0;
                }
            }
            this._isPlayerTurn = false;
        } else {
            // モンスターターン
            const {damage, aborted} = this.calcBattleResultForEnemyTurn(enemyStatus, playerStatus);
            this.damage(damage);
            abortedByDamageCalculation = Boolean(aborted);
            // プレイヤーがまだ生きてる
            // playerStatus.energy - defaultDamageValue < 0
            if (this._status.energy <= 0) {
                // モンスター勝利
                this.setEnergy(0);
                this._enemy.battleEndProcess();
                this._state = PlayerState.CONTROLLABLE;
                this._battleTurnLength = 0;
                this._battleNoDamageTurnLength = 0;
                this._enemy = null;
                if (this._wwa.shouldApplyGameOver({ isCalledByMacro: false })) {
                    this._wwa.gameover();
                }
            }
            // 前回のダメージログを記録
            if (damage === 0) {
                this._battleNoDamageTurnLength++;
            } else {
                this._battleNoDamageTurnLength = 0;
            }
            this._isPlayerTurn = true;
        }

        // 勝負がつかないと判定する処理 (規定ターンを超えた場合・強制終了)
        // 戦闘開始から規定ターン、プレイヤーも敵もノーダメージなら戦闘を強制終了する
        const aborted = (this._battleNoDamageTurnLength > Consts.FIGHT_DRAW_TURN) || abortedByDamageCalculation;
        if (aborted) {
            this._enemy.battleEndProcess();
            this._state = PlayerState.CONTROLLABLE;
            this._wwa.registerSystemMessagePageByKey(SystemMessage.Key.BATTLE_NOT_SETTLED);
            this._battleTurnLength = 0;
            this._battleNoDamageTurnLength = 0;
            this._enemy = null;
        }
    }

    public readyToUseItem(itemPos1To12: number): void {
        var itemID: number;
        var messageID: number;
        if (!this.canUseItem(itemPos1To12)) {
            throw new Error("アイテムがないか、アイテムが使えません。");
        }
        itemID = this._itemBox[itemPos1To12 - 1];
        messageID = this._wwa.getObjectAttributeById(itemID, Consts.ATR_STRING);
        this._wwa.reserveAppearPartsInNextFrame(this._position.getPartsCoord(), AppearanceTriggerType.OBJECT, itemID);
        this._readyToUseItemPos1To12 = itemPos1To12;
        this._isReadyToUseItem = true;
    }

    public isReadyToUseItem(): boolean {
        return this._isReadyToUseItem;
    }

    public getDrawingCenterPosition(): Coord {
        var pos = this._position.getPartsCoord();
        var poso = this._position.getOffsetCoord();
        var cameraPos = this._camera.getPosition();
        var cpParts = cameraPos.getPartsCoord();
        var cpOffset = cameraPos.getOffsetCoord();
        var targetX = (pos.x - cpParts.x) * Consts.CHIP_SIZE + poso.x - cpOffset.x + Consts.CHIP_SIZE / 2;
        var targetY = (pos.y - cpParts.y) * Consts.CHIP_SIZE + poso.y - cpOffset.y + Consts.CHIP_SIZE / 2;

        return new Coord(targetX, targetY);
    }


    //プレイ時間を計測
    public mainFrameCount(): void {
        this._frameCount++;
    }

    public getFrameCount(): number {
        return this._frameCount;
    }

    public setFrameCount(count: number): number {
        if (typeof count !== "number") {
            count = 0;
        }
        return this._frameCount = count;
    }

    public getMoveCount(): number {
        return this._moves;
    }

    public setMoveCount(count: number): number {
        return this._moves = count;
    }

    public isMoveObjectAutoExecTime(): boolean {
        return this._moveObjectAutoExecTimer === 0;
    }

    public setMoveMacroWaiting(moveNum: number): void {
        if (moveNum < 0) {
            return;
        }
        this._moveMacroWaitingRemainMoves = moveNum;
        this._moveObjectAutoExecTimer = 0;
    }

    public resetMoveObjectAutoExecTimer(): void {
        this._moveObjectAutoExecTimer = Consts.CHIP_SIZE / speedList[this._speedIndex];
        this._moveMacroWaitingRemainMoves--;
    }

    public decrementMoveObjectAutoExecTimer(): number {
        if (this._moveMacroWaitingRemainMoves >= 0 && this._moveObjectAutoExecTimer > 0) {
            this._moveObjectAutoExecTimer--;
            if (this._moveMacroWaitingRemainMoves === 0 && this._moveObjectAutoExecTimer === 0) {
                this._afterMoveMacroFlag = true;
            }
        }
        return 0;
    }

    public isWaitingMoveMacro(): boolean {
        return this._moveMacroWaitingRemainMoves !== 0 || this._moveObjectAutoExecTimer !== 0;
    }

    public decrementLookingAroundTimer(): number {
        if (this._isPreparedForLookingAround && this._lookingAroundTimer > 0) {
            return --this._lookingAroundTimer;
        }
        return 0;
    }

    public isLookingAround(): boolean {
        return this._isPreparedForLookingAround && this._lookingAroundTimer === 0;
    }

    public getSpeedIndex(): number {
        return this._speedIndex;
    }

    public speedUp(): number {
        return this._speedIndex = Math.min(Consts.MAX_SPEED_INDEX, this._speedIndex + 1);
    }

    public speedDown(): number {
        return this._speedIndex = Math.max(Consts.MIN_SPEED_INDEX, this._speedIndex - 1);
    }

    public setSpeedIndex(speedIndex: number): number {
        if (speedIndex < Consts.MIN_SPEED_INDEX || Consts.MAX_SPEED_INDEX < speedIndex) {
            throw new Error("#set_speed の引数が異常です:" + speedIndex);
        }
        this._speedIndex = speedIndex;
        return this._speedIndex;
    }

    constructor(wwa: WWA, pos: Position, camera: Camera, status: Status, em: number, moves: number, gameSpeedIndex: number) {
        super(pos);
        // どっかで定数化させたい
        this._status = status;
        this._equipStatus = new EquipmentStatus(0, 0);
        this._itemBox = new Array(Consts.ITEMBOX_SIZE);
        this._itemBoxElement = new Array(Consts.ITEMBOX_SIZE);
        this._itemUsingEvent = new Array(Consts.ITEMBOX_SIZE);

        for (var i = 0; i < this._itemBox.length; i++) {
            this._itemBox[i] = 0;
            this._itemBoxElement[i] = util.$qsh("#item" + i + ">.item-disp") as HTMLDivElement;
        }
        this.updateItemBox();
        this._energyMax = em;
        this._dir = Direction.DOWN;
        this._isMovingImage = false;
        this._wwa = wwa;
        this._state = PlayerState.CONTROLLABLE;
        this._camera = camera;
        this._isPartsEventExecuted = false;
        this._energyValueElement = util.$qsh("#disp-energy>.status-value-box");
        this._strengthValueElement = util.$qsh("#disp-strength>.status-value-box");
        this._defenceValueElement = util.$qsh("#disp-defence>.status-value-box");
        this._goldValueElement = util.$qsh("#disp-gold>.status-value-box");
        this._isReadyToUseItem = false;
        this._isClickableItemGot = false;
        this._moves = moves;
        this._moveMacroWaitingRemainMoves = 0;
        this._moveObjectAutoExecTimer = 0;
        this.updateStatusValueBox();
        this._partsAppeared = false;
        this._afterMoveMacroFlag = false;
        this._isPreparedForLookingAround = true;
        this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
        this._speedIndex = gameSpeedIndex;
        this._messageDelayFrameCount = 0;
        this._battleNoDamageTurnLength = 0;
    }

}

