import { WWA } from "./wwa_main";
import {
    WWAData,
    WWAConsts,
    WWASaveConsts,
    Coord,
    YesNoState,
    Position,
    DEVICE_TYPE,
    Direction,
} from "./wwa_data";
import { Monster } from "./wwa_monster";
import { WWASave, WWASaveData } from "./wwa_save";


export class TextWindow {
    protected _element: HTMLElement;

    constructor(
        protected _wwa: WWA,
        protected _coord: Coord,
        protected _width: number,
        protected _height: number,
        protected _isVisible: boolean,
        protected _parentElement: HTMLElement,
        zIndex: number
    ) {
        this._element = document.createElement("div");
        this._element.style.position = "absolute";
        this._element.style.borderWidth = "2px";
        this._element.style.borderStyle = "solid";
        if (_wwa.isClassicMode()) {
            this._element.style.borderRadius = "15px";
        } else {
            this._element.style.borderRadius = "10px";
        }
        this._element.classList.add("wwa-message-window");
        this._element.style.zIndex = zIndex + "";
        //            this._element.style.opacity = "0.9";
        this._element.style.left = this._coord.x + "px";
        this._element.style.top = this._coord.y + "px";
        this._element.style.width = this._width + "px";
        this._element.style.height = this._height + "px";
        this._parentElement.appendChild(this._element);
    }

    public update(a?: any): void {
        /* サブクラスで実装してください。*/
    }

    public show(): void {
        this._isVisible = true;
        this._element.style.display = "block";
        this.update();
        this._wwa.wwaCustomEvent('wwa_window_show', {
            name: this.windowName,
            element: this._element,
            text: this._element.textContent
        });
    }
    public hide(): void {
        this._isVisible = false;
        this._element.style.display = "none";
        this.update();
        this._wwa.wwaCustomEvent('wwa_window_hide', { name: this.windowName });
    }
    public isVisible(): boolean {
        return this._isVisible;
    }

    protected get windowName(): string {
        return "TextWindow";
    }
}

export class MonsterWindow extends TextWindow {
    protected _monsterBox: HTMLDivElement;
    protected _energyBox: HTMLDivElement;
    protected _strengthBox: HTMLDivElement;
    protected _defenceBox: HTMLDivElement;

    constructor(
        wwa: WWA,
        coord: Coord,
        width: number,
        height: number,
        isVisible: boolean,
        parentElement: HTMLElement,
        protected _cgFileName: string
    ) {
        super(wwa, new Coord(coord.x, coord.y), width, height, isVisible, parentElement, 201);

        this._monsterBox = document.createElement("div");
        this._monsterBox.style.width = WWAConsts.CHIP_SIZE + "px";
        this._monsterBox.style.height = WWAConsts.CHIP_SIZE + "px";
        this._monsterBox.style.position = "absolute";
        this._monsterBox.style.left = "10px";
        this._monsterBox.style.top = "10px";
        this._monsterBox.style.backgroundImage = "url(" + this._cgFileName.replace("(", "\\(").replace(")", "\\)") + ")";
        this._monsterBox.style.backgroundPosition = "0 0";
        this._element.appendChild(this._monsterBox);

        this._energyBox = document.createElement("div");
        this._energyBox.style.position = "absolute";
        this._energyBox.style.left = "80px";
        this._energyBox.style.top = "10px";
        this._energyBox.textContent = "生命力 0";
        this._element.appendChild(this._energyBox);

        this._strengthBox = document.createElement("div");
        this._strengthBox.style.position = "absolute";
        this._strengthBox.style.left = "80px";
        this._strengthBox.style.top = "30px";
        this._strengthBox.textContent = "攻撃力 0";
        this._element.appendChild(this._strengthBox);

        this._defenceBox = document.createElement("div");
        this._defenceBox.style.position = "absolute";
        this._defenceBox.style.left = "180px";
        this._defenceBox.style.top = "30px";
        this._defenceBox.textContent = "防御力 0";
        this._element.appendChild(this._defenceBox);

        if (this._isVisible) {
            this._element.style.display = "block";
        } else {
            this._element.style.display = "none";
        }

    }

