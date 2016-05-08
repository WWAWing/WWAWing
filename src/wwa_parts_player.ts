/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_camera.ts" />
/// <reference path="./wwa_main.ts" />

module wwa_parts_player {
    import Position = wwa_data.Position;
    import Direction = wwa_data.Direction;
    import Consts = wwa_data.WWAConsts;
    import Camera = wwa_camera.Camera;

    class Parts {
        protected _position: Position;
        protected _wwa: wwa_main.WWA;
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

    enum PlayerState {
        CONTROLLABLE,
        MOVING,
        CAMERA_MOVING,
        MESSAGE_WAITING,
        LOCALGATE_JUMPED,
        BATTLE,
        ESTIMATE_WINDOW_WAITING,
        PASSWORD_WINDOW_WAITING
    }

    export class Player extends PartsObject {
        protected _status: wwa_data.Status;
        protected _equipStatus: wwa_data.EquipmentStatus;
        protected _energyMax: number;
        protected _dir: Direction;
        protected _jumpWaitFramesRemain: number;
        protected _camera: Camera;
        protected _state: PlayerState;
        protected _isPartsEventExecuted: boolean;
        protected _samePosLastExecutedMapID: number;
        protected _samePosLastExecutedObjID: number;
        protected _executedObjPartsID_onSamePosition: number;

        protected _partsAppeared: boolean;

        protected _energyValueElement: HTMLElement;
        protected _strengthValueElement: HTMLElement;
        protected _defenceValueElement: HTMLElement;
        protected _goldValueElement: HTMLElement;

        protected _itemBox: number[];
        protected _itemBoxElement: HTMLElement[];
        protected _itemUsingEvent: EventListener[];
        protected _readyToUseItemPos: number;
        protected _isReadyToUseItem: boolean;

        protected _battleFrameCounter: number;
        protected _isPlayerTurn: boolean;
        protected _battleTurnNum: number;

        protected _enemy: wwa_monster.Monster;
        protected _moves: number;

        protected _moveMacroWaitingRemainMoves: number;
        protected _moveObjectAutoExecTimer: number;

        protected _afterMoveMacroFlag: boolean;

        protected _isClickableItemGot: boolean;

        protected _isPreparedForLookingAround: boolean;
        protected _lookingAroundTimer: number;

        protected _speedIndex: number;

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
                }
            } else if (this._state === PlayerState.MOVING) {
                try {
                    var next = this._position.getNextFramePosition(
                        this._dir, wwa_data.speedList[this._speedIndex], wwa_data.speedList[this._speedIndex]);
                } catch (e) {
                    // この時点で範囲外になることはないとは思うが...
                }
                if (next.isJustPosition()) {
                    this._state = PlayerState.CONTROLLABLE;
                    this._moves++;
                    this._isPartsEventExecuted = false;
                    this._samePosLastExecutedMapID = void 0;
                    this._samePosLastExecutedObjID = void 0;
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
                        this._dir, wwa_data.speedList[this._speedIndex], wwa_data.speedList[this._speedIndex]);
                    nextJustPos = this._position.getNextJustPosition(moveDir);
                } catch (e) {
                    // 範囲外座標
                    return;
                }

                if (this._isOnCameraMovingPosition()) {
                    ////////////////////// 本番ではデバッグ消すこと！！！//////////////////////
                    if ( this._wwa.getMapIdByPosition(nextJustPos) !== 0 || this._wwa.isOldMap() || this._wwa.debug) {
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
                    this._wwa.moveObjects( true );
                }

            }
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

        public getEnergyMax(): number {
            return this._energyMax;
        }

        public isJumped(): boolean {
            return this._state === PlayerState.LOCALGATE_JUMPED;
        }

        public setMessageWaiting(): void {
            this._state = PlayerState.MESSAGE_WAITING;
        }

        public isWaitingMessage(): boolean {
            return this._state === PlayerState.MESSAGE_WAITING;
        }


        public clearMessageWaiting(): void {
            if (this._state === PlayerState.MESSAGE_WAITING) {
                this._state = PlayerState.CONTROLLABLE;
                this._isPartsEventExecuted = true;
                if (this._isPreparedForLookingAround) {
                    this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
                }
            }
        }

        public setEstimateWindowWating(): void {
            this._state = PlayerState.ESTIMATE_WINDOW_WAITING;
        }