    public update(monster?: Monster) {
        if (monster !== void 0) {
            this._monsterBox.style.backgroundPosition =
                "-" + monster.imgCoord.x + "px -" + monster.imgCoord.y + "px";
            this._energyBox.textContent = "生命力 " + monster.status.energy;
            this._strengthBox.textContent = "攻撃力 " + monster.status.strength;
            this._defenceBox.textContent = "防御力 " + monster.status.defence;
        }

    }

    protected get windowName(): string {
        return "MonsterWindow";
    }
}

export class ScoreWindow extends TextWindow {
    protected static WINDOW_NAME: string = "ScoreWindow";
    constructor(
        wwa: WWA,
        coord: Coord,
        isVisible: boolean,
        parentElement: HTMLElement
    ) {
        if (wwa.isClassicMode()) {
            super(wwa, new Coord(WWAConsts.CHIP_SIZE * 2, 30), WWAConsts.CHIP_SIZE * 7, 40, isVisible, parentElement, 202);
            this._element.style.borderWidth = "0";
            this._element.style.borderRadius = "4px";
            this._element.style.fontSize = "20px";
            this._element.style.lineHeight = "40px";
        } else {
            super(wwa, new Coord(coord.x, coord.y), 340, 30, isVisible, parentElement, 202);
        }
        this._element.style.textAlign = "center";
        if (this._isVisible) {
            this._element.style.display = "block";
        } else {
            this._element.style.display = "none";
        }
        this.update(0);
    }


    public update(score?: number) {
        if (score !== void 0) {
            this._element.textContent = "Score: " + score;
        }
    }

    protected get windowName(): string {
        return "ScoreWindow";
    }
}

export enum Positioning {
    TOP,
    CENTER,
    BOTTOM,
    SCORE
}

export class MessageWindow /* implements TextWindow(予定)*/ {
    private _wwa: WWA;

    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    private _message: string;

    private _cgFileName: string;
    private _isVisible: boolean;
    private _isYesno: boolean;
    private _isSave: boolean;
    private _isItemMenu: boolean;
    private _isInputDisable: boolean;

    private _element: HTMLElement;
    private _msgWrapperElement: HTMLElement;

    private _dummyElement: HTMLElement;
    private _saveElement: HTMLElement;
    private _ynWrapperElement: HTMLElement;

    private _divYesElement: HTMLElement;
    private _divNoElement: HTMLElement;
    private _parentElement: HTMLElement;
    private _wwaSave: WWASave = void 0;
    private _save_select_id: number = 0;
    private _save_counter: number = 0;
    private _save_close: boolean = false;

    constructor(
        wwa: WWA,
        x: number,
        y: number,
        width: number,
        height: number,
        cgFileName: string,
        isVisible: boolean,
        isYesno: boolean,
        isItemMenu: boolean,
        parentElement: HTMLElement
    ) {
        var thisA = this;

        var escapedFilename: string = cgFileName.replace("(", "\\(").replace(")", "\\)");
        this._wwa = wwa;
        this._cgFileName = cgFileName;
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._message = "";
        this._isVisible = isVisible;
        this._isYesno = isYesno;
        this._isItemMenu = isItemMenu;

        this._element = document.createElement("div");
        this._element.id = "wwa-text-message-window";
        this._element.classList.add("wwa-message-window");

        this._msgWrapperElement = document.createElement("div");
        this._msgWrapperElement.style.textAlign = "left";
        this._msgWrapperElement.style.wordWrap = "break-word";
        this._msgWrapperElement.style.margin = wwa.isClassicMode() ? "8px 0 8px 16px" : "0";
        this._msgWrapperElement.style.padding = wwa.isClassicMode() ? "0" : "7px";
        this._element.appendChild(this._msgWrapperElement);
        this._saveElement = document.createElement("div");
        this._saveElement.style.padding = "0";
        this._saveElement.style.margin = "0";
        this._element.appendChild(this._saveElement);
        this._dummyElement = document.createElement("div");
        this._dummyElement.style.display = "none";
        this._dummyElement.style.padding = "0";
        this._dummyElement.style.margin = "0";
        this._dummyElement.style.height = "55px";
        this._element.appendChild(this._dummyElement);
        this._ynWrapperElement = document.createElement("div");
        this._ynWrapperElement.classList.add("wwa-yesno-wrapper");
        this._element.appendChild(this._ynWrapperElement);

        this._parentElement = parentElement;
        this._parentElement.appendChild(this._element);

        /**
         * @todo YesNo ボタンは可能であればCSSに収めたい
         */
        this._divYesElement = document.createElement("div");
        this._divYesElement.classList.add("wwa-yes-button");
        this._divYesElement.style.background =
            "url(" + escapedFilename + ")";
        this._divYesElement.onclick = function () {
            if (!thisA._isInputDisable) {
                wwa.setYesNoInput(YesNoState.YES);
                thisA.update();
            }
        };
        this._divYesElement.style.cursor = "pointer";
        this._divNoElement = document.createElement("div");
        this._divNoElement.classList.add("wwa-no-button");
        this._divNoElement.style.background =
            "url(" + escapedFilename + ")";
        this._divNoElement.onclick = function () {
            if (!thisA._isInputDisable) {
                wwa.setYesNoInput(YesNoState.NO);
                thisA.update();
            }
        };
        this._ynWrapperElement.appendChild(this._divYesElement);
        this._ynWrapperElement.appendChild(this._divNoElement);

        thisA._isInputDisable = false;
        switch (wwa.userDevice.device) {
            case DEVICE_TYPE.SP:
            case DEVICE_TYPE.VR:
                //スマートフォン用に拡大
                this._parentElement.classList.add("useScaleUp");
                break;
        }
        this.update();
    }

    public setPosition(x: number, y: number, width: number, height: number): void {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this.update();
    }

    public setPositionByPlayerPosition(existsFaces: boolean, existsScoreWindow: boolean, displayCenter: boolean, playerPos: Position, cameraPos: Position) {
        var playerInScreenY = playerPos.getPartsCoord().substract(cameraPos.getPartsCoord()).y;
        var pos: Positioning;
        if (existsFaces) {
            pos = Positioning.BOTTOM;
        } else if (existsScoreWindow) {
            pos = Positioning.SCORE;
        } else if (displayCenter) {
            pos = Positioning.CENTER;
        } else if (playerInScreenY >= Math.ceil(WWAConsts.V_PARTS_NUM_IN_WINDOW / 2)) {
            pos = Positioning.TOP;
        } else {
            pos = Positioning.BOTTOM;
        }
        this.setPositionEasy(pos);
    }

    public setPositionEasy(pos: Positioning): void {
        var centerPos = Math.floor(this._element.clientHeight / 2);
        if (pos === Positioning.CENTER) {
            this._y = WWAConsts.MAP_WINDOW_HEIGHT / 2 - centerPos;
            this.update();
            return;
        }

        if (pos === Positioning.TOP) {
            this._y = Math.max(
                20,
                WWAConsts.MAP_WINDOW_HEIGHT / 4 - centerPos) + 10;
            this.update();
            return;
        }

        if (pos === Positioning.BOTTOM) {
            this._y = Math.min(
                WWAConsts.MAP_WINDOW_HEIGHT - 20 - this._element.clientHeight,
                WWAConsts.MAP_WINDOW_HEIGHT * 3 / 4 - centerPos);
            this.update();
            return;
        }

        if (pos === Positioning.SCORE) {
            this._y = 80;
            this.update();
            return;
        }

    }