        public isWatingEstimateWindow(): boolean {
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

        public getLastExecPartsIDOnSamePosition(type: wwa_data.PartsType): number {
            return type === wwa_data.PartsType.MAP ? this._samePosLastExecutedMapID : this._samePosLastExecutedObjID
        }

        public setLastExecInfoOnSamePosition(type: wwa_data.PartsType, id: number) {
            if (type === wwa_data.PartsType.MAP) {
                this._samePosLastExecutedMapID = id;
            } else {
                this._samePosLastExecutedObjID = id;
            }
        }

        public processAfterJump(): void {
            if (this._state !== PlayerState.LOCALGATE_JUMPED) {
                return;
            }
            if (--this._jumpWaitFramesRemain === 0) {
                this._state = PlayerState.CONTROLLABLE;
            }
        }

        public jumpTo(pos: Position):boolean {
            var prevCameraPos = this._camera.getPosition();
            var prevPos = this.getPosition();

            if (this._position.equals(pos)) {
                return false;
            }

            this._position = pos;
            if (!pos.isInCameraRange(this._camera, true)) {
                this._camera.reset(pos);
            }

            this._state = PlayerState.LOCALGATE_JUMPED;
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
            } else if (pos.getPartsCoord().x <= this._wwa.getMapWidth() - 2   && pos.getNextJustPosition(Direction.RIGHT).hasLocalGate()) {
                this._dir = Direction.LEFT;
            } else if ( pos.getPartsCoord().x >= 1 && pos.getNextJustPosition(Direction.LEFT).hasLocalGate()) {
                this._dir = Direction.RIGHT;
            } else {
                this._dir = Direction.DOWN;
            }

            if (!this._camera.getPosition().equals(prevCameraPos)) {
                this._isPreparedForLookingAround = true;
                this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
            }

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

        public addStatusAll(s: wwa_data.Status): wwa_data.Status {
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

        public getStatus(): wwa_data.Status {
            return this._status.plus(this._equipStatus);
        }

        public getStatusWithoutEquipments(): wwa_data.Status {
            // クローンハック
            return this._status.plus(new wwa_data.EquipmentStatus(0, 0));
        }

        public updateStatusValueBox(): void {
            var totalStatus = this._status.plus(this._equipStatus);
            var e = totalStatus.energy;
            var s = totalStatus.strength;
            var d = totalStatus.defence;
            var g = totalStatus.gold;
            this._energyValueElement.textContent = e + "";
            this._strengthValueElement.textContent = s + "";
            this._defenceValueElement.textContent = d + "";
            this._goldValueElement.textContent = g + "";
        }

        public updateItemBox(): void {
            var cx: number, cy: number;
            for (var i = 0; i < this._itemBoxElement.length; i++) {
                if (this._itemBox[i] === 0) {
                    this._itemBoxElement[i].style.backgroundPosition = "-40px 0px";
                } else {
                    cx = this._wwa.getObjectCropXById(this._itemBox[i]);
                    cy = this._wwa.getObjectCropYById(this._itemBox[i]);
                    this._itemBoxElement[i].style.backgroundPosition = "-" + cx + "px -" + cy + "px";
                }
            }

        }

        public isDead(): boolean {
            return this._status.energy <= 0;
        }

        public addItem(objID: number, itemPos: number= 0, isOverwrite: boolean = false): void {
            var insertPos: number;
            var oldInsertPos: number;
            var oldObjID: number;
            var itemType: number;
            var border: HTMLElement;
            var itemPos_partsData = this._wwa.getObjectAttributeById(objID, Consts.ATR_NUMBER);
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
                    throw new Error("これ以上、アイテムを持てません。");
                }

                //                this._itemBox[insertPos - 1] = objID;
                this._forceSetItemBox(insertPos, objID);

                // 特定位置挿入 (上書きしない: 取得しているアイテムはずらす)
            } else if (isOverwrite === false) {
                insertPos = itemPos;
                oldObjID = this._itemBox[insertPos - 1];
                if (this._wwa.getObjectAttributeById(oldObjID, Consts.ATR_NUMBER) !==
                    this._wwa.getObjectAttributeById(objID, Consts.ATR_NUMBER)) {
                    oldInsertPos = this._getBlankItemPos();
                    if (oldInsertPos !== Consts.ITEMBOX_IS_FULL) {
                        //                        this._itemBox[oldInsertPos - 1] = oldObjID;
                        this._forceSetItemBox(oldInsertPos, oldObjID);
                        this._forceSetItemBox(insertPos, objID);
                    } else {
                        throw new Error("これ以上、アイテムを持てません。");
                    }
                } else {
                    this._forceSetItemBox(insertPos, objID);
                }
                // 特定位置挿入（上書きする）
            } else {
                insertPos = itemPos;
                //                this._itemBox[itemPos - 1] = objID;
                this._forceSetItemBox(insertPos, objID);
            }
/*
            itemType = this._wwa.getObjectAttributeById(objID, Consts.ATR_MODE);
            if (objID !== 0 && itemType !== wwa_data.ItemMode.NORMAL) {
                var mes = this._wwa.getSystemMessageById(wwa_data.SystemMessage2.CLICKABLE_ITEM);
                if (!this._isClickableItemGot) {
                    if (mes !== "BLANK") {
                        this._wwa.setMessageQueue(mes === "" ?
                            "このアイテムは右のボックスをクリックすることで使用できます。\n" +
                            "使用できるアイテムは色枠で囲まれます。" : mes, false, true
                            );
                    }
                    this._isClickableItemGot = true;
                }
                border = wwa_util.$qsh("#item" + (insertPos - 1) + ">.item-click-border")
                border.style.display = "block";
                this._itemUsingEvent[insertPos - 1] = () => {
                    if (this.isControllable()) {
                        this._wwa.onselectitem(insertPos);
                    }
                };
                border.addEventListener("click", this._itemUsingEvent[insertPos - 1]);
            } 
*/
            this._updateEquipmentStatus();
            this.updateItemBox();
        }