    public setMessage(message: string): void {
        this._message = message;
        this.update();
    }
    public clear(): void {
        this._message = "";
        this.update();
    }
    public setYesNoChoice(isYesNo: boolean): boolean {
        this._isInputDisable = false;
        this._isYesno = isYesNo;
        this.update();
        return this._isYesno;
    }
    public isYesNoChoice(): boolean {
        return this._isYesno;
    }
    public isSaveChoice(): boolean {
        return this._isSave;
    }
    public setItemMenuChoice(isItemMenu: boolean): boolean {
        this._isInputDisable = false;
        this._isItemMenu = isItemMenu;
        this.update();
        return this._isItemMenu;
    }
    public isItemMenuChoice(): boolean {
        return this._isItemMenu;
    }
    public setInputDisable(): void {
        this._isInputDisable = true;
    }
    public isInputDisable(): boolean {
        return this._isInputDisable;
    }
    public show(): void {
        this._isVisible = true;
        this.update();
    }
    public hide(): void {
        this._isVisible = false;
        this.update();
    }
    public isVisible(): boolean {
        return this._isVisible;
    }
    private isWideChar(char: string): boolean {
        return (char.match(/^[^\x01-\x7E\xA1-\xDF]+$/) !== null);
    }
    /**
     * クラシックモード用: 1行分のテキストを表示する要素を構築します。
     * @param message 挿入したいメッセージ
     * @returns {HTMLSpanElement} 1行分のテキストが含まれている span 要素
     */
    private createClassicTextElement(message: string): HTMLSpanElement {
        var lsp = document.createElement("span");
        let count = 0;
        let lineStr = "";

        for (let j = 0; j < message.length || count != 0; j++) { // 1文字
            if (this.isWideChar(message.charAt(j))) {
                count += 2; // 全角の場合
            } else {
                count += 1; // 半角の場合
            }
            lineStr += message.charAt(j);
            if (count + 1 > WWAConsts.MSG_STR_WIDTH * 2) {
                if (message.charAt(j + 1) === "。" || message.charAt(j + 1) === "、") {
                    lineStr += message.charAt(j + 1); // 句読点の場合は行末に入れる
                    j++;
                }
                var vsp = document.createElement("span"); // View SPan
                vsp.style.display = "inline-block";
                vsp.style.width = "100%";
                vsp.textContent = lineStr;
                lsp.appendChild(vsp);
                count = 0;
                lineStr = "";
            }
        }
        return lsp;
    }
    public update(): void {
        var base = this._wwa.getYesNoImgCoord();
        if (this._isYesno) {
            if (this._wwa.getYesNoState() === YesNoState.YES) {
                this._divYesElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_YESP_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
                this._divNoElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_NO_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
            } else if (this._wwa.getYesNoState() === YesNoState.NO) {
                this._divYesElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_YES_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
                this._divNoElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_NOP_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
            } else {
                this._divYesElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_YES_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
                this._divNoElement.style.backgroundPosition =
                    "-" + (base.x + WWAConsts.IMGRELPOS_YESNO_NO_X) * WWAConsts.CHIP_SIZE + "px " +
                    "-" + (base.y * WWAConsts.CHIP_SIZE) + "px";
            }
            this._ynWrapperElement.style.display = "block";
        } else {
            this._ynWrapperElement.style.display = "none";
        }
        this._msgWrapperElement.textContent = "";
        var mesArray = this._message.split("\n");
        mesArray.forEach((line, i) => {
            let lsp: HTMLSpanElement; // Logical SPan
            if (this._wwa.isClassicMode()) {
                lsp = this.createClassicTextElement(line);
            } else {
                lsp = document.createElement("span");
                lsp.textContent = mesArray[i];
            }
            this._msgWrapperElement.appendChild(lsp);
            this._msgWrapperElement.appendChild(document.createElement("br"));
        });

        if (this._isVisible) {
            this._element.style.left = this._x + "px";
            this._element.style.top = this._y + "px";
        } else {
            // HACK: display: none;にしてもいいのだが、そうすると、
            // 裏方でclientHeight(プレイヤー座標から位置を決定する時に必要!!)が取得できなくなる。
            this._element.style.left = "-999999px";
            this._element.style.top = "-999999px";
        }
        if (this._isSave) {
            this._saveElement.style.display = "block";
        } else {
            this._saveElement.style.display = "none";
        }
        this._element.style.width = this._width + "px";
        this._element.style.minHeight = this._height + "px"; // minなのでoverflowしても安心!!!
    }
    setWWASave(wwaSave: WWASave) {
        this._wwaSave = wwaSave;
    }