        private _forceSetItemBox(pos: number, id: number): void {
            var self = this;
            var border = wwa_util.$qsh("#item" + (pos - 1) + ">.item-click-border");
            var itemType = this._wwa.getObjectAttributeById(id, Consts.ATR_MODE);
            this.removeItemByItemPosition(pos);
            this._itemBox[pos - 1] = id;
            if (id !== 0 && itemType !== wwa_data.ItemMode.NORMAL) {
                var mes = this._wwa.getSystemMessageById(wwa_data.SystemMessage2.CLICKABLE_ITEM);
                if (!this._isClickableItemGot) {
                    if (mes !== "BLANK") {
                        this._wwa.setMessageQueue(mes === "" ?
                            "このアイテムは右のボックスをクリックすることで使用できます。\n" +
                            "使用できるアイテムは色枠で囲まれます。" : mes, false, true
                            );
                    }
                    this._isClickableItemGot = true;
                }
                border.style.display = "block";
                ((pos: number): void => {
                    self._itemUsingEvent[pos - 1] = () => {
                        if (self.isControllable()) {
                            self._wwa.onselectitem(pos);
                        }
                    };
                })( pos );
                border.addEventListener("click", this._itemUsingEvent[pos - 1]);
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
            var newStatus = new wwa_data.EquipmentStatus(0, 0);
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
            if (this._wwa.getObjectAttributeById(partsID, Consts.ATR_MODE) === wwa_data.ItemMode.NORMAL) {
                return false;
            }
            return true;
        }

        public useItem(): number {
            var itemID: number;
            var messageID: number;
            itemID = this._itemBox[this._readyToUseItemPos - 1];
            if (this._wwa.getObjectAttributeById(itemID, Consts.ATR_MODE) !== wwa_data.ItemMode.NOT_DISAPPEAR) {
                this.removeItemByItemPosition(this._readyToUseItemPos);
            }
            var bg = <HTMLDivElement> (wwa_util.$id("item" + (this._readyToUseItemPos - 1)));
                                
            setTimeout((): void=> {
                if (bg.classList.contains("onpress")) {
                    bg.classList.remove("onpress");
                }
            }, Consts.DEFAULT_FRAME_INTERVAL );
                    
            this._isReadyToUseItem = false;
            this._readyToUseItemPos = void 0;

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
            if (this._wwa.getObjectAttributeById(this._itemBox[itemPos - 1], Consts.ATR_MODE) !== wwa_data.ItemMode.NORMAL) {
                border = wwa_util.$qsh("#item" + (itemPos - 1) + ">.item-click-border");
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
                    if (this._wwa.getObjectAttributeById(this._itemBox[i], Consts.ATR_MODE) !== wwa_data.ItemMode.NORMAL) {
                        border = wwa_util.$qsh("#item" + i + ">.item-click-border");
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

        public startBattleWith(enemy: wwa_monster.Monster): void {
            this._isPlayerTurn = true;
            this._battleFrameCounter = Consts.BATTLE_INTERVAL_FRAME_NUM;
            this._battleTurnNum = 0;
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
            return this._battleTurnNum;
        }

        public isBattleStartFrame(): boolean {
            return this._battleFrameCounter === Consts.BATTLE_INTERVAL_FRAME_NUM && this._battleTurnNum === 0;
        }

        public fight(): void {
            if (!this.isFighting()) {
                throw new Error("バトルが開始されていません。");
            }
            if (this._battleTurnNum === 0 && this._battleFrameCounter === Consts.BATTLE_INTERVAL_FRAME_NUM) {
                this._wwa.showMonsterWindow();
            }
            if (--this._battleFrameCounter > 0) {
                return;
            }

            this._battleTurnNum++;
            if (this._speedIndex === Consts.MAX_SPEED_INDEX || this._battleTurnNum > Consts.BATTLE_SPEED_CHANGE_TURN_NUM) {
                if (this._battleTurnNum === 1) {
                    this._wwa.playSound(wwa_data.SystemSound.ATTACK);
                }
                this._battleFrameCounter = 1;
            } else {
                this._battleFrameCounter = Consts.BATTLE_INTERVAL_FRAME_NUM;
                this._wwa.playSound(wwa_data.SystemSound.ATTACK);
            }

            var playerStatus = this.getStatus();
            var enemyStatus = this._enemy.status;
            

            if (this._isPlayerTurn) {
                // プレイヤーターン
                if (playerStatus.strength > enemyStatus.defence ||
                    playerStatus.defence < enemyStatus.strength) {

                    // モンスターがこのターンで死なない場合
                    if (enemyStatus.energy > playerStatus.strength - enemyStatus.defence) {
                        if (playerStatus.strength > enemyStatus.defence) {
                            this._enemy.damage(playerStatus.strength - enemyStatus.defence);
                        }

                        // プレイヤー勝利
                    } else {
                        this._wwa.playSound(this._wwa.getObjectAttributeById(this._enemy.partsID, Consts.ATR_SOUND));
                        //                        this._wwa.appearParts(this._enemy.position, wwa_data.AppearanceTriggerType.OBJECT, this._enemy.partsID);
                        this.earnGold(enemyStatus.gold);
                        this._wwa.setStatusChangedEffect(new wwa_data.Status(0, 0, 0, enemyStatus.gold));
                        if (this._enemy.item !== 0) {
                            this._wwa.setPartsOnPosition(wwa_data.PartsType.OBJECT, this._enemy.item, this._enemy.position);
                        } else {
                            // 本当はif文でわける必要ないけど、可読性のため設置。
                            this._wwa.setPartsOnPosition(wwa_data.PartsType.OBJECT, 0, this._enemy.position);
                        }
                        // 注)ドロップアイテムがこれによって消えたり変わったりするのは原作からの仕様
                        this._wwa.appearParts(this._enemy.position, wwa_data.AppearanceTriggerType.OBJECT, this._enemy.partsID);
                        this._state = PlayerState.CONTROLLABLE; // メッセージキューへのエンキュー前にやるのが大事!!(エンキューするとメッセージ待ちになる可能性がある）
                        this._wwa.setMessageQueue(this._enemy.message, false, false);
                        this._enemy.battleEndProcess();
                        this._battleTurnNum = 0;
                        this._enemy = null;
                    }
                    this._isPlayerTurn = false;
                    return;
                }
                this._enemy.battleEndProcess();
                this._wwa.setMessageQueue("相手の防御能力が高すぎる！", false, true);
                this._battleTurnNum = 0;
                this._enemy = null;
            } else {
                // モンスターターン
                if (enemyStatus.strength > playerStatus.defence) {
                    // プレイヤーがまだ生きてる
                    if (playerStatus.energy > enemyStatus.strength - playerStatus.defence) {
                        this.damage(enemyStatus.strength - playerStatus.defence);
                        // モンスター勝利
                    } else {
                        this.setEnergy(0);
                        this._enemy.battleEndProcess();
                        this._state = PlayerState.CONTROLLABLE;
                        this._battleTurnNum = 0;
                        this._enemy = null;
                        this._wwa.gameover();
                    }
                }

            }
            this._isPlayerTurn = true;

        }

        public readyToUseItem(itemPos: number): void {
            var itemID: number;
            var messageID: number;
            if (!this.canUseItem(itemPos)) {
                throw new Error("アイテムがないか、アイテムが使えません。");
            }
            itemID = this._itemBox[itemPos - 1];
            messageID = this._wwa.getObjectAttributeById(itemID, Consts.ATR_STRING);
//            this._wwa.setMessageQueue(this._wwa.getMessageById(messageID), false, itemID, wwa_data.PartsType.OBJECT, this._position.getPartsCoord());
            this._wwa.appearParts(this._position.getPartsCoord(), wwa_data.AppearanceTriggerType.OBJECT, itemID);
            this._readyToUseItemPos = itemPos;
            this._isReadyToUseItem = true;
        }

        public isReadyToUseItem(): boolean {
            return this._isReadyToUseItem;
        }

        public getDrawingCenterPosition(): wwa_data.Coord {
            var pos = this._position.getPartsCoord();
            var poso = this._position.getOffsetCoord();
            var cameraPos = this._camera.getPosition();
            var cpParts = cameraPos.getPartsCoord();
            var cpOffset = cameraPos.getOffsetCoord();
            var targetX = (pos.x - cpParts.x) * Consts.CHIP_SIZE + poso.x - cpOffset.x + Consts.CHIP_SIZE / 2;
            var targetY = (pos.y - cpParts.y) * Consts.CHIP_SIZE + poso.y - cpOffset.y + Consts.CHIP_SIZE / 2;

            return new wwa_data.Coord(targetX, targetY);
        }

        public getMoveCount(): number {
            return this._moves;
        }

        public setMoveCount( count: number): number{
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
            this._moveObjectAutoExecTimer = Consts.CHIP_SIZE / wwa_data.speedList[this._speedIndex];
            this._moveMacroWaitingRemainMoves--;
        }

        public decrementMoveObjectAutoExecTimer(): number {
            if ( this._moveMacroWaitingRemainMoves >= 0 && this._moveObjectAutoExecTimer > 0) {
                this._moveObjectAutoExecTimer--;
                if (this._moveMacroWaitingRemainMoves === 0 && this._moveObjectAutoExecTimer === 0) {
                    this._afterMoveMacroFlag = true;
                }
            }
            return 0;
        }

        public isWaitingMoveMacro(): boolean {
            return this._moveMacroWaitingRemainMoves !== 0 || this._moveObjectAutoExecTimer !== 0 ;
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

        constructor(wwa: wwa_main.WWA, pos: Position, camera: Camera, status: wwa_data.Status, em: number) {
            super(pos);
            this._status = status;
            this._equipStatus = new wwa_data.EquipmentStatus(0, 0);
            this._itemBox = new Array(Consts.ITEMBOX_SIZE);
            this._itemBoxElement = new Array(Consts.ITEMBOX_SIZE);
            this._itemUsingEvent = new Array(Consts.ITEMBOX_SIZE);

            for (var i = 0; i < this._itemBox.length; i++) {
                this._itemBox[i] = 0;
                this._itemBoxElement[i] = wwa_util.$qsh("#item" + i + ">.item-disp");
            }
            this.updateItemBox();
            this._energyMax = em;
            this._dir = Direction.DOWN;
            this._wwa = wwa;
            this._state = PlayerState.CONTROLLABLE;
            this._camera = camera;
            this._isPartsEventExecuted = false;
            this._energyValueElement = wwa_util.$qsh("#disp-energy>.status-value-box");
            this._strengthValueElement = wwa_util.$qsh("#disp-strength>.status-value-box");
            this._defenceValueElement = wwa_util.$qsh("#disp-defence>.status-value-box");
            this._goldValueElement = wwa_util.$qsh("#disp-gold>.status-value-box");
            this._isReadyToUseItem = false;
            this._isClickableItemGot = false;
            this._moves = 0;
            this._moveMacroWaitingRemainMoves = 0;
            this._moveObjectAutoExecTimer = 0;
            this.updateStatusValueBox();
            this._partsAppeared = false;
            this._afterMoveMacroFlag = false;
            this._isPreparedForLookingAround = true;
            this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
            this._speedIndex = Consts.DEFAULT_SPEED_INDEX;
        }

    }


}