    createSaveDom(): void {
        var loadWWAData: WWASaveData;
        var owner_div, savedata_main_div, ss_div, energy_div, span, energy_icon_div, energy_original_dom, energy_status_value_div, backgroundPositionText, backgroundImageText;
        owner_div = document.createElement("div");
        energy_original_dom = document.getElementById("disp-energy");
        backgroundPositionText = energy_original_dom.style["backgroundPosition"];
        backgroundImageText = energy_original_dom.style["backgroundImage"];
        var len: number = this._wwaSave.list.length;
        for (var i = 0; i < len; i++) {
            loadWWAData = this._wwaSave.list[i];

            savedata_main_div = document.createElement("div");
            savedata_main_div.classList.add("savedata");
            savedata_main_div.setAttribute("save_id", i);
            savedata_main_div.addEventListener("click", (e): void => {
                this.setSaveID(e.currentTarget.getAttribute("save_id") | 0);
                this._save_close = true;
                e.preventDefault();
            });

            ss_div = document.createElement("div");
            ss_div.classList.add("ss");
            savedata_main_div.appendChild(ss_div);

            energy_div = document.createElement("div");
            energy_div.classList.add("wide-cell-row");
            energy_div.style["backgroundPosition"] = backgroundPositionText;
            energy_div.style["backgroundImage"] = backgroundImageText;
            savedata_main_div.appendChild(energy_div);
            owner_div.appendChild(savedata_main_div);


            if (loadWWAData.flag) {
                //セーブデータあり
                ss_div.appendChild(loadWWAData.cvs);

                span = document.createElement("span");
                span.textContent = loadWWAData.getDateText();//時刻の表示
                if (loadWWAData.isLastSaveData()) {
                    span.style.color = WWASaveConsts.DATE_LAST_SAVE_TEXT_COLOR;//最後にセーブした箇所の色を変更
                }

                ss_div.appendChild(span);

                energy_icon_div = document.createElement("div");
                energy_icon_div.classList.add("status-icon");
                energy_icon_div.style["backgroundImage"] = backgroundImageText;
                energy_icon_div.style["backgroundPosition"] = "-120px -80px";
                energy_div.appendChild(energy_icon_div);

                energy_status_value_div = document.createElement("div");
                energy_status_value_div.classList.add("status-value-box");
                energy_status_value_div.textContent = loadWWAData.getStatusEnergy();
                energy_div.appendChild(energy_status_value_div);
            }
        }
        this._saveElement.textContent = "";
        this._saveElement.appendChild(owner_div);
        this.setSaveID(this._save_select_id);
        this._isSave = true;
        this._save_counter = 0;
        this._save_close = false;
    }
    deleteSaveDom(): void {
        this._saveElement.textContent = "";
        this._isSave = false;
    }
    setSaveID(save_select_id: number): void {
        this._save_select_id = save_select_id;
        var domList = document.querySelectorAll(".savedata");
        var dom;
        var len: number = domList.length;
        for (var i = 0; i < len; i++) {
            dom = domList[i];
            if (save_select_id === i) {
                dom.classList.add("select");
            } else {
                dom.classList.remove("select");
            }

        }
    }
    save(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData): boolean {
        return this._wwaSave.save(gameCvs, _quickSaveData, this._save_select_id);
    }
    load(): WWAData {
        return this._wwaSave.load(this._save_select_id);
    }
    public saveUpdate(): void {
        if (this._save_counter > 0) {
            this._save_counter--;
        }
    }
    public isSaveClose(): boolean {
        return this._save_close;
    }
    private cursor_wait() {
        this._save_counter = WWAConsts.CONTROLL_WAIT_FRAME;
    }
    public saveControll(moveDir: Direction): void {
        if (this._save_counter > 0) {
            //カーソルリピート待機
            return;
        }
        if (this._isInputDisable) {
            //受付しないタイミング
            return;
        }
        switch (moveDir) {
            case Direction.DOWN:
                this._save_select_id -= 2;
                this.cursor_wait();
                break;
            case Direction.UP:
                this._save_select_id += 2;
                this.cursor_wait();
                break;
            case Direction.LEFT:
                this._save_select_id--;
                this.cursor_wait();
                break;
            case Direction.RIGHT:
                this._save_select_id++;
                this.cursor_wait();
                break;
        }
        this.setSaveID((this._save_select_id + WWASaveConsts.QUICK_SAVE_MAX) % WWASaveConsts.QUICK_SAVE_MAX);
    }
    protected get windowName(): string {
        return "MessageWindow";
    }
}
