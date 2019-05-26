declare var external_script_inject_mode: boolean;
declare var VERSION_WWAJS: string; // webpackにより注入
declare function loader_start(e: any): void;

import {
    WWAConsts as Consts, WWAData as Data, Coord, Position,
    LoaderProgress, LoadStage, YesNoState, ChoiceCallInfo, Status, WWAData, Face, LoadType, Direction,
    SidebarButton, SystemMessage2, LoadingMessageSize, LoadingMessagePosition, loadMessagesClassic,
    SystemSound, loadMessages, SystemMessage1, sidebarButtonCellElementID, SpeedChange, PartsType, dirToKey,
    speedNameList, dirToPos, MoveType, AppearanceTriggerType, vx, vy, EquipmentStatus, SecondCandidateMoveType,
    ChangeStyleType, MacroStatusIndex, SelectorType, IDTable, UserDevice, OS_TYPE, DEVICE_TYPE, BROWSER_TYPE
} from "./wwa_data";

import {
    KeyCode,
    KeyState,
    KeyStore,
    MouseState,
    MouseStore,
    GamePadState,
    GamePadStore
} from "./wwa_input";

import * as CryptoJS from "crypto-js";
import * as util from "./wwa_util";
import { CGManager } from "./wwa_cgmanager";
import { Camera } from "./wwa_camera";
import { Player } from "./wwa_parts_player";
import { Monster } from "./wwa_monster";
import { ObjectMovingDataManager } from "./wwa_motion";
import {
    MessageWindow, MosterWindow, ScoreWindow, MessageInfo, Macro, parseMacro
} from "./wwa_message";
import { BattleEstimateWindow } from "./wwa_estimate_battle";
import { PasswordWindow, Mode } from "./wwa_password_window";
import { inject } from "./wwa_inject_html";
import { ItemMenu } from "./wwa_item_menu";
import { WWAWebAudio, WWAAudioElement, WWAAudio } from "./wwa_audio";

let wwa: WWA;
let wwap_mode: boolean = false;

/**
*
*
* @param current
* @param total
* @param stage
* @returns {LoaderProgress}
*/
export function getProgress(current: number, total: number, stage: LoadStage): LoaderProgress {
    var progress = new LoaderProgress();
    progress.current = current;
    progress.total = total;
    progress.stage = stage;
    return progress;
}

export class WWA {
    private _cvs: HTMLCanvasElement;
    private _cvsSub: HTMLCanvasElement;
    private _cvsCover: HTMLCanvasElement;
    private _cgManager: CGManager;
    private _wwaData: Data;
    private _mainCallCounter: number;
    private _animationCounter: number;
    private _player: Player;
    private _monster: Monster;
    private _keyStore: KeyStore;
    private _mouseStore: MouseStore;
    private _gamePadStore: GamePadStore;
    private _camera: Camera;
    public _itemMenu: ItemMenu;  // TODO(rmn): wwa_parts_player からの参照を断ち切ってprivateに戻す
    private _objectMovingDataManager: ObjectMovingDataManager;
    public _messageWindow: MessageWindow; // TODO(rmn): wwa_parts_player からの参照を断ち切ってprivateに戻す
    private _monsterWindow: MosterWindow;
    private _scoreWindow: ScoreWindow;
    //        private _messageQueue: string[];
    private _messageQueue: MessageInfo[];
    private _yesNoJudge: YesNoState;
    private _yesNoJudgeInNextFrame: YesNoState;
    private _yesNoChoicePartsCoord: Coord;
    private _yesNoChoicePartsID: number;
    private _yesNoChoiceCallInfo: ChoiceCallInfo;
    private _yesNoDispCounter: number;
    private _yesNoUseItemPos: number;
    private _yesNoURL: string;
    // private _waitTimeInCurrentFrame: number;
    private _waitFrame: number;
    private _usePassword: boolean;
    private _useHelp: boolean;
    private _useBattleReportButton: boolean;
    private _wwaWrapperElement: HTMLDivElement;
    private _mouseControllerElement: HTMLDivElement;
    private _statusPressCounter: Status; // ステータス型があるので、アニメーション残りカウンタもこれで代用しまぁす。
    private _battleEstimateWindow: BattleEstimateWindow;
    private _passwordWindow: PasswordWindow;

    private _stopUpdateByLoadFlag: boolean;
    private _isURLGateEnable: boolean;
    private _loadType: LoadType;
    private _restartData: WWAData;
    private _quickSaveData: WWAData;
    private _prevFrameEventExected: boolean;

    private _reservedMoveMacroTurn: number; // $moveマクロは、パーツマクロの中で最後に効果が現れる。実行されると予約として受け付け、この変数に予約内容を保管。
    private _lastMessage: MessageInfo;
    private _frameCoord: Coord;
    private _battleEffectCoord: Coord;

    private _audioInstances: WWAAudio[];

    private _playSound: (s: number) => void;

    private _temporaryInputDisable: boolean;

    private _isLoadedSound: boolean;
    private _isSkippedSoundMessage: boolean; // メッセージの読み込みジャッジを飛ばすフラグ(汎用的に使えるようにプロパティに入れている)

    private _soundLoadSkipFlag: boolean;

    private _passwordLoadExecInNextFrame: boolean;
    private _passwordSaveExtractData: WWAData;

    private _faces: Face[];
    private _execMacroListInNextFrame: Macro[];
    private _clearFacesInNextFrame: boolean;
    private _paintSkipByDoorOpen: boolean; // WWA.javaの闇を感じる扉モーションのための描画スキップフラグ
    private _isClassicModeEnable: boolean;
    private _useGameEnd: boolean;

    private _useConsole: boolean;
    private _audioDirectory: string;
    private _hasTitleImg: boolean;

    private _isActive: boolean;

    /**
     * 背景パーツ番号として添字を与えると
     * パーツが配置されている(X,Y)座標をビットパターンに変換したものの配列を見ることができます。
     * ビットパターンの計算方法は、Y << 16 | X です。
     * (変数の下から32ビットを使用し、上位16ビットがY座標, 下位16ビットがX座標を表します)
     * 
     * このメンバ変数は、`$parts`マクロで、背景パーツの一斉置換を行う時に利用されます。
     * WWADataのmap を変更（背景パーツを配置/削除したり、QuickLoadを実施したり）した場合、
     * 必ずこの配列を更新する必要があります。
     * 
     * 物体パーツに対して同様なものは `_mapObjectIDTable` です。
     * @see _mapObjectIDTable
     * 
     * ### 例
     * 例えば、背景パーツ番号 4 が(X,Y) = (2, 3), (10, 7) に配置されている場合、
     * 配列 `this._mapIDTable[4]` は、  配列`[196610, 458762]`を参照します。 (要素の順番は保証されません)
     * - 注1) 3 << 16 | 2  => 196610,
     * - 注2) 7 << 16 | 10 =>　458762
     */
    private _mapIDTable: number[][];

    /**
     * 物体パーツ番号として添字を与えると
     * パーツが配置されている(X,Y)座標をビットパターンに変換したものの配列を見ることができます。
     * 利用方法は背景パーツ版の _mapIDTable を参照してください。
     * @see _mapIDTable
     */
    private _mapObjectIDTable: number[][];

    ////////////////////////
    public debug: boolean;
    private hoge: number[][];
    ////////////////////////

    private _loadHandler: (e) => void;
    public audioContext: AudioContext;
    public audioGain: GainNode;
    private audioExtension: string = "";
    public userDevice:  UserDevice;

    constructor(mapFileName: string, workerFileName: string, urlgateEnabled: boolean = false, titleImgName: string, classicModeEnabled: boolean, itemEffectEnabled: boolean, audioDirectory: string = "") {
        var ctxCover;
        window.addEventListener("click", (e): void => {
            // WWA操作領域がクリックされた場合は, stopPropagationなので呼ばれないはず
            this._isActive = false;
        });
        util.$id("wwa-wrapper").addEventListener("click", (e): void => {
            e.stopPropagation();
            this._isActive = true;
        });
        this._isActive = true;
        this._useGameEnd = false;

        if (titleImgName === null) {
            this._hasTitleImg = false;
            this._cvsCover = <HTMLCanvasElement>util.$id("progress-panel");
            ctxCover = <CanvasRenderingContext2D>this._cvsCover.getContext("2d");
            ctxCover.fillStyle = "rgb(0, 0, 0)";
        } else {
            this._hasTitleImg = true;
        }

        try {
            if (this._hasTitleImg) {
                util.$id("version").textContent = "WWA Wing Ver." + VERSION_WWAJS;
            } else {
                this._setLoadingMessage(ctxCover, 0);
            }
        } catch (e) { }

        const _AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (_AudioContext) {
            this.audioContext = new _AudioContext();
            this.audioGain = this.audioContext.createGain();
            this.audioGain.gain.setValueAtTime(1, this.audioContext.currentTime);
        }

        var myAudio = new Audio();
        if (("no" !== myAudio.canPlayType("audio/mpeg") as string) && ("" !== myAudio.canPlayType("audio/mpeg"))) {
            this.audioExtension = "mp3";
        } else {
            this.audioExtension = "m4a";
        }
        this.userDevice = new UserDevice();

        this._isURLGateEnable = urlgateEnabled;
        this._isClassicModeEnable = classicModeEnabled;
        this._mainCallCounter = 0;
        this._animationCounter = 0;
        this._statusPressCounter = new Status(0, 0, 0, 0);
        if (!audioDirectory) {
            audioDirectory = "./audio/";
        } else if (audioDirectory[audioDirectory.length - 1] !== "/") {
            audioDirectory += "/";
        }
        this._audioDirectory = audioDirectory;
        this._useBattleReportButton = true;
        var t_start: number = new Date().getTime();
        var isLocal = !!location.href.match(/^file/);
        if (isLocal) {
            switch (this.userDevice.device) {
                case DEVICE_TYPE.GAME:
                    switch (this.userDevice.os) {
                        case OS_TYPE.NINTENDO:
                            Consts.BATTLE_INTERVAL_FRAME_NUM = 5;
                            return;
                    }
                    this._useGameEnd = true;
                    this._useBattleReportButton = false;
                    break;
                default:
                    if (this.userDevice.browser !== BROWSER_TYPE.FIREFOX) {
                        alert(
                            "【警告】直接HTMLファイルを開いているようです。\n" +
                            "このプログラムは正常に動作しない可能性があります。\n" +
                            "マップデータの確認を行う場合には同梱の「wwa-server.exe」をご利用ください。\n" +
                            "また、ブラウザがFirefoxの場合には直接HTMLファイルを開いて動作確認をすることができます。"
                        );
                    }
                    break;
            }
        }
        switch (this.userDevice.device) {
            case DEVICE_TYPE.VR:
            case DEVICE_TYPE.GAME:
                this._usePassword = false;
                break;
            default:
                this._usePassword = true;
                break;
        }
        switch (this.userDevice.device) {
            case DEVICE_TYPE.SP:
            case DEVICE_TYPE.VR:
            case DEVICE_TYPE.GAME:
                this._useHelp = false;
                break;
            default:
                this._useHelp = true;
                break;
        }

        if (!this._usePassword) {
            util.$id("cell-load").textContent = "Quick Load";
        }
        if (this._useGameEnd) {
            util.$id("cell-gotowwa").textContent = "Game End";

        }
        if (this._useBattleReportButton) {
            util.$id("cell-gotowwa").textContent = "Battle Report";
        }

        this._loadHandler = (e): void => {
            if (e.data.error !== null && e.data.error !== void 0) {
                this._setErrorMessage("下記のエラーが発生しました。: \n" + e.data.error.message, ctxCover);
                return;
            }
            if (e.data.progress !== null && e.data.progress !== void 0) {
                this._setProgressBar(e.data.progress);
                return;
            }

            this._wwaData = e.data.wwaData;
            this._wwaData.isItemEffectEnabled = itemEffectEnabled;
            try {
                if (this._hasTitleImg) {
                    util.$id("version").textContent += (
                        " (Map data Ver. "
                        + Math.floor(this._wwaData.version / 10) + "." +
                        + this._wwaData.version % 10 + ")"
                    );
                } else {
                    this._setLoadingMessage(ctxCover, 1);
                }
            } catch (e) { }

            var mapFileName = util.$id("wwa-wrapper").getAttribute("data-wwa-mapdata"); //ファイル名取得
            var pathList = mapFileName.split("/"); //ディレクトリで分割
            pathList.pop(); //最後のファイルを消す
            pathList.push(this._wwaData.mapCGName); //最後に画像ファイル名を追加
            this._wwaData.mapCGName = pathList.join("/"); // pathを復元


            this.initCSSRule();
            this._setProgressBar(getProgress(0, 4, LoadStage.GAME_INIT));
            this._setLoadingMessage(ctxCover, 2);
            var cgFile = new Image();
            cgFile.src = this._wwaData.mapCGName;
            cgFile.addEventListener("error", (): void => {
                this._setErrorMessage("画像ファイル「" + this._wwaData.mapCGName + "」が見つかりませんでした。\n" +
                    "管理者の方へ: データがアップロードされているか、\n" +
                    "パーミッションを確かめてください。", ctxCover);
            });
            this._restartData = JSON.parse(JSON.stringify(this._wwaData));

            var escapedFilename: string = this._wwaData.mapCGName.replace("(", "\\(").replace(")", "\\)");
            Array.prototype.forEach.call(util.$qsAll("div.item-cell"), (node: HTMLElement) => {
                node.style.backgroundPosition = "-40px -80px";
                node.style.backgroundImage = "url(" + escapedFilename + ")";
            });
            Array.prototype.forEach.call(util.$qsAll("div.wide-cell-row"), (node: HTMLElement) => {
                node.style.backgroundPosition = "-160px -120px";
                node.style.backgroundImage = "url(" + escapedFilename + ")";
            });
            Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-click-border"), (node: HTMLElement) => {
                node.style.backgroundImage = "url('" + Consts.ITEM_BORDER_IMG_DATA_URL + "')";
                node.style.backgroundPosition = "0 0";
                node.style.display = "none";
                node.style.cursor = "pointer";
            });
            Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-disp"), (node: HTMLElement) => {
                node.style.backgroundImage = "url(" + escapedFilename + ")";
            });
            var iconNode_energy: HTMLElement = util.$qsh("#disp-energy>.status-icon");
            iconNode_energy.style.backgroundPosition = "-120px -80px";
            iconNode_energy.style.backgroundImage = "url(" + escapedFilename + ")";
            var iconNode_strength = util.$qsh("#disp-strength>.status-icon");
            iconNode_strength.style.backgroundPosition = "-160px -80px";
            iconNode_strength.style.backgroundImage = "url(" + escapedFilename + ")";
            var iconNode_defence = util.$qsh("#disp-defence>.status-icon");
            iconNode_defence.style.backgroundPosition = "-200px -80px";
            iconNode_defence.style.backgroundImage = "url(" + escapedFilename + ")";
            var iconNode_gold = util.$qsh("#disp-gold>.status-icon");
            iconNode_gold.style.backgroundPosition = "-240px -80px";
            iconNode_gold.style.backgroundImage = "url(" + escapedFilename + ")";

            this._setProgressBar(getProgress(1, 4, LoadStage.GAME_INIT));
            this._setLoadingMessage(ctxCover, 3);
            this._mapIDTableCreate();
            this._replaceAllRandomObjects();

            var t_end: number = new Date().getTime();
            console.log("Loading Complete!" + (t_end - t_start) + "ms");

            this._cvs = <HTMLCanvasElement>util.$id("wwa-map");
            this._cvsSub = <HTMLCanvasElement>util.$id("wwa-map-sub");
            var ctx = <CanvasRenderingContext2D>this._cvs.getContext("2d");
            var ctxSub = <CanvasRenderingContext2D>this._cvsSub.getContext("2d");
            ctx.fillStyle = "rgba( 255, 255, 255, 0.5)";
            ctx.fillRect(0, 0, 440, 440);
            var playerPosition = new Position(this, this._wwaData.playerX, this._wwaData.playerY);
            this._camera = new Camera(playerPosition);
            this._itemMenu = new ItemMenu();
            var status = new Status(
                this._wwaData.statusEnergy, this._wwaData.statusStrength,
                this._wwaData.statusDefence, this._wwaData.statusGold);
            this._player = new Player(this, playerPosition, this._camera, status, this._wwaData.statusEnergyMax);
            this._objectMovingDataManager = new ObjectMovingDataManager(this, this._player);
            this._camera.setPlayer(this._player);
            this._keyStore = new KeyStore();
            this._mouseStore = new MouseStore();
            this._gamePadStore = new GamePadStore();
            this._messageQueue = [];
            this._yesNoJudge = YesNoState.UNSELECTED;
            this._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
            this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
            this._prevFrameEventExected = false;
            this._lastMessage = new MessageInfo("", false, false, []);
            this._execMacroListInNextFrame = [];
            this._passwordLoadExecInNextFrame = false;
            this._setProgressBar(getProgress(2, 4, LoadStage.GAME_INIT));
            this._setLoadingMessage(ctxCover, 4);
            window.addEventListener("keydown", (e): void => {
                if (!this._isActive) { return; }
                switch (this.userDevice.os) {
                    case OS_TYPE.NINTENDO:
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                }
                this._keyStore.setPressInfo(e.keyCode);
                if (e.keyCode === KeyCode.KEY_F5) {
                    e.preventDefault()
                    return;
                }
                if (!this._player.isWaitingMessage()) {
                    if (!this._player.isWaitingPasswordWindow()) {
                        if (e.keyCode === KeyCode.KEY_DOWN ||
                            e.keyCode === KeyCode.KEY_LEFT ||
                            e.keyCode === KeyCode.KEY_RIGHT ||
                            e.keyCode === KeyCode.KEY_UP ||
                            e.keyCode === KeyCode.KEY_SHIFT ||
                            e.keyCode === KeyCode.KEY_ENTER ||
                            e.keyCode === KeyCode.KEY_1 ||
                            e.keyCode === KeyCode.KEY_2 ||
                            e.keyCode === KeyCode.KEY_3 ||
                            e.keyCode === KeyCode.KEY_A ||
                            e.keyCode === KeyCode.KEY_C ||
                            e.keyCode === KeyCode.KEY_D ||
                            e.keyCode === KeyCode.KEY_E ||
                            e.keyCode === KeyCode.KEY_M ||
                            e.keyCode === KeyCode.KEY_N ||
                            e.keyCode === KeyCode.KEY_Q ||
                            e.keyCode === KeyCode.KEY_S ||
                            e.keyCode === KeyCode.KEY_W ||
                            e.keyCode === KeyCode.KEY_X ||
                            e.keyCode === KeyCode.KEY_Y ||
                            e.keyCode === KeyCode.KEY_Z ||
                            e.keyCode === KeyCode.KEY_ESC ||
                            e.keyCode === KeyCode.KEY_F1 ||
                            e.keyCode === KeyCode.KEY_F2 ||
                            e.keyCode === KeyCode.KEY_F3 ||
                            e.keyCode === KeyCode.KEY_F4 ||
                            e.keyCode === KeyCode.KEY_F6 ||
                            e.keyCode === KeyCode.KEY_F7 ||
                            e.keyCode === KeyCode.KEY_F8 ||
                            e.keyCode === KeyCode.KEY_F12 ||
                            e.keyCode === KeyCode.KEY_SPACE) {
                            e.preventDefault();
                        }
                    }
                } else {
                    if (e.keyCode === KeyCode.KEY_DOWN ||
                        e.keyCode === KeyCode.KEY_LEFT ||
                        e.keyCode === KeyCode.KEY_RIGHT ||
                        e.keyCode === KeyCode.KEY_UP ||
                        e.keyCode === KeyCode.KEY_SHIFT ||
                        e.keyCode === KeyCode.KEY_ENTER ||
                        e.keyCode === KeyCode.KEY_ESC ||
                        e.keyCode === KeyCode.KEY_SPACE) {
                        e.preventDefault();
                    }
                }
            });
            window.addEventListener("keyup", (e): void => {
                if (!this._isActive) { return; }
                switch (this.userDevice.os) {
                    case OS_TYPE.NINTENDO:
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                }
                this._keyStore.setReleaseInfo(e.keyCode);
                if (e.keyCode === KeyCode.KEY_F5) {
                    e.preventDefault()
                } else if (e.keyCode === KeyCode.KEY_DOWN ||
                    e.keyCode === KeyCode.KEY_LEFT ||
                    e.keyCode === KeyCode.KEY_RIGHT ||
                    e.keyCode === KeyCode.KEY_UP ||
                    e.keyCode === KeyCode.KEY_SHIFT ||
                    e.keyCode === KeyCode.KEY_ENTER ||
                    e.keyCode === KeyCode.KEY_1 ||
                    e.keyCode === KeyCode.KEY_2 ||
                    e.keyCode === KeyCode.KEY_3 ||
                    e.keyCode === KeyCode.KEY_A ||
                    e.keyCode === KeyCode.KEY_C ||
                    e.keyCode === KeyCode.KEY_D ||
                    e.keyCode === KeyCode.KEY_E ||
                    e.keyCode === KeyCode.KEY_M ||
                    e.keyCode === KeyCode.KEY_N ||
                    e.keyCode === KeyCode.KEY_Q ||
                    e.keyCode === KeyCode.KEY_S ||
                    e.keyCode === KeyCode.KEY_W ||
                    e.keyCode === KeyCode.KEY_X ||
                    e.keyCode === KeyCode.KEY_Y ||
                    e.keyCode === KeyCode.KEY_Z ||
                    e.keyCode === KeyCode.KEY_ESC ||
                    e.keyCode === KeyCode.KEY_F1 ||
                    e.keyCode === KeyCode.KEY_F3 ||
                    e.keyCode === KeyCode.KEY_F4 ||
                    e.keyCode === KeyCode.KEY_F6 ||
                    e.keyCode === KeyCode.KEY_F7 ||
                    e.keyCode === KeyCode.KEY_F8 ||
                    e.keyCode === KeyCode.KEY_F9 ||
                    e.keyCode === KeyCode.KEY_F12 ||
                    e.keyCode === KeyCode.KEY_SPACE) {
                    if (!this._player.isWaitingMessage() && !this._player.isWaitingPasswordWindow()) {
                        e.preventDefault();
                    }
                }
            });
            window.addEventListener("blur", (e): void => {
                this._keyStore.allClear();
                this._mouseStore.clear();
            });
            window.addEventListener("contextmenu", (e): void => {
                this._keyStore.allClear();
                this._mouseStore.clear();
            });
            // IEのF1キー対策
            window.addEventListener("help", (e): void => {
                if (!this._isActive) { return; }
                e.preventDefault();
            });


            this._wwaWrapperElement = <HTMLDivElement>(util.$id("wwa-wrapper"));
            this._mouseControllerElement = <HTMLDivElement>(util.$id("wwa-controller"));
            this._mouseControllerElement.addEventListener("mousedown", (e): void => {
                if (!this._isActive) { return; }
                if (e.which === 1) {
                    if (this._mouseStore.getMouseState() !== MouseState.NONE) {
                        e.preventDefault();
                        return;
                    }
                    var mousePos = util.$localPos(e.clientX, e.clientY);
                    var playerPos = this._player.getDrawingCenterPosition();
                    var dist = mousePos.substract(playerPos);
                    var dx = Math.abs(dist.x);
                    var dy = Math.abs(dist.y);
                    var dir: Direction;
                    var sideFlag = false;
                    if ((dx < Consts.CHIP_SIZE) && (dy < Consts.CHIP_SIZE)) {
                        //同一のマスをタップしていて、かつ側面の場合はその方向へ移動
                        switch ((playerPos.x / Consts.CHIP_SIZE | 0)) {
                            case 0:
                                sideFlag = true;
                                dir = Direction.LEFT;
                                break;
                            case Consts.H_PARTS_NUM_IN_WINDOW - 1:
                                sideFlag = true;
                                dir = Direction.RIGHT;
                                break;
                        }
                        switch ((playerPos.y / Consts.CHIP_SIZE | 0)) {
                            case 0:
                                sideFlag = true;
                                dir = Direction.UP;
                                break;
                            case Consts.V_PARTS_NUM_IN_WINDOW - 1:
                                sideFlag = true;
                                dir = Direction.DOWN;
                                break;
                        }

                    }
                    if (!sideFlag) {
                        if (dist.y > 0 && dy > dx) {
                            dir = Direction.DOWN;
                        } else if (dist.y < 0 && dy > dx) {
                            dir = Direction.UP;
                        } else if (dist.x > 0 && dy < dx) {
                            dir = Direction.RIGHT;
                        } else if (dist.x < 0 && dy < dx) {
                            dir = Direction.LEFT;
                        }
                    }
                    this._mouseStore.setPressInfo(dir);
                    //e.preventDefault();//無効にするとクリック時にWWAにフォーカスされなくなる
                }
            });


            this._mouseControllerElement.addEventListener("mouseleave", (e): void => {
                this._mouseStore.clear();
            });
            this._mouseControllerElement.addEventListener("mouseup", (e): void => {
                if (!this._isActive) { return; }
                if (e.which === 1) {
                    this._mouseStore.setReleaseInfo();
                    e.preventDefault();
                }
            });

            //////////////// タッチ関連 超β ////////////////////////////
            if (window["TouchEvent"] /* ←コンパイルエラー回避 */) {
                if (this.audioContext) {
                    /**
                     * audioTest は WebAudio API の再生操作を行うだけのメソッドです。
                     *     スマートフォンでは、ユーザーからの操作なしに音声を鳴らすことは出来ません。
                     *     そのため、タッチした際にダミー音声を再生することで音声の再生を可能にしています。
                     */
                    let audioTest = () => {
                        this.audioContext.createBufferSource().start(0);
                        this._mouseControllerElement.removeEventListener("touchstart", audioTest);
                        audioTest = null;
                    };
                    this._mouseControllerElement.addEventListener("touchstart", audioTest);
                }

                this._mouseControllerElement.addEventListener("touchstart", (e: any /*←コンパイルエラー回避*/): void => {
                    if (!this._isActive) { return; }
                    if (this._mouseStore.getMouseState() !== MouseState.NONE) {
                        e.preventDefault();
                        return;
                    }
                    var mousePos = util.$localPos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                    var playerPos = this._player.getDrawingCenterPosition();
                    var dist = mousePos.substract(playerPos);
                    var dx = Math.abs(dist.x);
                    var dy = Math.abs(dist.y);
                    var dir: Direction;
                    var sideFlag = false;
                    if ((dx < Consts.CHIP_SIZE) && (dy < Consts.CHIP_SIZE)) {
                        //同一のマスをタップしていて、かつ側面の場合はその方向へ移動
                        switch ((playerPos.x / Consts.CHIP_SIZE | 0)) {
                            case 0:
                                sideFlag = true;
                                dir = Direction.LEFT;
                                break;
                            case Consts.H_PARTS_NUM_IN_WINDOW - 1:
                                sideFlag = true;
                                dir = Direction.RIGHT;
                                break;
                        }
                        switch ((playerPos.y / Consts.CHIP_SIZE | 0)) {
                            case 0:
                                sideFlag = true;
                                dir = Direction.UP;
                                break;
                            case Consts.V_PARTS_NUM_IN_WINDOW - 1:
                                sideFlag = true;
                                dir = Direction.DOWN;
                                break;
                        }

                    }
                    if (!sideFlag) {
                        if (dist.y > 0 && dy > dx) {
                            dir = Direction.DOWN;
                        } else if (dist.y < 0 && dy > dx) {
                            dir = Direction.UP;
                        } else if (dist.x > 0 && dy < dx) {
                            dir = Direction.RIGHT;
                        } else if (dist.x < 0 && dy < dx) {
                            dir = Direction.LEFT;
                        }
                    }
                    this._mouseStore.setPressInfo(dir, e.changedTouches[0].identifier);
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                });

                this._mouseControllerElement.addEventListener("touchend", (e: any): void => {
                    if (!this._isActive) { return; }
                    for (var i = 0; i < e.changedTouches.length; i++) {
                        if (this._mouseStore.getTouchID() === e.changedTouches[i].identifier) {
                            this._mouseStore.setReleaseInfo();
                            e.preventDefault();
                            break;
                        }
                    }
                });


                this._mouseControllerElement.addEventListener("touchcancel", (e: any): void => {
                    if (!this._isActive) { return; }
                    for (var i = 0; i < e.changedTouches.length; i++) {
                        if (this._mouseStore.getTouchID() === e.changedTouches[i].identifier) {
                            this._mouseStore.setReleaseInfo();
                            e.preventDefault();
                            break;
                        }
                    }
                });
            }
            //////////////// タッチ関連 超β ////////////////////////////

            util.$id("button-load").addEventListener("click", () => {
                if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                    this.onselectbutton(SidebarButton.QUICK_LOAD);
                }
            });

            util.$id("button-save").addEventListener("click", () => {
                if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                    this.onselectbutton(SidebarButton.QUICK_SAVE);
                }
            });

            util.$id("button-restart").addEventListener("click", () => {
                if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                    this.onselectbutton(SidebarButton.RESTART_GAME);
                }
            });
            util.$id("button-gotowwa").addEventListener("click", () => {
                if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                    this.onselectbutton(SidebarButton.GOTO_WWA, true);
                }
            });

            Array.prototype.forEach.call(util.$qsAll(".wide-cell-row"), (node: HTMLElement) => {
                node.addEventListener("click", () => {
                    this._displayHelp();
                });

            });

            this._frameCoord = new Coord(Consts.IMGPOS_DEFAULT_FRAME_X, Consts.IMGPOS_DEFAULT_YESNO_Y);
            this._battleEffectCoord = new Coord(Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_X, Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_Y);

            this._battleEstimateWindow = new BattleEstimateWindow(
                this, this._wwaData.mapCGName, util.$id("wwa-wrapper"));

            this._passwordWindow = new PasswordWindow(
                this, <HTMLDivElement>util.$id("wwa-wrapper"));

            this._messageWindow = new MessageWindow(
                this, 50, 180, 340, 0, "", this._wwaData.mapCGName, false, true, false, util.$id("wwa-wrapper"));
            this._monsterWindow = new MosterWindow(
                this, new Coord(50, 180), 340, 60, false, util.$id("wwa-wrapper"), this._wwaData.mapCGName);
            this._scoreWindow = new ScoreWindow(
                this, new Coord(50, 50), false, util.$id("wwa-wrapper"));
            this._setProgressBar(getProgress(3, 4, LoadStage.GAME_INIT));

            this._isLoadedSound = false;
            this._temporaryInputDisable = false;
            this._paintSkipByDoorOpen = false
            this._clearFacesInNextFrame = false
            this._useConsole = false;
            this.clearFaces();

            var self = this;
            /*
            var count = 0;
            for (var xx = 0; xx < this._wwaData.mapWidth; xx++) {
            for (var yy = 0; yy < this._wwaData.mapWidth; yy++) {
            if (this._wwaData.mapObject[yy][xx] === 1620) {
            if (count === 0) {
            count++;
            continue;
            }
            throw new Error("Found!!" + xx + " " + yy);
            }
            }
            }
            */


            this._cgManager = new CGManager(ctx, ctxSub, this._wwaData.mapCGName, this._frameCoord, (): void => {
                this._isSkippedSoundMessage = true;
                if (this._wwaData.systemMessage[SystemMessage2.LOAD_SE] === "ON") {
                    this._isLoadedSound = true;
                    this.setMessageQueue("ゲームを開始します。\n画面をクリックしてください。\n" +
                        "※iOS, Android端末では、音楽は再生されないことがあります。", false, true);
                    this._setLoadingMessage(ctxCover, LoadStage.AUDIO);
                    this.loadSound();

                    requestAnimationFrame(this.soundCheckCaller);

                    return;
                } else if (this._wwaData.systemMessage[SystemMessage2.LOAD_SE] === "OFF") {
                    this._isLoadedSound = false;
                    this.setMessageQueue("ゲームを開始します。\n画面をクリックしてください。", false, true);
                    this.openGameWindow();
                    return;
                } // 読み込みメッセージをスキップした場合、処理はここまで
                this._isSkippedSoundMessage = false;
                if (!this._hasTitleImg) {
                    ctxCover.clearRect(0, 0, Consts.SCREEN_WIDTH, Consts.SCREEN_HEIGHT);
                }

                if (this._usePassword) {
                    this._messageWindow.setMessage(
                        (
                            this._wwaData.systemMessage[SystemMessage2.LOAD_SE] === "" ?
                                "効果音・ＢＧＭデータをロードしますか？" :
                                this._wwaData.systemMessage[SystemMessage2.LOAD_SE]
                        ) + "\n※iOS, Android端末では、選択に関わらず音楽が再生されないことがあります。");
                    this._messageWindow.show();
                    this._setProgressBar(getProgress(4, 4, LoadStage.GAME_INIT));
                    var timer = setInterval((): void => {
                        self._keyStore.update();
                        self._gamePadStore.update();

                        if (self._yesNoJudgeInNextFrame === YesNoState.UNSELECTED) {
                            if (
                                self._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                                self._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                                self._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)
                            ) {
                                self._yesNoJudgeInNextFrame = YesNoState.YES
                            } else if (
                                self._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                                self._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                                self._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_B)
                            ) {
                                self._yesNoJudgeInNextFrame = YesNoState.NO
                            }
                        }

                        if (self._yesNoJudgeInNextFrame === YesNoState.YES) {
                            clearInterval(timer);
                            self._messageWindow.update();
                            self._yesNoJudge = self._yesNoJudgeInNextFrame;
                            self._messageWindow.setInputDisable();
                            setTimeout((): void => {
                                self._messageWindow.hide();
                                self._yesNoJudge = YesNoState.UNSELECTED;
                                self._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
                                self._isLoadedSound = true;
                                this._setLoadingMessage(ctxCover, LoadStage.AUDIO);
                                self.loadSound();
                                requestAnimationFrame(this.soundCheckCaller);
                            }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                        }

                        else if (self._yesNoJudgeInNextFrame === YesNoState.NO) {
                            clearInterval(timer);
                            self._messageWindow.update();
                            self._yesNoJudge = self._yesNoJudgeInNextFrame;
                            self._messageWindow.setInputDisable();
                            setTimeout((): void => {
                                self._messageWindow.hide();
                                self._yesNoJudge = YesNoState.UNSELECTED;
                                self._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
                                self._isLoadedSound = false;
                                self.openGameWindow();
                            }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                        }
                    }, Consts.DEFAULT_FRAME_INTERVAL);

                } else {
                    clearInterval(timer);
                    self._messageWindow.hide();
                    self._yesNoJudge = YesNoState.UNSELECTED;
                    self._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
                    self._isLoadedSound = true;
                    self.loadSound();
                    requestAnimationFrame(this.soundCheckCaller);
                }
            });
        }
        if (wwap_mode || Worker === void 0) {
            var script: HTMLScriptElement;
            if (!external_script_inject_mode) {
                script = document.createElement("script");
                if (wwap_mode) {
                    script.src = Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_LOADER_NO_WORKER;
                } else {
                    script.src = "wwaload.noworker.js";
                }
                document.getElementsByTagName("head")[0].appendChild(script);
            } else {
                script = <HTMLScriptElement>document.getElementById("wwaloader-ex");
                if (!script.src.match(/^http:\/\/wwawing\.com/) &&
                    !script.src.match(/^http:\/\/www\.wwawing\.com/) &&
                    !script.src.match(/^https:\/\/wwaphoenix\.github\.io/) &&
                    !script.src.match(/^https:\/\/www\.wwaphoenix\.github\.io/)) {
                    throw new Error("SCRIPT ORIGIN ERROR");
                }
            }
            var self1 = this;
            (window as any).postMessage_noWorker = (e): void => {
                self1._loadHandler(e);
            };

            // 黒魔術
            try {
                loader_start({
                    data: {
                        fileName: mapFileName + "?date=" + t_start
                    }
                });
            } catch (e) {
                script.onload = function () {
                    loader_start({
                        data: {
                            fileName: mapFileName + "?date=" + t_start
                        }
                    });
                }
            }
        } else {
            try {
                var loadWorker: Worker = new Worker(workerFileName + "?date=" + t_start);
                loadWorker.postMessage({ "fileName": mapFileName + "?date=" + t_start });
                loadWorker.addEventListener("message", this._loadHandler);
            } catch (e) {
                alert("マップデータのロード時のエラーが発生しました。:\nWebWorkerの生成に失敗しました。" + e.message);
                return;
            }
        }
    }

    private _setProgressBar(progress: LoaderProgress) {
        if (!this._hasTitleImg) {
            return;
        }

        if (progress.stage <= Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO) {
            (util.$id("progress-message-container")).textContent =
                (progress.stage === Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO ? "World Name: " + this._wwaData.worldName : loadMessages[progress.stage]);

            (util.$id("progress-bar")).style.width =
                (1 * progress.stage + (progress.current / progress.total) * 1) / (Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO + 1) * Consts.MAP_WINDOW_WIDTH + "px";

            (util.$id("progress-disp")).textContent =
                ((1 * progress.stage + (progress.current / progress.total) * 1) / (Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO + 1) * 100).toFixed(2) + "%";
        } else {
            if (this._usePassword) {
                (util.$id("progress-message-container")).textContent = "効果音/BGMを読み込んでいます。(スペースキーでスキップ）";
            } else {
                (util.$id("progress-message-container")).textContent = "ゲームデータを読み込んでいます。";
            }

            (util.$id("progress-bar-audio")).style.width =
                (progress.current * Consts.MAP_WINDOW_WIDTH / progress.total) + "px";

            (util.$id("progress-disp")).textContent =
                ((progress.current / progress.total * 100).toFixed(2)) + "%";
        }
    }

    private _setLoadingMessage(ctx: CanvasRenderingContext2D, mode: number) {
        if (this._hasTitleImg) {
            return;
        } // 注意！this._hasTitleImg が false でないと動きません！

        if (mode <= 0) { // タイトル画面
            ctx.font = LoadingMessageSize.TITLE + "px " + Consts.LOADING_FONT;
            ctx.fillText(loadMessagesClassic[0], LoadingMessagePosition.TITLE_X, LoadingMessagePosition.TITLE_Y);
            ctx.font = LoadingMessageSize.FOOTER + "px " + Consts.LOADING_FONT;
            ctx.fillText("WWA Wing Ver." + Consts.VERSION_WWAJS, LoadingMessagePosition.FOOTER_X, LoadingMessagePosition.COPYRIGHT_Y);
        } else if (mode <= loadMessagesClassic.length) { // 読み込み途中
            ctx.font = LoadingMessageSize.LOADING + "px " + Consts.LOADING_FONT;
            if (mode >= 2) {
                ctx.clearRect(LoadingMessagePosition.LOADING_X,
                    LoadingMessagePosition.LOADING_Y + (LoadingMessagePosition.LINE * (mode - 3)),
                    Consts.SCREEN_WIDTH - LoadingMessagePosition.LOADING_X, LoadingMessagePosition.LINE
                ); // 文字が太ましく見えるので一旦消去
                ctx.fillText(loadMessagesClassic[mode - 1] + " Complete!", LoadingMessagePosition.LOADING_X,
                    LoadingMessagePosition.LOADING_Y + (LoadingMessagePosition.LINE * (mode - 2))
                );
            }
            if (mode < loadMessagesClassic.length) {
                ctx.fillText(loadMessagesClassic[mode], LoadingMessagePosition.LOADING_X,
                    LoadingMessagePosition.LOADING_Y + (LoadingMessagePosition.LINE * (mode - 1))
                );
            }
            if (mode == 1) { // ワールド名を表示
                ctx.font = LoadingMessageSize.FOOTER + "px " + Consts.LOADING_FONT;
                ctx.fillText("World Name  " + this._wwaData.worldName,
                    LoadingMessagePosition.FOOTER_X, LoadingMessagePosition.WORLD_Y);
                ctx.fillText(" (Map data Ver. " + Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10 + ")",
                    LoadingMessagePosition.FOOTER_X, LoadingMessagePosition.WORLD_Y + LoadingMessagePosition.LINE);
            }
        } else { // 読み込み完了後、サウンドの読み込み時
            var messageY;
            if (this._isSkippedSoundMessage) {
                messageY = LoadingMessagePosition.LOADING_Y + (LoadingMessagePosition.LINE * (loadMessagesClassic.length - 1));
            } else {
                messageY = LoadingMessagePosition.FOOTER_Y;
            } // 読み込みの2択画面をスキップするかでサウンドの読み込みメッセージ位置が変わる
            if (mode <= LoadStage.AUDIO) { // 音声データ読み込み中
                ctx.fillText("Now Sound data Loading .....", LoadingMessagePosition.LOADING_X, messageY);
            } else { // 音声データ読み込み後
                ctx.clearRect(LoadingMessagePosition.LOADING_X, messageY - LoadingMessagePosition.LINE,
                    Consts.SCREEN_WIDTH - LoadingMessagePosition.LOADING_X, LoadingMessagePosition.LINE);
                ctx.fillText("Now Sound data Loading ..... Complete!", LoadingMessagePosition.LOADING_X, messageY);
            }
        }
    }

    private _setErrorMessage(message: string, ctx: CanvasRenderingContext2D) {
        if (this._hasTitleImg) {
            alert(message);
        } else {
            ctx.clearRect(0, 0, Consts.SCREEN_WIDTH, Consts.SCREEN_HEIGHT);
            ctx.font = LoadingMessageSize.ERRROR + "px " + Consts.LOADING_FONT;
            var errorMessage = message.split('\n');
            errorMessage.forEach(function (line, i) {
                ctx.fillText(line, LoadingMessagePosition.ERROR_X,
                    LoadingMessagePosition.ERROR_Y + (LoadingMessagePosition.LINE * i)
                );
            });
        }
    }

    public createAudioJSInstance(idx: number, isSub: boolean = false): void {
        if (idx === 0 || idx === SystemSound.NO_SOUND) {
            return;
        }
        const audioContext = this.audioContext;
        if (this._audioInstances[idx] !== void 0) {
            return;
        }
        const file = wwap_mode
            ? Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_AUDIO_DIR + "/" + idx + "." + this.audioExtension
            : this._audioDirectory + idx + "." + this.audioExtension;
        // WebAudio
        if (audioContext) {
            this._audioInstances[idx] = new WWAWebAudio(idx, file, this.audioContext, this.audioGain);
        } else {
            this._audioInstances[idx] = new WWAAudioElement(idx, file, util.$id("wwa-audio-wrapper"));
        }
    }

    public loadSound(): void {
        this._audioInstances = new Array(Consts.SOUND_MAX + 1);

        this.createAudioJSInstance(SystemSound.DECISION);
        this.createAudioJSInstance(SystemSound.ATTACK);

        for (var pid = 1; pid < this._wwaData.mapPartsMax; pid++) {
            var idx = this._wwaData.mapAttribute[pid][Consts.ATR_SOUND];
            this.createAudioJSInstance(idx);
        }
        for (var pid = 1; pid < this._wwaData.objPartsMax; pid++) {
            if (this._wwaData.objectAttribute[pid][Consts.ATR_TYPE] === Consts.OBJECT_RANDOM) {
                continue;
            }
            var idx = this._wwaData.objectAttribute[pid][Consts.ATR_SOUND];
            this.createAudioJSInstance(idx);
        }
        this._wwaData.bgm = 0;
        this._soundLoadSkipFlag = false;
    }

    public checkAllSoundLoaded(): void {
        var loadedNum = 0;
        var total = 0;
        if (!this._hasTitleImg) {
            var ctxCover = <CanvasRenderingContext2D>this._cvsCover.getContext("2d");
        } // 本当はコンストラクタで生成した変数を利用したかったけど、ゆるして
        this._keyStore.update();
        if (this._keyStore.getKeyState(KeyCode.KEY_SPACE) === KeyState.KEYDOWN) {
            this._soundLoadSkipFlag = true;
        }
        for (var i = 1; i <= Consts.SOUND_MAX; i++) {
            const instance = this._audioInstances[i];
            if (instance === void 0 || instance.isError()) {
                continue;
            }
            total++;
            if (!instance.hasData()) {
                continue;
            }
            loadedNum++;
        }
        if (loadedNum < total && !this._soundLoadSkipFlag) {
            this._setProgressBar(getProgress(loadedNum, total, LoadStage.AUDIO));
            requestAnimationFrame(this.soundCheckCaller);
            return;
        }

        this._setProgressBar(getProgress(Consts.SOUND_MAX, Consts.SOUND_MAX, LoadStage.AUDIO));
        this._setLoadingMessage(ctxCover, LoadStage.FINISH);
        this.openGameWindow();
    }


    public playSound(id: number): void {
        if (!this._isLoadedSound) {
            // 音声データがロードされていなくても、次に音が流れる設定でゲーム開始したときにBGMを復元しなければならない。
            if(id === SystemSound.NO_SOUND) {
                this._wwaData.bgm = 0;
            } else if (id >= SystemSound.BGM_LB) {
                this._wwaData.bgm = id;
            }
            return;
        }

        if (id < 0 || id > Consts.SOUND_MAX) {
            throw new Error("サウンド番号が範囲外です。");
        }
        if (id >= SystemSound.BGM_LB && this._wwaData.bgm === id) {
            return;
        }

        if ((id === SystemSound.NO_SOUND || id >= SystemSound.BGM_LB) && this._wwaData.bgm !== 0) {
            if (this._audioInstances[this._wwaData.bgm].hasData()) {
                this._audioInstances[this._wwaData.bgm].pause();
            }
            this._wwaData.bgm = 0;
        }

        if (id === 0 || id === SystemSound.NO_SOUND) {
            return;
        }
        const audioInstance = this._audioInstances[id];
        if (!audioInstance.hasData()) {
            if (id >= SystemSound.BGM_LB) {
                var loadi = ((id: number, self: WWA): void => {
                    var timer = setInterval((): void => {
                        if (self._wwaData.bgm === id) {
                            if (!self._audioInstances[id].hasData()) {
                                this._audioInstances[id].play();
                                this._wwaData.bgm = id;
                                clearInterval(timer);
                            }
                        } else {
                            clearInterval(timer);
                            if (self._wwaData.bgm !== SystemSound.NO_SOUND) {
                                loadi(self._wwaData.bgm, self);
                            }
                        }
                    }, 4);
                });
                loadi(id, this);
            }
            this._wwaData.bgm = id;
            return;
        }

        if (id !== 0 && this._audioInstances[id].hasData()) {
            if (id >= SystemSound.BGM_LB) {
                this._audioInstances[id].play();
                this._wwaData.bgm = id;
            } else {
                this._audioInstances[id].play();
            }
        }


    }

    public openGameWindow(): void {
        var self = this;
        var ppos = this._player.getPosition();
        util.$id("wwa-cover").style.opacity = "0";
        if (this.getObjectIdByPosition(ppos) !== 0) {
            this._player.setPartsAppearedFlag();
        }

        setTimeout(function () {
            util.$id("wwa-wrapper").removeChild(util.$id("wwa-cover"));
            // TODO: これが表示終わるまでプレイヤーをcontrollableにしない
            //                setTimeout(self.mainCaller, Consts.DEFAULT_FRAME_INTERVAL, self);
            self._main();
        }, Consts.SPLASH_SCREEN_DISP_MILLS);

    }

    /**
    何でこんなことしてるの?
    requestAnimationFrame で関数を呼んだ時, this が window になることを防ぐため!
    */
    public mainCaller = (() => this._main());
    public soundCheckCaller = (() => this.checkAllSoundLoaded());

    public onselectitem(itemPos: number): void {
        if (this._player.canUseItem(itemPos)) {
            var bg = <HTMLDivElement>(util.$id("item" + (itemPos - 1)));
            bg.classList.add("onpress");
            this.playSound(SystemSound.DECISION);
            if (this._wwaData.message[SystemMessage1.USE_ITEM] === "BLANK") {
                this._player.readyToUseItem(itemPos);
                var itemID = this._player.useItem();
                var mesID = this.getObjectAttributeById(itemID, Consts.ATR_STRING);
                this.setMessageQueue(
                    this.getMessageById(mesID),
                    false, false, itemID, PartsType.OBJECT,
                    this._player.getPosition().getPartsCoord());
            } else {
                this.setMessageQueue(
                    this._wwaData.message[SystemMessage1.USE_ITEM] === "" ?
                        "このアイテムを使用します。\nよろしいですか?" :
                        this._wwaData.message[SystemMessage1.USE_ITEM], true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_ITEM_USE;
                this._yesNoUseItemPos = itemPos;
            }
        }
    }

    public onselectbutton(button: SidebarButton, forcePassword: boolean = false): void {
        var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[button]));
        this.playSound(SystemSound.DECISION);
        this._itemMenu.close();
        bg.classList.add("onpress");
        if (button === SidebarButton.QUICK_LOAD) {
            if (this._quickSaveData !== void 0 && !forcePassword) {
                if (this._usePassword) {
                    this.setMessageQueue("データを読み込みますか？\n→Ｎｏでデータ復帰用パスワードの\n　入力選択ができます。", true, true);
                    this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_QUICK_LOAD;
                } else {
                    this.setMessageQueue("データを読み込みますか？", true, true);
                    this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_QUICK_LOAD;
                }
            } else {
                this.onpasswordloadcalled();
            }
        } else if (button === SidebarButton.QUICK_SAVE) {
            if (!this._wwaData.disableSaveFlag) {
                if (this._usePassword) {
                    this.setMessageQueue("データの一時保存をします。\nよろしいですか？\n→Ｎｏでデータ復帰用パスワードの\n　表示選択ができます。", true, true);
                    this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_QUICK_SAVE;
                } else {
                    this.setMessageQueue("データの一時保存をします。\nよろしいですか？", true, true);
                    this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_QUICK_SAVE;
                }
            } else {
                this.setMessageQueue("ここではセーブ機能は\n使用できません。", false, true);
            }
        } else if (button === SidebarButton.RESTART_GAME) {
            this.setMessageQueue("初めからスタートしなおしますか？", true, true);
            this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_RESTART_GAME;
        } else if (button === SidebarButton.GOTO_WWA) {
            if (this._useGameEnd) {
                (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                this.setMessageQueue("ＷＷＡゲームを終了しますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_END_GAME;
            } else if (!forcePassword) {
                (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                this.setMessageQueue("ＷＷＡの公式サイトを開きますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_GOTO_WWA;
            } else if (this._useBattleReportButton) {
                this.launchBattleEstimateWindow();
            } else {
                this.setMessageQueue("ＷＷＡの公式サイトを開きますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_GOTO_WWA;
            }
        }
    }
    public onpasswordloadcalled() {
        if (this._usePassword) {
            var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]));
            bg.classList.add("onpress");
            this.setMessageQueue("データ復帰用のパスワードを入力しますか？", true, true);
            this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
        } else {
            this.setMessageQueue("セーブデータがありません。", false, true);
        }
    }

    public onpasswordsavecalled() {
        var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]));
        bg.classList.add("onpress");
        if (!this._wwaData.disableSaveFlag) {
            if (this._usePassword) {
                this.setMessageQueue("データ復帰用のパスワードを表示しますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_PASSWORD_SAVE;
            }
        } else {
            this.setMessageQueue("ここではセーブ機能は\n使用できません。", false, true);
        }
    }
    public onitemmenucalled() {
        this.setMessageQueue("右のメニューを選択してください。", false, true);
        this._messageWindow.setItemMenuChoice(true);
        this.playSound(SystemSound.DECISION);
        this._itemMenu.openView();
    }

    public onchangespeed(type: SpeedChange) {
        var speedIndex: number, speedMessage: string;
        if (type === SpeedChange.UP) {
            speedIndex = this._player.speedUp();
        } else {
            speedIndex = this._player.speedDown();
        }
        speedMessage = "移動速度を【" + speedNameList[speedIndex] + "】に切り替えました。\n" +
            (speedIndex === Consts.MAX_SPEED_INDEX ? "戦闘も速くなります。\n" : "") +
            "(" + (Consts.MAX_SPEED_INDEX + 1) + "段階中" + (speedIndex + 1) + "）";
        // TODO(rmn): 適切な分岐に直したい
        if (this._useGameEnd) {
            speedMessage += "速度を落とすには-ボタン, 速度を上げるには+ボタンを押してください。";
        } else {
            speedMessage += "速度を落とすにはIキー, 速度を上げるにはPキーを押してください。";
        }
        this.setMessageQueue(speedMessage, false, true);
    }


    private _main(): void {
        this._temporaryInputDisable = false;
        this._stopUpdateByLoadFlag = false;

        // キー情報のアップデート
        this._keyStore.update();
        this._mouseStore.update();
        this._gamePadStore.update();
        if (this._waitFrame-- > 0) {
            //待ち時間待機
            requestAnimationFrame(this.mainCaller);
            return;
        }
        this._waitFrame = 0;

        // メッセージウィンドウによる入力割り込みが発生した時
        if (this._yesNoJudgeInNextFrame !== void 0) {
            this._yesNoJudge = this._yesNoJudgeInNextFrame;
            this._yesNoJudgeInNextFrame = void 0;
        }
        if (this._clearFacesInNextFrame) {
            this.clearFaces();
            this._clearFacesInNextFrame = false;
        }
        for (var i = 0; i < this._execMacroListInNextFrame.length; i++) {
            this._execMacroListInNextFrame[i].execute();
        }
        if (this._lastMessage.message === "" && this._lastMessage.isEndOfPartsEvent && this._reservedMoveMacroTurn !== void 0) {
            this._player.setMoveMacroWaiting(this._reservedMoveMacroTurn);
            this._reservedMoveMacroTurn = void 0;
        }
        this._execMacroListInNextFrame = [];

        // キー入力とプレイヤー移動
        ////////////// DEBUG IMPLEMENTATION //////////////////////
        /////// 本番では必ず消すこと /////////////////////////////
        //            this.debug = this._keyStore.checkHitKey(KeyCode.KEY_SHIFT);
        //////////////////////////////////////////////////////////
        var prevPosition = this._player.getPosition();

        var pdir = this._player.getDir();


        if (this._player.isControllable()) {

            if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_LEFT) === KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(Direction.LEFT) === MouseState.MOUSEDOWN) {
                this._player.controll(Direction.LEFT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_UP) === KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(Direction.UP) === MouseState.MOUSEDOWN) {
                this._player.controll(Direction.UP);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_RIGHT) === KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(Direction.RIGHT) === MouseState.MOUSEDOWN) {
                this._player.controll(Direction.RIGHT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_DOWN) === KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(Direction.DOWN) === MouseState.MOUSEDOWN) {
                this._player.controll(Direction.DOWN);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(dirToKey[pdir])) {
                this._player.controll(pdir);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                this._mouseStore.checkClickMouse(Direction.LEFT) ||
                this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                this._player.controll(Direction.LEFT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                this._mouseStore.checkClickMouse(Direction.UP) ||
                this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                this._player.controll(Direction.UP);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                this._mouseStore.checkClickMouse(Direction.RIGHT) ||
                this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                this._player.controll(Direction.RIGHT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                this._mouseStore.checkClickMouse(Direction.DOWN) ||
                this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                this._player.controll(Direction.DOWN);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyState(KeyCode.KEY_1) === KeyState.KEYDOWN) {
                this.onselectitem(1);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_2) === KeyState.KEYDOWN) {
                this.onselectitem(2);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_3) === KeyState.KEYDOWN) {
                this.onselectitem(3);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_Q) === KeyState.KEYDOWN) {
                this.onselectitem(4);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_W) === KeyState.KEYDOWN) {
                this.onselectitem(5);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_E) === KeyState.KEYDOWN) {
                this.onselectitem(6);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_A) === KeyState.KEYDOWN) {
                this.onselectitem(7);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_S) === KeyState.KEYDOWN) {
                this.onselectitem(8);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_D) === KeyState.KEYDOWN) {
                this.onselectitem(9);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_Z) === KeyState.KEYDOWN) {
                this.onselectitem(10);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_X) === KeyState.KEYDOWN) {
                this.onselectitem(11);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_C) === KeyState.KEYDOWN) {
                this.onselectitem(12);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_I) ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_MINUS)) {
                this.onchangespeed(SpeedChange.DOWN);
            } else if (
                this._keyStore.checkHitKey(KeyCode.KEY_P) ||
                this._keyStore.checkHitKey(KeyCode.KEY_F2) ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_PLUS)) {
                this.onchangespeed(SpeedChange.UP);
            } else if (
                this._keyStore.getKeyState(KeyCode.KEY_F1) === KeyState.KEYDOWN ||
                this._keyStore.getKeyState(KeyCode.KEY_M) === KeyState.KEYDOWN ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)) {
                // 戦闘結果予測 
                if (this.launchBattleEstimateWindow()) {
                }
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F3)) {
                this.playSound(SystemSound.DECISION);
                this.onselectbutton(SidebarButton.QUICK_LOAD, true);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F4)) {
                this.playSound(SystemSound.DECISION);
                this.onpasswordsavecalled()
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F5) ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A, GamePadState.BUTTON_INDEX_ZR)) {
                this.onselectbutton(SidebarButton.QUICK_LOAD);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F6) ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A, GamePadState.BUTTON_INDEX_ZL)) {
                this.onselectbutton(SidebarButton.QUICK_SAVE);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F7) ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A, GamePadState.BUTTON_INDEX_R)) {
                this.onselectbutton(SidebarButton.RESTART_GAME);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F8)) {
                this.onselectbutton(SidebarButton.GOTO_WWA);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F9) ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_X)) {
                if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                    this.onitemmenucalled();
                }
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F12)) {
                // コマンドのヘルプ 
                this._displayHelp()
            }

            this._keyStore.memorizeKeyStateOnControllableFrame();
            this._mouseStore.memorizeMouseStateOnControllableFrame();
        } else if (this._player.isJumped()) {
            if (!this._camera.isResetting()) {
                this._player.processAfterJump();
            }
        } else if (this._player.isMoving()) {
            this._player.move();
            this._objectMovingDataManager.update();
        } else if (this._player.isWaitingMessage()) {

            if (!this._messageWindow.isVisible()) {
                this._messageWindow.show();
            }

            if (this._messageWindow.isYesNoChoice()) {
                //Yes No 選択肢
                if (!this._messageWindow.isInputDisable()) {
                    if (this._yesNoJudge === YesNoState.UNSELECTED) {
                        if (
                            this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                            this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                            this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)
                        ) {
                            this._yesNoJudge = YesNoState.YES
                        } else if (
                            this._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                            this._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                            this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_B)
                        ) {
                            this._yesNoJudge = YesNoState.NO
                        }
                    }
                    if (this._yesNoJudge === YesNoState.YES) {
                        this.playSound(SystemSound.DECISION);
                        this._yesNoDispCounter = Consts.YESNO_PRESS_DISP_FRAME_NUM;
                        this._messageWindow.setInputDisable();
                        this._messageWindow.update();
                    } else if (this._yesNoJudge === YesNoState.NO) {
                        this.playSound(SystemSound.DECISION);
                        this._yesNoDispCounter = Consts.YESNO_PRESS_DISP_FRAME_NUM;
                        this._messageWindow.setInputDisable();
                        this._messageWindow.update();
                    }
                }
            } else if (this._messageWindow.isItemMenuChoice()) {
                //Item Menu 選択肢
                this._itemMenu.update();
                if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                    this._itemMenu.cursor_left();
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                    this._itemMenu.cursor_up();
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                    this._itemMenu.cursor_right();
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                    this._itemMenu.cursor_down();
                }
                if (
                    this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                    this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)
                ) {
                    this._setNextMessage();
                    this._messageWindow.setItemMenuChoice(false);
                    this._itemMenu.ok();
                } else if (
                    this._mouseStore.checkClickMouse(Direction.LEFT) ||
                    this._mouseStore.checkClickMouse(Direction.UP) ||
                    this._mouseStore.checkClickMouse(Direction.RIGHT) ||
                    this._mouseStore.checkClickMouse(Direction.DOWN) ||
                    this._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                    this._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_B)
                ) {
                    for (var i = 0; i < sidebarButtonCellElementID.length; i++) {
                        var elm = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[i]));
                        if (elm.classList.contains("onpress")) {
                            elm.classList.remove("onpress");
                        }
                    }
                    this._itemMenu.ng();
                    this._setNextMessage();
                    this.playSound(SystemSound.DECISION);
                    this._messageWindow.setItemMenuChoice(false);
                }
            } else {
                //通常メッセージ
                var enter = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_ENTER);
                var space = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_SPACE);
                var esc = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_ESC);
                if (enter === KeyState.KEYDOWN || enter === KeyState.KEYPRESS_MESSAGECHANGE ||
                    space === KeyState.KEYDOWN || space === KeyState.KEYPRESS_MESSAGECHANGE ||
                    esc === KeyState.KEYDOWN || esc === KeyState.KEYPRESS_MESSAGECHANGE ||
                    this._mouseStore.getMouseState() === MouseState.MOUSEDOWN ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A, GamePadState.BUTTON_INDEX_B)) {
                    for (var i = 0; i < sidebarButtonCellElementID.length; i++) {
                        var elm = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[i]));
                        if (elm.classList.contains("onpress")) {
                            elm.classList.remove("onpress");
                        }
                    }
                    this._setNextMessage();

                }
            }
        } else if (this._player.isWatingEstimateWindow()) {
            if (this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                this._keyStore.getKeyState(KeyCode.KEY_SPACE) === KeyState.KEYDOWN ||
                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A, GamePadState.BUTTON_INDEX_B)) {
                this.hideBattleEstimateWindow();
            }
        } else if (this._player.isFighting()) {
            this._player.fight();
            this._monsterWindow.update(this._monster);
        } else if (this._player.isWaitingMoveMacro()) {
            if (this._player.isMoveObjectAutoExecTime()) {
                this.moveObjects(false);
                this._player.resetMoveObjectAutoExecTimer();
            }
            this._objectMovingDataManager.update();
        }

        this._prevFrameEventExected = false;
        if (this._player.getPosition().isJustPosition() && this._camera.getPosition().isScreenTopPosition()) {

            if (
                !this._player.isJumped() &&
                !this._player.isWaitingMessage() &&
                !this._player.isWatingEstimateWindow() &&
                !this._player.isWaitingMoveMacro() &&
                !this._player.isFighting()) {

                if (this._player.isPartsAppearedTime()) {
                    this._player.clearPartsAppearedFlag();
                }

                // ランダムパーツのまま残っている画面内のパーツを全置換(したい)
                this._replaceRandomObjectsInScreen();

                // 当該座標の背景パーツ判定
                var eventExecuted = this.checkMap();

                if (!eventExecuted) {
                    // 当該座標の物体パーツ判定
                    this.checkObject();
                }

                this._prevFrameEventExected = eventExecuted;
            }

            // 選択系イベント( 物の売買, 二者択一 )の処理
            if (
                this._player.isWaitingMessage() &&
                this._messageWindow.isYesNoChoice() &&
                this._yesNoJudge !== YesNoState.UNSELECTED &&
                !this._player.isWaitingMoveMacro() &&
                !this._player.isFighting()) {
                this._execChoiceWindowRunningEvent();
            }
        }

        if (this._passwordLoadExecInNextFrame) {
            this._stopUpdateByLoadFlag = true;
            this._loadType = LoadType.PASSWORD;
            this._player.clearPasswordWindowWaiting();
            this._passwordLoadExecInNextFrame = false;
        }

        // draw
        this._drawAll();

        this._mainCallCounter++;
        this._mainCallCounter %= 1000000000; // オーバーフローで指数になるやつ対策
        if (!this._player.isWaitingMessage() || !this._isClassicModeEnable) { // クラシックモード以外では動くように、下の条件分岐とは一緒にしない
            this._animationCounter = (this._animationCounter + 1) % (Consts.ANIMATION_REP_HALF_FRAME * 2);
        }
        if (this._camera.isResetting()) {
            this._camera.advanceTransitionStepNum();
        }

        if (!this._player.isWaitingMessage()) {
            this._player.decrementLookingAroundTimer();
            if (this._statusPressCounter.energy > 0 && --this._statusPressCounter.energy === 0) {
                util.$id("disp-energy").classList.remove("onpress");
            }
            if (this._statusPressCounter.strength > 0 && --this._statusPressCounter.strength === 0) {
                util.$id("disp-strength").classList.remove("onpress");
            }
            if (this._statusPressCounter.defence > 0 && --this._statusPressCounter.defence === 0) {
                util.$id("disp-defence").classList.remove("onpress");
            }
            if (this._statusPressCounter.gold > 0 && --this._statusPressCounter.gold === 0) {
                util.$id("disp-gold").classList.remove("onpress");
            }
        }
        if (this._player.isWaitingMoveMacro()) {
            this._player.decrementMoveObjectAutoExecTimer();
        }
        if (!this._stopUpdateByLoadFlag) {
            //setTimeout(this.mainCaller, this._waitTimeInCurrentFrame, this);
            requestAnimationFrame(this.mainCaller);
        } else {
            this._fadeout((): void => {
                if (this._loadType === LoadType.QUICK_LOAD) {
                    this._quickLoad();
                } else if (this._loadType === LoadType.RESTART_GAME) {
                    this._restartGame();
                } else if (this._loadType === LoadType.PASSWORD) {
                    this._applyQuickLoad(this._passwordSaveExtractData);
                    this._passwordSaveExtractData = void 0;
                }
                setTimeout(this.mainCaller, Consts.DEFAULT_FRAME_INTERVAL, this)
            });
        }
    }

    private _drawAll() {
        var cpParts = this._camera.getPosition().getPartsCoord();
        var cpOffset = this._camera.getPosition().getOffsetCoord();
        var yLimit: number = Consts.MAP_WINDOW_HEIGHT;
        var targetX: number;
        var targetY: number;
        var ppos = this._player.getPosition().getPartsCoord();
        if (this._paintSkipByDoorOpen) {
            this._paintSkipByDoorOpen = false;
            return;
        }
        this._cgManager.clearCanvas(0, 0, Consts.MAP_WINDOW_WIDTH, Consts.MAP_WINDOW_HEIGHT);
        this._cgManager.drawBase(0, 0, Consts.MAP_WINDOW_WIDTH, Consts.MAP_WINDOW_HEIGHT);

        if (this._camera.isResetting()) {
            if (this._camera.getPreviousPosition() !== null) {
                var cpPartsPrev = this._camera.getPreviousPosition().getPartsCoord();
                var cpOffsetPrev = this._camera.getPreviousPosition().getOffsetCoord();
            }
            yLimit = this._camera.getTransitionStepNum() * Consts.CHIP_SIZE;

            this._drawMap(cpPartsPrev, cpOffsetPrev, yLimit, true);
            this._drawPlayer(cpPartsPrev, cpOffsetPrev, yLimit, true);
            this._drawObjects(cpPartsPrev, cpOffsetPrev, yLimit, true);
            if (this._camera.isFinalStep()) {
                var opacity = 255;
                var timer = setInterval((): void => {
                    var elm = util.$id("wwa-fader");
                    opacity -= Consts.FADEOUT_SPEED * 3;
                    if (opacity <= 0) {
                        clearInterval(timer);
                        elm.style.backgroundColor = "transparent";
                        elm.removeAttribute("style");
                        elm.style.display = "none";
                        return;
                    }
                    elm.style.opacity = (opacity / 255) + "";
                }, 20);

            }
        }

        this._drawMap(cpParts, cpOffset, yLimit);
        this._drawPlayer(cpParts, cpOffset, yLimit);
        this._drawObjects(cpParts, cpOffset, yLimit);

        // 攻撃エフェクト描画
        if (this._player.isFighting() && !this._player.isBattleStartFrame()) {
            targetX = this._player.isTurn() ? this._monster.position.x : ppos.x;
            targetY = this._player.isTurn() ? this._monster.position.y : ppos.y;

            this._cgManager.drawCanvas(
                this._battleEffectCoord.x, this._battleEffectCoord.y,
                Consts.CHIP_SIZE * (targetX - cpParts.x) - cpOffset.x,
                Consts.CHIP_SIZE * (targetY - cpParts.y) - cpOffset.y,
                false);
        }
        this._drawEffect();
        this._drawFaces();
        this._drawFrame();

    }

    // 背景描画
    private _drawMap(cpParts: Coord, cpOffset: Coord, yLimit: number, isPrevCamera: boolean = false): void {
        if (cpParts === void 0) {
            return;
        }
        var xLeft = Math.max(0, cpParts.x - 1);
        var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW);
        var yTop = Math.max(0, cpParts.y - 1);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW);
        var count: number, drawFlag: boolean;
        drawFlag = false;
        count = 0;

        if (isPrevCamera) {
            for (var x: number = xLeft; x <= xRight; x++) {
                for (var y: number = yTop; y <= yBottom; y++) {
                    var partsID: number = this._wwaData.map[y][x];
                    var ppx = this._wwaData.mapAttribute[partsID][Consts.ATR_X] / Consts.CHIP_SIZE;
                    var ppy = this._wwaData.mapAttribute[partsID][Consts.ATR_Y] / Consts.CHIP_SIZE;
                    var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) - cpOffset.x;
                    var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) - cpOffset.y;
                    this._cgManager.drawCanvasWithLowerYLimit(ppx, ppy, canvasX, canvasY, yLimit);
                }
            }
        } else {
            for (var x: number = xLeft; x <= xRight; x++) {
                for (var y: number = yTop; y <= yBottom; y++) {
                    var partsID: number = this._wwaData.map[y][x];
                    if (this._cgManager.mapCache[count] !== partsID) {
                        this._cgManager.mapCache[count] = partsID;
                        drawFlag = true;
                    }
                    count++;
                }
            }
            if (yLimit !== this._cgManager.mapCacheYLimit) {
                //yLimitが異なるために再描画
                this._cgManager.mapCacheYLimit = yLimit;
                drawFlag = true;
            }
            if ((cpParts.x !== this._cgManager.cpPartsLog.x) || (cpParts.y !== this._cgManager.cpPartsLog.y)) {
                //cpParts座標が変わったため再描画
                this._cgManager.cpPartsLog.x = cpParts.x;
                this._cgManager.cpPartsLog.y = cpParts.y;
                drawFlag = true;
            }

            if (drawFlag) {
                //バックキャンバスをクリア
                this._cgManager.clearBackCanvas();
                //バックキャンバスに背景を描画
                for (var x: number = xLeft; x <= xRight; x++) {
                    for (var y: number = yTop; y <= yBottom; y++) {
                        var partsID: number = this._wwaData.map[y][x];
                        var ppx = this._wwaData.mapAttribute[partsID][Consts.ATR_X] / Consts.CHIP_SIZE;
                        var ppy = this._wwaData.mapAttribute[partsID][Consts.ATR_Y] / Consts.CHIP_SIZE;
                        var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) - cpOffset.x;
                        var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) - cpOffset.y;
                        this._cgManager.copyBackCanvasWithUpperYLimit(ppx, ppy, canvasX, canvasY, yLimit);
                    }
                }
            }
            //バックキャンバスをメインキャンバスに描画
            this._cgManager.drawBackCanvas();
        }
    }

    // プレイヤー描画
    private _drawPlayer(cpParts: Coord, cpOffset: Coord, yLimit: number, isPrevCamera: boolean = false): void {
        if (cpParts === void 0 || this._wwaData.delPlayerFlag) {
            return;
        }
        var pos: Coord = this._player.getPosition().getPartsCoord();
        var poso: Coord = this._player.getPosition().getOffsetCoord();
        var relpcrop: number = dirToPos[this._player.getDir()];
        var canvasX = (pos.x - cpParts.x) * Consts.CHIP_SIZE + poso.x - cpOffset.x;
        var canvasY = (pos.y - cpParts.y) * Consts.CHIP_SIZE + poso.y - cpOffset.y;
        var dx = Math.abs(poso.x);
        var dy = Math.abs(poso.y);
        var dir = this._player.getDir();
        var crop: number;
        var dirChanger = [2, 3, 4, 5, 0, 1, 6, 7];

        if (this._player.isLookingAround() && !this._player.isWaitingMessage()) {
            crop = this._wwaData.playerImgPosX + dirChanger[Math.floor(this._mainCallCounter % 64 / 8)];
        } else if (this._player.isMovingImage()) {
            crop = this._wwaData.playerImgPosX + relpcrop + 1;
        } else {
            crop = this._wwaData.playerImgPosX + relpcrop;
        }
        if (isPrevCamera) {
            this._cgManager.drawCanvasWithLowerYLimit(crop, this._wwaData.playerImgPosY, canvasX, canvasY, yLimit);
        } else {
            this._cgManager.drawCanvasWithUpperYLimit(crop, this._wwaData.playerImgPosY, canvasX, canvasY, yLimit);
        }
    }

    // 物体描画
    private _drawObjects(cpParts: Coord, cpOffset: Coord, yLimit: number, isPrevCamera: boolean = false): void {
        if (cpParts === void 0) {
            return;
        }
        var xLeft = Math.max(0, cpParts.x - 1);
        var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW);
        var yTop = Math.max(0, cpParts.y - 1);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW);
        var offset: Coord;
        // 画面内物体描画
        for (var x: number = xLeft; x <= xRight; x++) {
            for (var y: number = yTop; y <= yBottom; y++) {
                if (this._player.isFighting() &&
                    this._player.isTurn() &&
                    this._player.getPosition().getPartsCoord().equals(this._monster.position) &&
                    new Coord(x, y).equals(this._monster.position)) {
                    continue;
                }
                var partsIDObj: number = this._wwaData.mapObject[y][x];
                offset = new Coord(0, 0);
                if (this._wwaData.objectAttribute[partsIDObj][Consts.ATR_MOVE] !== MoveType.STATIC) {
                    var result = this._objectMovingDataManager.getOffsetByBeforePartsCoord(new Coord(x, y));
                    if (result !== null) {
                        offset = result;
                    }
                }
                var imgType: boolean = (
                    this._animationCounter > Consts.ANIMATION_REP_HALF_FRAME ||
                    this._wwaData.objectAttribute[partsIDObj][Consts.ATR_X2] === 0 &&
                    this._wwaData.objectAttribute[partsIDObj][Consts.ATR_Y2] === 0
                );
                var ppxo =
                    this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_X : Consts.ATR_X2] / Consts.CHIP_SIZE;
                var ppyo =
                    this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_Y : Consts.ATR_Y2] / Consts.CHIP_SIZE;
                var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) + offset.x - cpOffset.x;
                var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) + offset.y - cpOffset.y;
                var type = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_TYPE];
                var num = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_NUMBER];
                if (partsIDObj !== 0 && !this._checkNoDrawObject(new Coord(x, y), type, num)) {
                    if (isPrevCamera) {
                        this._cgManager.drawCanvasWithLowerYLimit(ppxo, ppyo, canvasX, canvasY, yLimit);
                    } else {
                        this._cgManager.drawCanvasWithUpperYLimit(ppxo, ppyo, canvasX, canvasY, yLimit);
                    }
                }
            }
        }

    }

    private _drawEffect(): void {
        if (this._wwaData.effectCoords.length === 0 || this._wwaData.effectWaits === 0) {
            return;
        }
        var i = Math.floor(this._mainCallCounter % (this._wwaData.effectCoords.length * this._wwaData.effectWaits) / this._wwaData.effectWaits);
        for (var y = 0; y < Consts.V_PARTS_NUM_IN_WINDOW; y++) {
            for (var x = 0; x < Consts.H_PARTS_NUM_IN_WINDOW; x++) {
                if (!this._wwaData.effectCoords[i]) {
                    continue;
                }
                this._cgManager.drawCanvas(
                    this._wwaData.effectCoords[i].x,
                    this._wwaData.effectCoords[i].y,
                    x * Consts.CHIP_SIZE,
                    y * Consts.CHIP_SIZE, false);
            }
        }
    }

    private _drawFaces(): void {
        for (var i = 0; i < this._faces.length; i++) {
            this._cgManager.drawCanvasWithSize(
                this._faces[i].srcPos.x, this._faces[i].srcPos.y,
                this._faces[i].srcSize.x, this._faces[i].srcSize.y,
                this._faces[i].destPos.x, this._faces[i].destPos.y,
                false
            );
        }
    }

    private _drawFrame(): void {
        this._cgManager.drawFrame();
    }

    private _checkNoDrawObject(objCoord: Coord, objType: number, atrNumber: number): boolean {
        var pPos: Position = this._player.getPosition();
        var pCoord: Coord = pPos.getPartsCoord();
        if (!pPos.isJustPosition() || pCoord.x !== objCoord.x || pCoord.y !== objCoord.y || this._wwaData.objectNoCollapseDefaultFlag) {
            return false;
        }
        if (objType === Consts.OBJECT_DOOR && atrNumber === 0) {
            return true;
        }
        return (
            objType === Consts.OBJECT_STATUS || objType === Consts.OBJECT_MESSAGE ||
            objType === Consts.OBJECT_ITEM || objType === Consts.OBJECT_SELL ||
            objType === Consts.OBJECT_BUY || objType === Consts.OBJECT_SELL ||
            objType === Consts.OBJECT_LOCALGATE
        );
    }

    public getMapWidth(): number {
        if (this._wwaData === void 0) {
            throw new Error("マップデータがロードされていません");
        }
        return this._wwaData.mapWidth;
    }

    public getMapIdByPosition(pos: Position): number {
        var pc = pos.getPartsCoord();
        return this._wwaData.map[pc.y][pc.x];
    }

    public getObjectIdByPosition(pos: Position): number {
        var pc = pos.getPartsCoord();
        return this._wwaData.mapObject[pc.y][pc.x];
    }

    public getMapTypeByPosition(pos: Position): number {
        var pc = pos.getPartsCoord();
        var pid = this._wwaData.map[pc.y][pc.x];
        return this._wwaData.mapAttribute[pid][Consts.ATR_TYPE];
    }

    public getObjectTypeByPosition(pos: Position): number {
        var pc = pos.getPartsCoord();
        var pid = this._wwaData.mapObject[pc.y][pc.x];
        return this._wwaData.objectAttribute[pid][Consts.ATR_TYPE];
    }

    public getMapAttributeByPosition(pos: Position, attr: number) {
        var pc = pos.getPartsCoord();
        var pid = this._wwaData.map[pc.y][pc.x];
        return this._wwaData.mapAttribute[pid][attr];
    }

    public isCurrentPosMapPartsIncludingMessage(pos: Position): boolean {
        var mesid = this.getMapAttributeByPosition(pos, Consts.ATR_STRING);
        return mesid !== 0;
    }

    public getObjectAttributeByPosition(pos: Position, attr: number) {
        var pc = pos.getPartsCoord();
        var pid = this._wwaData.mapObject[pc.y][pc.x];
        return this._wwaData.objectAttribute[pid][attr];
    }

    public getMapAttributeById(id: number, attr: number) {
        return this._wwaData.mapAttribute[id][attr];
    }

    public getObjectAttributeById(id: number, attr: number) {
        return this._wwaData.objectAttribute[id][attr];
    }

    public getObjectCropXById(id: number): number {
        return this._wwaData.objectAttribute[id][Consts.ATR_X];
    }
    public getObjectCropYById(id: number): number {
        return this._wwaData.objectAttribute[id][Consts.ATR_Y];
    }

    public getMessageById(messageID: number): string {
        return this._wwaData.message[messageID];
    }

    public getSystemMessageById(messageID: number): string {
        return this._wwaData.systemMessage[messageID];
    }

    // 背景パーツ判定
    public checkMap(pos?: Coord): boolean {
        var playerPos = this._player.getPosition().getPartsCoord();
        pos = (pos !== void 0 && pos !== null) ? pos : playerPos;
        var partsID: number = this._wwaData.map[pos.y][pos.x];
        var mapAttr: number = this._wwaData.mapAttribute[partsID][Consts.ATR_TYPE];
        var isPlayerPositionExec = (pos.x === playerPos.x && pos.y === playerPos.y);
        var eventExecuted: boolean = false;
        if (isPlayerPositionExec) {
            if (this._player.getLastExecPartsIDOnSamePosition(PartsType.MAP) === partsID) {
                return false;
            }
        }
        // 道
        if (mapAttr === Consts.MAP_STREET) {
            eventExecuted = this._execMapStreetEvent(pos, partsID, mapAttr);
            // 壁
        } else if (mapAttr === Consts.MAP_WALL) {
            eventExecuted = this._execMapWallEvent(pos, partsID, mapAttr);
            // ジャンプゲート
        } else if (mapAttr === Consts.MAP_LOCALGATE) {
            eventExecuted = this._execMapLocalGateEvent(pos, partsID, mapAttr);
            // URLゲート
        } else if (mapAttr === Consts.MAP_URLGATE) {
            eventExecuted = this._execMapUrlGateEvent(pos, partsID, mapAttr);
        }

        if (isPlayerPositionExec && !this._player.isJumped()) {
            this._player.setLastExecInfoOnSamePosition(PartsType.MAP, partsID);
        }
        return eventExecuted;

    }

    // 物体パーツ判定
    public checkObject(pos?: Coord): void {
        var playerPos = this._player.getPosition().getPartsCoord();
        pos = (pos !== void 0 && pos !== null) ? pos : playerPos;
        var partsID: number = this._wwaData.mapObject[pos.y][pos.x];
        var objAttr: number = this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE];
        var isPlayerPositionExec = (pos.x === playerPos.x && pos.y === playerPos.y);
        if (isPlayerPositionExec) {
            if (this._player.getLastExecPartsIDOnSamePosition(PartsType.OBJECT) === partsID) {
                return;
            }
        }

        // 通常物体
        if (objAttr === Consts.OBJECT_NORMAL) {
            this._execObjectNormalEvent(pos, partsID, objAttr);
            // メッセージ
        } else if (objAttr === Consts.OBJECT_MESSAGE) {
            this._execObjectMessageEvent(pos, partsID, objAttr);
            // モンスター
        } else if (objAttr === Consts.OBJECT_MONSTER) {
            this._execObjectMonsterEvent(pos, partsID, objAttr);
            // アイテム
        } else if (objAttr === Consts.OBJECT_ITEM) {
            this._execObjectItemEvent(pos, partsID, objAttr);
            // 扉
        } else if (objAttr === Consts.OBJECT_DOOR) {
            this._execObjectDoorEvent(pos, partsID, objAttr);
            // ステータス変化
        } else if (objAttr === Consts.OBJECT_STATUS) {
            this._execObjectStatusEvent(pos, partsID, objAttr);
            // 物を買う
        } else if (objAttr === Consts.OBJECT_BUY) {
            this._execObjectBuyEvent(pos, partsID, objAttr);
            // 物を売る
        } else if (objAttr === Consts.OBJECT_SELL) {
            this._execObjectSellEvent(pos, partsID, objAttr);
            // URLゲート
        } else if (objAttr === Consts.OBJECT_URLGATE) {
            this._execObjectUrlGateEvent(pos, partsID, objAttr);
            // スコア表示
        } else if (objAttr === Consts.OBJECT_SCORE) {
            this._execObjectScoreEvent(pos, partsID, objAttr);
            // 二者択一
        } else if (objAttr === Consts.OBJECT_SELECT) {
            this._execObjectYesNoChoiceEvent(pos, partsID, objAttr);
            // ジャンプゲート
        } else if (objAttr === Consts.OBJECT_LOCALGATE) {
            this._execObjectLocalGateEvent(pos, partsID, objAttr);
        }

        if (isPlayerPositionExec && !this._player.isJumped()) {
            this._player.setLastExecInfoOnSamePosition(PartsType.OBJECT, partsID);
        }

    }

    private _execMapStreetEvent(pos: Coord, partsID: number, mapAttr: number): boolean {
        var itemID = this._wwaData.mapAttribute[partsID][Consts.ATR_ITEM];
        if (itemID !== 0 && !this._player.hasItem(itemID)) {
            return false;
        }

        this.appearParts(pos, AppearanceTriggerType.MAP);
        var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        // 待ち時間
        //this._waitTimeInCurrentFrame += this._wwaData.mapAttribute[partsID][Consts.ATR_NUMBER] * 100;
        this._waitFrame += this._wwaData.mapAttribute[partsID][Consts.ATR_NUMBER] * Consts.WAIT_TIME_FRAME_NUM;
        this._temporaryInputDisable = true;
        var messageDisplayed = this.setMessageQueue(message, false, false, partsID, PartsType.MAP, pos.clone());
        this.playSound(this._wwaData.mapAttribute[partsID][Consts.ATR_SOUND]);

        return messageID !== 0 && messageDisplayed;
    }

    private _execMapWallEvent(pos: Coord, partsID: number, mapAttr: number): boolean {
        var objID = this.getObjectIdByPosition(pos.convertIntoPosition(this));
        var objType = this.getObjectAttributeById(objID, Consts.ATR_TYPE);
        if (objID === 0 ||
            objType === Consts.OBJECT_NORMAL ||
            objType === Consts.OBJECT_DOOR && (
                !this._player.hasItem(this.getObjectAttributeById(objID, Consts.ATR_ITEM)) ||
                this.getObjectAttributeById(objType, Consts.ATR_MODE) === Consts.PASSABLE_OBJECT)) {

            this.appearParts(pos, AppearanceTriggerType.MAP);
            var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
            var message = this._wwaData.message[messageID];

            this.setMessageQueue(message, false, false, partsID, PartsType.MAP, pos.clone());
            this.playSound(this._wwaData.mapAttribute[partsID][Consts.ATR_SOUND]);
            return false;
        }
        return false;
    }

    private _execMapLocalGateEvent(pos: Coord, partsID: number, mapAttr: number): boolean {
        var playerPos = this._player.getPosition().getPartsCoord();

        // TODO: ジャンプ後のプレイヤーの向き 物体との処理共通化
        var jx = this._wwaData.mapAttribute[partsID][Consts.ATR_JUMP_X];
        var jy = this._wwaData.mapAttribute[partsID][Consts.ATR_JUMP_Y];
        if (jx > Consts.RELATIVE_COORD_LOWER) {
            jx = pos.x + jx - Consts.RELATIVE_COORD_BIAS;
        }
        if (jy > Consts.RELATIVE_COORD_LOWER) {
            jy = pos.y + jy - Consts.RELATIVE_COORD_BIAS;
        }
        this.appearParts(pos, AppearanceTriggerType.MAP);
        if (
            0 <= jx && 0 <= jy && jx < this._wwaData.mapWidth && jy < this._wwaData.mapWidth &&
            (jx !== playerPos.x || jy !== playerPos.y)
        ) {
            this._player.jumpTo(new Position(this, jx, jy, 0, 0));
            this.playSound(this._wwaData.mapAttribute[partsID][Consts.ATR_SOUND]);
            return true;
        }
        return false;

    }

    private _execMapUrlGateEvent(pos: Coord, partsID: number, mapAttr: number): boolean {
        var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
        if (!this._isURLGateEnable) {
            return true;
        }
        if (this._wwaData.message[SystemMessage1.ASK_LINK] === "BLANK") {
            location.href = util.$escapedURI(this._wwaData.message[messageID].split(/\s/g)[0])
            return;
        }
        this.setMessageQueue(
            this._wwaData.message[SystemMessage1.ASK_LINK] === "" ?
                "他のページにリンクします。\nよろしいですか？" :
                this._wwaData.message[SystemMessage1.ASK_LINK], true, true);
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_MAP_PARTS;
        this._yesNoURL = this._wwaData.message[messageID].split(/\s/g)[0];
        return true;
    }

    private _execObjectNormalEvent(pos: Coord, partsID: number, objAttr: number): void {
        // 何もしない
    }

    private _execObjectMessageEvent(pos: Coord, partsID: number, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var playerPos = this._player.getPosition().getPartsCoord();
        var soundID = this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND];

        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        }
        // 試験的に踏み潰し判定と処理の順序を入れ替えています。不具合があるようなら戻します。 150415
        this.setMessageQueue(message, false, false, partsID, PartsType.OBJECT, pos);
        // 待ち時間
        //this._waitTimeInCurrentFrame += this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER] * 100;
        this._waitFrame += this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER] * Consts.WAIT_TIME_FRAME_NUM;
        this._temporaryInputDisable = true;
        this.appearParts(pos, AppearanceTriggerType.OBJECT, partsID);

        this.playSound(soundID);
    }

    private _execObjectStatusEvent(pos: Coord, partsID: number, objAttr: number): void {
        var status = new Status(
            this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY],
            this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH],
            this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE],
            this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]
        );
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var pstatus = this._player.getStatusWithoutEquipments();

        // マイナス判定 ステータスがマイナスになる場合は、引かないこと！！
        if (status.strength > Consts.STATUS_MINUS_BORDER &&
            pstatus.strength < status.strength - Consts.STATUS_MINUS_BORDER ||
            status.defence > Consts.STATUS_MINUS_BORDER &&
            pstatus.defence < status.defence - Consts.STATUS_MINUS_BORDER ||
            status.gold > Consts.STATUS_MINUS_BORDER &&
            pstatus.gold < status.gold - Consts.STATUS_MINUS_BORDER) {

            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);

            // 前方パーツ重複実行防止
            this._keyStore.allClear();
            this._mouseStore.clear();
            return;
        }
        status.energy = status.energy > Consts.STATUS_MINUS_BORDER ?
            Consts.STATUS_MINUS_BORDER - status.energy : status.energy
        status.strength = status.strength > Consts.STATUS_MINUS_BORDER ?
            Consts.STATUS_MINUS_BORDER - status.strength : status.strength
        status.defence = status.defence > Consts.STATUS_MINUS_BORDER ?
            Consts.STATUS_MINUS_BORDER - status.defence : status.defence
        status.gold = status.gold > Consts.STATUS_MINUS_BORDER ?
            Consts.STATUS_MINUS_BORDER - status.gold : status.gold


        this._player.addStatusAll(status);
        this.setStatusChangedEffect(status);
        //  ゲームオーバー
        if (this._player.isDead() && this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY] !== 0) {
            this.gameover();
            return;
        }

        this.setMessageQueue(message, false, false, partsID, PartsType.OBJECT, pos.clone());


        //this._wwaData.mapObject[pos.y][pos.x] = 0;
        this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        this.appearParts(pos, AppearanceTriggerType.OBJECT, partsID);
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectMonsterEvent(pos: Coord, partsID: number, objAttr: number): void {
        var monsterImgCoord = new Coord(
            this._wwaData.objectAttribute[partsID][Consts.ATR_X],
            this._wwaData.objectAttribute[partsID][Consts.ATR_Y]);

        var monsterStatus = new Status(
            this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY],
            this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH],
            this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE],
            this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]);

        var monsterMessage = this._wwaData.message[
            this._wwaData.objectAttribute[partsID][Consts.ATR_STRING]];

        var monsterItemID = this._wwaData.objectAttribute[partsID][Consts.ATR_ITEM];

        this._monster = new Monster(
            partsID, pos, monsterImgCoord, monsterStatus, monsterMessage, monsterItemID,
            () => {
                this._monsterWindow.hide();
            });

        this._player.startBattleWith(this._monster);
        //↓待ち時間の前にやるのはよくないので、戦闘開始時にやります。
        //            this._monsterWindow.show();
    }

    private _execObjectBuyEvent(pos: Coord, partsID, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var playerPos = this._player.getPosition().getPartsCoord();

        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        }
        // 試験的に(ry
        this.setMessageQueue(message, true, false, partsID, PartsType.OBJECT, pos.clone());
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectSellEvent(pos: Coord, partsID, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var playerPos = this._player.getPosition().getPartsCoord();

        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        }
        // 試験的に(ry
        this.setMessageQueue(message, true, false, partsID, PartsType.OBJECT, pos.clone());
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectItemEvent(pos: Coord, partsID: number, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        try {
            var screenTopCoord = this._camera.getPosition().getScreenTopPosition().getPartsCoord();
            var screenXPixel = ( pos.x - screenTopCoord.x ) * Consts.CHIP_SIZE;
            var screenYPixel = ( pos.y - screenTopCoord.y ) * Consts.CHIP_SIZE;
            this._player.addItem(
                partsID, this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER], false,
                this._wwaData.isItemEffectEnabled ? {
                    screenPixelCoord: new Coord(screenXPixel, screenYPixel)
                } : undefined
            );
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
            if (this._wwaData.objectAttribute[partsID][Consts.ATR_MODE] !== 0) {
                // 使用型アイテム の場合は、処理は使用時です。
            } else {
                this.setMessageQueue(message, false, false, partsID, PartsType.OBJECT, pos.clone());
                this.appearParts(pos, AppearanceTriggerType.OBJECT, partsID);
            }
        } catch (e) {
            // これ以上、アイテムを持てません
            if (this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] !== "BLANK") {
                this.setMessageQueue(
                    this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] === "" ?
                        "これ以上、アイテムを持てません。" :
                        this._wwaData.systemMessage[SystemMessage2.FULL_ITEM], false, true);
            }

        }
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectDoorEvent(pos: Coord, partsID: number, objAttr: number): void {
        var itemID = this._wwaData.objectAttribute[partsID][Consts.ATR_ITEM];
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        if (this._player.hasItem(itemID)) {
            if (this._wwaData.objectAttribute[partsID][Consts.ATR_MODE] === 0) {
                this._player.removeItemByPartsID(itemID);
            }
            this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
            this.setMessageQueue(message, false, false, partsID, PartsType.OBJECT, pos.clone());
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
            this.appearParts(pos, AppearanceTriggerType.OBJECT, partsID);
            this._paintSkipByDoorOpen = true;
        }

    }

    private _execObjectYesNoChoiceEvent(pos: Coord, partsID: number, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var playerPos = this._player.getPosition().getPartsCoord();

        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        }
        // 試験(ry
        this.setMessageQueue(message, true, false, partsID, PartsType.OBJECT, pos.clone());
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_OBJECT_PARTS;

        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectLocalGateEvent(pos: Coord, partsID: number, mapAttr: number): void {
        var playerPos = this._player.getPosition().getPartsCoord();
        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        }
        // TODO: ジャンプ後のプレイヤーの向き 背景との処理共通化
        var jx = this._wwaData.objectAttribute[partsID][Consts.ATR_JUMP_X];
        var jy = this._wwaData.objectAttribute[partsID][Consts.ATR_JUMP_Y];
        if (jx > Consts.RELATIVE_COORD_LOWER) {
            jx = playerPos.x + jx - Consts.RELATIVE_COORD_BIAS;
        }
        if (jy > Consts.RELATIVE_COORD_LOWER) {
            jy = playerPos.y + jy - Consts.RELATIVE_COORD_BIAS;
        }
        this.appearParts(pos, AppearanceTriggerType.OBJECT, partsID);
        if (
            0 <= jx && 0 <= jy && jx < this._wwaData.mapWidth && jy < this._wwaData.mapWidth &&
            (jx !== playerPos.x || jy !== playerPos.y)
        ) {
            this._player.jumpTo(new Position(this, jx, jy, 0, 0));
            this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
        }

    }

    private _execObjectUrlGateEvent(pos: Coord, partsID: number, mapAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        if (!this._isURLGateEnable) {
            return;
        }
        if (this._wwaData.message[SystemMessage1.ASK_LINK] === "BLANK") {
            location.href = util.$escapedURI(this._wwaData.message[messageID].split(/\s/g)[0]);
            return;
        }
        this.setMessageQueue(
            this._wwaData.message[SystemMessage1.ASK_LINK] === "" ?
                "他のページにリンクします。\nよろしいですか？" :
                this._wwaData.message[SystemMessage1.ASK_LINK], true, true);
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
        this._yesNoURL = this._wwaData.message[messageID].split(/\s/g)[0];
    }

    /**
     * 物体パーツ「スコア表示」のイベントを実行します
     * 
     * 動作仕様
     * 
     *  - メッセージが空の場合は「スコアを表示します。」というメッセージとともにスコア表示がされる
     *  - メッセージがマクロのみの場合はマクロのみが実行され、スコアが表示されない
     *  - メッセージがある場合はそのメッセージとともにスコアが表示される
     * 
     * メッセージがマクロのみの場合の挙動は、Java版(v3.10)に準拠するためのものであり、将来変更される可能性があります。
     *
     * @param pos パーツの座標
     * @param partsID パーツの物体番号
     * @param mapAttr パーツの ATR_TYPE の値
     */
    private _execObjectScoreEvent(pos: Coord, partsID: number, mapAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        const rawMessage = messageID === 0 ? "スコアを表示します。" : this._wwaData.message[messageID];
        const messageQueue = this.getMessageQueueByRawMessage(rawMessage, partsID, PartsType.OBJECT, pos);
        const existsMessage = messageQueue.reduce((existsMessageBefore, messageInfo) => existsMessageBefore || !!messageInfo.message, false);
        if (existsMessage) {
            const score = this._player.getStatus().calculateScore({
                energy: this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY],
                strength: this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH],
                defence: this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE],
                gold: this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]
            });
            this._scoreWindow.update(score);
            this._scoreWindow.show();
        }
        this.setMessageQueue(rawMessage, false, false, partsID, PartsType.OBJECT, pos);
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);

    }

    private _execChoiceWindowRunningEvent() {
        var partsType: number;
        var gold: number;
        if (--this._yesNoDispCounter === 0) {
            if (this._yesNoJudge === YesNoState.YES) {
                if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_MAP_PARTS) {
                    partsType = this._wwaData.mapAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.MAP_URLGATE) {
                        location.href = util.$escapedURI(this._yesNoURL);
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_OBJECT_PARTS) {
                    partsType = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.OBJECT_BUY) {
                        if (this._player.hasItem(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM])) {
                            this._player.removeItemByPartsID(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM]);
                            gold = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD];
                            this._player.earnGold(gold);
                            this.setStatusChangedEffect(new Status(0, 0, 0, gold));
                            this.appearParts(this._yesNoChoicePartsCoord, AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                        } else {
                            // アイテムを持っていない
                            if (this._wwaData.message[SystemMessage1.NO_ITEM] !== "BLANK") {
                                this._messageQueue.push(new MessageInfo(
                                    this._wwaData.message[SystemMessage1.NO_ITEM] === "" ?
                                        "アイテムを持っていない。" : this._wwaData.message[SystemMessage1.NO_ITEM],
                                    true)
                                );
                            };
                        }
                    } else if (partsType === Consts.OBJECT_SELL) {
                        if (this._player.hasGold(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD])) {
                            if (this._player.canHaveMoreItems() || this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM] === 0) {
                                if (this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM] !== 0) {
                                    var pos = this._yesNoChoicePartsCoord;
                                    var screenTopCoord = this._camera.getPosition().getScreenTopPosition().getPartsCoord();
                                    var screenXPixel = (pos.x - screenTopCoord.x) * Consts.CHIP_SIZE;
                                    var screenYPixel = (pos.y - screenTopCoord.y) * Consts.CHIP_SIZE;
                                    this._player.addItem(
                                        this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM], 0, false, this._wwaData.isItemEffectEnabled ? {
                                            screenPixelCoord: new Coord(screenXPixel, screenYPixel)
                                        } : undefined
                                    );
                                }
                                var status = new Status(
                                    this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ENERGY],
                                    this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_STRENGTH],
                                    this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_DEFENCE],
                                    - this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD] // 払うので、マイナスになります。
                                );
                                var pstatus = this._player.getStatusWithoutEquipments();

                                status.energy = status.energy > Consts.STATUS_MINUS_BORDER ?
                                    Consts.STATUS_MINUS_BORDER - status.energy : status.energy;
                                this.setStatusChangedEffect(status);
                                this._player.addStatusAll(status);

                                //  ゲームオーバー
                                if (this._player.isDead() && this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ENERGY] !== 0) {
                                    this.gameover();
                                    return;
                                }
                                this.appearParts(this._yesNoChoicePartsCoord, AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                            } else {
                                // アイテムをボックスがいっぱい
                                if (this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] !== "BLANK") {
                                    this._messageQueue.push(
                                        new MessageInfo(
                                            this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] === "" ?
                                                "これ以上、アイテムを持てません。" : this._wwaData.systemMessage[SystemMessage2.FULL_ITEM],
                                            true
                                        )
                                    );
                                }
                            }
                        } else {
                            // 所持金が足りない
                            if (this._wwaData.message[SystemMessage1.NO_MONEY] !== "BLANK") {
                                this._messageQueue.push(
                                    new MessageInfo(
                                        this._wwaData.message[SystemMessage1.NO_MONEY] === "" ?
                                            "所持金がたりない。" : this._wwaData.message[SystemMessage1.NO_MONEY],
                                        true
                                    )
                                );
                            }
                        }

                    } else if (partsType === Consts.OBJECT_SELECT) {
                        this.appearParts(this._yesNoChoicePartsCoord, AppearanceTriggerType.CHOICE_YES, this._yesNoChoicePartsID);
                    } else if (partsType === Consts.OBJECT_URLGATE) {
                        location.href = util.$escapedURI(this._yesNoURL);
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_ITEM_USE) {
                    this._player.readyToUseItem(this._yesNoUseItemPos);
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_LOAD) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    this._stopUpdateByLoadFlag = true;
                    this._loadType = LoadType.QUICK_LOAD;
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._quickSave();
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_RESTART_GAME) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.RESTART_GAME]))).classList.remove("onpress");
                    this._stopUpdateByLoadFlag = true;
                    this._loadType = LoadType.RESTART_GAME;
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_END_GAME) {
                    // @ts-ignore
                    window.history.back(-1);
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_GOTO_WWA) {
                    location.href = util.$escapedURI(Consts.WWA_HOME);
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_PASSWORD_LOAD) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    this._player.setPasswordWindowWating();
                    this._passwordWindow.show(Mode.LOAD);
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_PASSWORD_SAVE) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._player.setPasswordWindowWating();
                    this._passwordWindow.password = this._quickSave(true);
                    this._passwordWindow.show(Mode.SAVE);
                }
                this._yesNoJudge = YesNoState.UNSELECTED;
                this._setNextMessage();

                this._yesNoChoicePartsCoord = void 0;
                this._yesNoChoicePartsID = void 0;
                this._yesNoUseItemPos = void 0;
                this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
                this._messageWindow.setYesNoChoice(false);

            } else if (this._yesNoJudge === YesNoState.NO) {

                if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_MAP_PARTS) {
                    partsType = this._wwaData.mapAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.MAP_URLGATE) {

                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_OBJECT_PARTS) {
                    partsType = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.OBJECT_BUY) {

                    } else if (partsType === Consts.OBJECT_SELL) {

                    } else if (partsType === Consts.OBJECT_SELECT) {
                        this.appearParts(this._yesNoChoicePartsCoord, AppearanceTriggerType.CHOICE_NO, this._yesNoChoicePartsID);
                    } else if (partsType === Consts.OBJECT_URLGATE) {

                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_ITEM_USE) {
                    var bg = <HTMLDivElement>(util.$id("item" + (this._yesNoUseItemPos - 1)));
                    bg.classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_LOAD) {
                    if (this._usePassword) {
                        this._yesNoJudge = YesNoState.UNSELECTED;
                        this.onpasswordloadcalled();
                        return;
                    } else {
                        (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                    if (this._usePassword) {
                        this._yesNoJudge = YesNoState.UNSELECTED;
                        this.onpasswordsavecalled();
                        return;
                    } else {
                        (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_RESTART_GAME) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.RESTART_GAME]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_END_GAME) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_GOTO_WWA) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_PASSWORD_LOAD) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_PASSWORD_SAVE) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                }

                this._yesNoJudge = YesNoState.UNSELECTED;
                this._setNextMessage();
                this._yesNoChoicePartsCoord = void 0;
                this._yesNoChoicePartsID = void 0;
                this._yesNoUseItemPos = void 0;
                this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
                this._messageWindow.setYesNoChoice(false);
            }
        }
    }

    public setMessageQueue(
        message: string,
        showChoice: boolean,
        isSystemMessage: boolean,
        partsID: number = 0,
        partsType: PartsType = PartsType.OBJECT,
        partsPosition: Coord = new Coord(0, 0),
        messageDisplayed: boolean = false
    ): boolean {
        this._messageQueue = this._messageQueue.concat(this.getMessageQueueByRawMessage(message, partsID, partsType, partsPosition));

        if (this._lastMessage.isEndOfPartsEvent && this._reservedMoveMacroTurn !== void 0) {
            this._player.setMoveMacroWaiting(this._reservedMoveMacroTurn);
            this._reservedMoveMacroTurn = void 0;
        }

        if (this._messageQueue.length !== 0) {
            var topmes = this._messageQueue.shift();
            for (var i = 0; i < topmes.macro.length; i++) {
                this._execMacroListInNextFrame.push(topmes.macro[i]);
            }
            /*
            if ( topmes.message === "" && topmes.isEndOfPartsEvent && this._reservedMoveMacroTurn !== void 0) {
            this._player.setMoveMacroWaiting(this._reservedMoveMacroTurn);
            this._reservedMoveMacroTurn = void 0;
            }
            */

            this._lastMessage = topmes;

            // set message
            if (topmes.message !== "") {
                this._messageWindow.setMessage(topmes.message);
                this._messageWindow.setYesNoChoice(showChoice);
                this._messageWindow.setPositionByPlayerPosition(
                    this._faces.length !== 0,
                    this._scoreWindow.isVisible(),
                    isSystemMessage,
                    this._player.getPosition(),
                    this._camera.getPosition()
                );
                this._player.setMessageWaiting();
                return true;
            } else {
                if (this._messageQueue.length === 0) {
                    this._hideMessageWindow(messageDisplayed);
                } else {
                    this._setNextMessage();
                }
            }
        }
        return false;
    }


    public getMessageQueueByRawMessage(
        message: string,
        partsID: number,
        partsType: PartsType,
        partsPosition: Coord,
        isSystemMessage: boolean = false): MessageInfo[] {

        // コメント削除
        var messageMain = message
            .split(/\n\<c\>/i)[0]
            .split(/\<c\>/i)[0]
            .replace(/\n\<p\>\n/ig, "<P>")
            .replace(/\n\<p\>/ig, "<P>")
            .replace(/\<p\>\n/ig, "<P>")
            .replace(/\<p\>/ig, "<P>");

        var messageQueue: MessageInfo[] = [];
        if (messageMain !== "") {
            var rawQueue = messageMain.split(/\<p\>/ig);
            for (var j = 0; j < rawQueue.length; j++) {
                var lines = rawQueue[j].split("\n");
                var linesWithoutMacro: string[] = [];
                var macroQueue: Macro[] = [];
                for (var i = 0; i < lines.length; i++) {
                    var matchInfo = lines[i].match(/(\$(?:[a-zA-Z_][a-zA-Z0-9_]*)\=(?:.*))/);
                    if (matchInfo !== null && matchInfo.length >= 2) {
                        var macro = parseMacro(this, partsID, partsType, partsPosition, matchInfo[1]);
                        // マクロのエンキュー (最も左のものを対象とする。)
                        // それ以外のメッセージ、マクロは一切エンキューしない。(原作どおり)
                        // なので、「あああ$map=1,1,1」の「あああ」は表示されず、map文だけが処理される。
                        macroQueue.push(macro);

                        // 行頭コメントはpushしない
                    } else if (!lines[i].match(/^\$/)) {
                        linesWithoutMacro.push(lines[i]);
                    }
                }
                messageQueue.push(new MessageInfo(linesWithoutMacro.join("\n"), isSystemMessage, j === rawQueue.length - 1, macroQueue));
            }
        }
        return messageQueue;
    }

    public appearParts(pos: Coord, triggerType: AppearanceTriggerType, triggerPartsID: number = 0): void {
        var triggerPartsType: PartsType;
        var rangeMin: number = (triggerType === AppearanceTriggerType.CHOICE_NO) ?
            Consts.APPERANCE_PARTS_MIN_INDEX_NO : Consts.APPERANCE_PARTS_MIN_INDEX;
        var rangeMax: number = (triggerType === AppearanceTriggerType.CHOICE_YES) ?
            Consts.APPERANCE_PARTS_MAX_INDEX_YES : Consts.APPERANCE_PARTS_MAX_INDEX;
        var targetPartsID: number;
        var targetPartsType: PartsType;
        var targetX: number;
        var targetY: number;
        var targetPos: Position;
        var i: number;

        if (triggerType === AppearanceTriggerType.MAP) {
            triggerPartsID = (triggerPartsID === 0) ? this._wwaData.map[pos.y][pos.x] : triggerPartsID;
            triggerPartsType = PartsType.MAP;
        } else {
            triggerPartsID = (triggerPartsID === 0) ? this._wwaData.mapObject[pos.y][pos.x] : triggerPartsID;
            triggerPartsType = PartsType.OBJECT;
        }

        for (i = rangeMin; i <= rangeMax; i++) {
            var base = Consts.ATR_APPERANCE_BASE + i * Consts.REL_ATR_APPERANCE_UNIT_LENGTH;
            var idxID = base + Consts.REL_ATR_APPERANCE_ID;
            var idxX = base + Consts.REL_ATR_APPERANCE_X;
            var idxY = base + Consts.REL_ATR_APPERANCE_Y;
            var idxType = base + Consts.REL_ATR_APPERANCE_TYPE;

            targetPartsID = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxID] :
                this._wwaData.objectAttribute[triggerPartsID][idxID];
            targetPartsType = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxType] :
                this._wwaData.objectAttribute[triggerPartsID][idxType];
            targetX = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxX] :
                this._wwaData.objectAttribute[triggerPartsID][idxX];
            targetY = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxY] :
                this._wwaData.objectAttribute[triggerPartsID][idxY];

            if (targetX === Consts.PLAYER_COORD) {
                targetX = this._player.getPosition().getPartsCoord().x
                this._player.resetEventExecutionInfo();
            } else if (targetX > Consts.RELATIVE_COORD_LOWER) {
                targetX = pos.x + targetX - Consts.RELATIVE_COORD_BIAS;
            }

            if (targetY === Consts.PLAYER_COORD) {
                targetY = this._player.getPosition().getPartsCoord().y
                this._player.resetEventExecutionInfo();
            } else if (targetY > Consts.RELATIVE_COORD_LOWER) {
                targetY = pos.y + targetY - Consts.RELATIVE_COORD_BIAS;
            }

            if (targetX === 0 && targetY === 0) {
                continue;
            }
            try {
                targetPos = new Position(this, targetX, targetY, 0, 0);
                if (targetPartsType === PartsType.MAP) {
                    if (targetPartsID >= this._wwaData.mapPartsMax) {
                        throw new Error("背景パーツの範囲外IDが指定されました");
                    }
                    //this._wwaData.map[targetY][targetX] = targetPartsID;
                    var cand: Coord = new Coord(targetX, targetY);
                    this.setPartsOnPosition(PartsType.MAP, targetPartsID, cand);
                } else {
                    if (targetPartsID >= this._wwaData.objPartsMax) {
                        throw new Error("物体パーツの範囲外IDが指定されました");
                    }
                    //this._wwaData.mapObject[targetY][targetX] = targetPartsID;
                    var cand: Coord = new Coord(targetX, targetY);
                    this.setPartsOnPosition(PartsType.OBJECT, targetPartsID, cand);
                    this._replaceRandomObject(new Coord(targetX, targetY));
                    if (targetX === this._player.getPosition().getPartsCoord().x &&
                        targetY === this._player.getPosition().getPartsCoord().y) {
                        this._player.setPartsAppearedFlag();
                    }
                }
            } catch (e) {
                // 範囲外座標の場合と範囲外IDの場合はパーツ指定がなかったことにする。
            }

        }

    }
    public appearPartsByDirection(
        distance: number,
        targetPartsID: number,
        targetPartsType: PartsType
    ): void {
        var ppos = this._player.getPosition().getPartsCoord();
        var pdir = this._player.getDir();
        var signX = vx[pdir];
        var signY = vy[pdir];

        this.appearPartsEval(
            ppos,
            (signX >= 0 ? "+" : "-") + (Math.abs(signX) * distance),
            (signY >= 0 ? "+" : "-") + (Math.abs(signY) * distance),
            targetPartsID,
            targetPartsType
        );

    }


    public appearPartsEval(
        triggerPartsPos: Coord,
        xstr: string,
        ystr: string,
        targetPartsID: number,
        targetPartsType: PartsType
    ): void {

        var targetX: number;
        var targetY: number;
        var ppos = this._player.getPosition().getPartsCoord();
        if (xstr === "P" || xstr === "p") {
            targetX = ppos.x;
        } else if (xstr[0] === "+") {
            targetX = triggerPartsPos.x + parseInt(xstr.substr(1));
        } else if (xstr[0] === "-") {
            targetX = triggerPartsPos.x - parseInt(xstr.substr(1));
        } else {
            targetX = parseInt(xstr);
            if (isNaN(targetX)) {
                throw new Error("座標として解釈できない文字が含まれています。");
            }
        }

        if (ystr === "P" || ystr === "p") {
            targetY = ppos.y;
        } else if (ystr[0] === "+") {
            targetY = triggerPartsPos.y + parseInt(ystr.substr(1));
        } else if (ystr[0] === "-") {
            targetY = triggerPartsPos.y - parseInt(ystr.substr(1));
        } else {
            targetY = parseInt(ystr);
            if (isNaN(targetY)) {
                throw new Error("座標として解釈できない文字が含まれています。");
            }
        }
        //    ↑ここまでの例外はマクロ無効化が目的

        try {
            var targetPos = new Position(this, targetX, targetY, 0, 0); // 範囲外は止める用
            if (targetPartsType === PartsType.MAP) {
                if (targetPartsID >= this._wwaData.mapPartsMax) {
                    throw new Error("背景パーツの範囲外IDが指定されました");
                }
                var cand: Coord = new Coord(targetX, targetY);
                this.setPartsOnPosition(PartsType.MAP, targetPartsID, cand);
            } else {
                if (targetPartsID >= this._wwaData.objPartsMax) {
                    throw new Error("物体パーツの範囲外IDが指定されました");
                }
                var cand: Coord = new Coord(targetX, targetY);
                this.setPartsOnPosition(PartsType.OBJECT, targetPartsID, cand);
                this._replaceRandomObject(new Coord(targetX, targetY));
                if (targetX === this._player.getPosition().getPartsCoord().x &&
                    targetY === this._player.getPosition().getPartsCoord().y) {
                    this._player.setPartsAppearedFlag();
                }
            }
        } catch (e) {
            // 範囲外座標の場合と範囲外IDの場合はパーツ指定がなかったことにする。
        }
    }

    private _replaceRandomObject(pos: Coord): void {
        var id = this._wwaData.mapObject[pos.y][pos.x];
        var type = this._wwaData.objectAttribute[id][Consts.ATR_TYPE];
        var newId: number;
        var randv: number;

        if (type !== Consts.OBJECT_RANDOM) {
            return;
        }
        for (var i = 0; i < Consts.RANDOM_ITERATION_MAX; i++) {
            randv = Math.floor(Math.random() * 10);
            newId = this._wwaData.objectAttribute[id][Consts.ATR_RANDOM_BASE + randv];
            if (newId >= this._wwaData.objPartsMax) {
                newId = 0;
                break;
            }
            if (this._wwaData.objectAttribute[newId][Consts.ATR_TYPE] !== Consts.OBJECT_RANDOM) {
                break;
            }
            id = newId;

        }
        this.setPartsOnPosition(PartsType.OBJECT, newId, pos);
    }

    private _replaceRandomObjectsInScreen(): void {
        var camPos = this._camera.getPosition().getPartsCoord();
        var xLeft = Math.max(0, camPos.x - 1);
        var xRight = Math.min(this._wwaData.mapWidth - 1, camPos.x + Consts.H_PARTS_NUM_IN_WINDOW);
        var yTop = Math.max(0, camPos.y - 1);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, camPos.y + Consts.V_PARTS_NUM_IN_WINDOW);
        for (var x = xLeft; x <= xRight; x++) {
            for (var y = yTop; y < yBottom; y++) {
                this._replaceRandomObject(new Coord(x, y));
            }
        }

    }

    private _replaceAllRandomObjects(): void {
        for (var x = 0; x < this._wwaData.mapWidth; x++) {
            for (var y = 0; y < this._wwaData.mapWidth; y++) {
                this._replaceRandomObject(new Coord(x, y));
            }
        }
    }

    public gameover() {
        var jx = this._wwaData.gameoverX;
        var jy = this._wwaData.gameoverY;
        if (this._messageWindow.isVisible()) {
            this._yesNoJudge = YesNoState.UNSELECTED;
            this._messageQueue = []; // force clear!!
            this._messageWindow.hide();
            this._yesNoChoicePartsCoord = void 0;
            this._yesNoChoicePartsID = void 0;
            this._yesNoUseItemPos = void 0;
            this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
            this._messageWindow.setYesNoChoice(false);
        }

        this._waitFrame = 0;
        this._temporaryInputDisable = true;
        this._player.jumpTo(new Position(this, jx, jy, 0, 0));
    }

    public setYesNoInput(yesNo: YesNoState): void {
        this._yesNoJudgeInNextFrame = yesNo;
    }

    public getYesNoState(): YesNoState {
        if (this._yesNoJudgeInNextFrame !== void 0) {
            return this._yesNoJudgeInNextFrame;
        }
        return this._yesNoJudge;
    }

    public setStatusChangedEffect(additionalStatus: EquipmentStatus) {
        if (!this._wwaData.isItemEffectEnabled) {
            return;
        }
        if (additionalStatus.strength !== 0) {
            util.$id("disp-strength").classList.add("onpress");
            this._statusPressCounter.strength = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
        }
        if (additionalStatus.defence !== 0) {
            util.$id("disp-defence").classList.add("onpress");
            this._statusPressCounter.defence = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
        }

        if (additionalStatus instanceof Status) {
            if ((<Status>additionalStatus).energy !== 0) {
                util.$id("disp-energy").classList.add("onpress");
                this._statusPressCounter.energy = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
            }
            if ((<Status>additionalStatus).gold !== 0) {
                util.$id("disp-gold").classList.add("onpress");
                this._statusPressCounter.gold = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
            }
        }
    }

    public setPartsOnPosition(partsType: PartsType, id: number, pos: Coord) {
        var before_id, no;
        var posKey = (pos.y << IDTable.BITSHIFT) | pos.x;
        if (partsType === PartsType.MAP) {
            before_id = this._wwaData.map[pos.y][pos.x];
            id = this.loadMapPartsID(id);
            before_id = this.loadMapPartsID(before_id);

            this._wwaData.map[pos.y][pos.x] = id;

            no = this._mapIDTable[before_id].indexOf(posKey);
            if (no !== -1) {
                this._mapIDTable[before_id].splice(no, 1);
            }
            no = this._mapIDTable[id].indexOf(posKey);
            if (no === -1) {
                this._mapIDTable[id].push(posKey);
            }

        } else {
            before_id = this._wwaData.mapObject[pos.y][pos.x];
            id = this.loadMapPartsObjectID(id);
            before_id = this.loadMapPartsObjectID(before_id);

            this._wwaData.mapObject[pos.y][pos.x] = id;

            no = this._mapObjectIDTable[before_id].indexOf(posKey);
            if (no !== -1) {
                this._mapObjectIDTable[before_id].splice(no, 1);
            }
            no = this._mapObjectIDTable[id].indexOf(posKey);
            if (no === -1) {
                this._mapObjectIDTable[id].push(posKey);
            }
        }
    }

    private _countSamePartsLength(data: number[], startPos: number): number {
        var i;
        for (i = startPos + 1; i < data.length; i++) {
            if (data[i] !== data[i - 1]) {
                break;
            }
        }
        return i - startPos;
    }

    private _compressMap(map: number[][]): number[][][] {
        var dest: number[][][] = [];
        for (var y = 0; y < map.length; y++) {
            dest[y] = [];
            for (var x = 0; x < map[y].length;) {
                var len = this._countSamePartsLength(map[y], x);
                dest[y].push([map[y][x], len]);
                x += (len);
            }
        }
        return dest;
    }

    private _decompressMap(compressedMap: number[][][]): number[][] {
        var dest: number[][] = [];
        var x: number;
        for (var y = 0; y < compressedMap.length; y++) {
            dest[y] = [];
            x = 0;
            for (var i = 0; i < compressedMap[y].length; i++) {
                var len = compressedMap[y][i][1]; // length
                for (var j = 0; j < len; j++) {
                    dest[y].push(compressedMap[y][i][0]) // parts id
                }
            }
        }
        return dest;
    }

    private _generateMapDataHash(data: WWAData): string {
        var text = "A";
        var len = 0;
        var x = 0;
        var y = 0;
        for (y = 0; y < data.map.length; y++) {
            for (x = 0; x < data.map[y].length;) {
                len = this._countSamePartsLength(data.map[y], x);
                text += (data.map[y][x] + "|" + len + "/");
                x += (len);
            }
            for (x = 0; x < data.mapObject[y].length;) {
                len = this._countSamePartsLength(data.mapObject[y], x);
                text += (data.mapObject[y][x] + "|" + len + "/");
                x += (len);
            }
        }
        for (var mapi = 0; mapi < data.mapAttribute.length; mapi++) {
            for (var mapatri = 0; mapatri < data.mapAttribute[mapi].length; mapatri++) {
                text += data.mapAttribute[mapi][mapatri] + "/";
            }
        }
        //            console.log( "B = "+ chksum );
        for (var obji = 0; obji < data.objectAttribute.length; obji++) {
            for (var objatri = 0; objatri < data.objectAttribute[obji].length; objatri++) {
                text += data.objectAttribute[obji][objatri] + "/";
            }
        }
        text += "Z";
        //            console.log( "C = " + chksum );
        return CryptoJS.MD5(text).toString();
    }

    private _generateSaveDataHash(data: WWAData): string {
        var maphash = this._generateMapDataHash(data);
        var text = maphash;
        var keyArray: string[] = [];
        for (var key in data) {
            if (key === "map" || key === "mapObject" ||
                key === "mapCompressed" || key === "mapObjectCompressed" ||
                key === "mapAttribute" || key === "objectAttribute" ||
                key === "checkString"
            ) {
                continue;
            }
            keyArray.push(key);
        }
        keyArray.sort();
        for (var i = 0; i < keyArray.length; i++) {
            text += util.arr2str4save(data[keyArray[i]]);
        }

        return CryptoJS.MD5(text).toString();
    }

    private _quickSave(isPassword: boolean = false): string {
        var qd = <WWAData>JSON.parse(JSON.stringify(this._wwaData));
        var pc = this._player.getPosition().getPartsCoord();
        var st = this._player.getStatusWithoutEquipments();
        qd.itemBox = this._player.getCopyOfItemBox();
        qd.playerX = pc.x;
        qd.playerY = pc.y;
        qd.statusEnergyMax = this._player.getEnergyMax();
        qd.statusEnergy = st.energy;
        qd.statusStrength = st.strength;
        qd.statusDefence = st.defence;
        qd.statusGold = st.gold;
        qd.moves = this._player.getMoveCount();
        if (isPassword) {
            qd.checkOriginalMapString = this._generateMapDataHash(this._restartData);
            qd.mapCompressed = this._compressMap(qd.map);
            qd.mapObjectCompressed = this._compressMap(qd.mapObject);
            qd.checkString = this._generateSaveDataHash(qd);

            // map, mapObjectについてはcompressから復元
            qd.map = void 0;
            qd.mapObject = void 0;
        }

        // message, mapAttribute, objectAttributeについてはrestartdataから復元
        // TODO: WWAEvalの機能などでrestart時から変更された場合は、差分をセーブするようにする予定
        qd.message = void 0;
        qd.mapAttribute = void 0;
        qd.objectAttribute = void 0;

        if (isPassword) {
            var s = JSON.stringify(qd);
            return CryptoJS.AES.encrypt(
                CryptoJS.enc.Utf8.parse(s),
                "^ /" + (this._wwaData.worldPassNumber * 231 + 8310 + qd.checkOriginalMapString) + "P+>A[]"
            ).toString();
        }
        this._quickSaveData = qd;
        util.$id("cell-load").textContent = "Quick Load";
        return "";
    }

    private _decodePassword(pass: string): WWAData {
        var ori = this._generateMapDataHash(this._restartData);
        try {
            var json = CryptoJS.AES.decrypt(
                pass,
                "^ /" + (this._wwaData.worldPassNumber * 231 + 8310 + ori) + "P+>A[]"
            ).toString(CryptoJS.enc.Utf8);
        } catch (e) {
            throw new Error("データが破損しています。\n" + e.message)
        }
        var obj: WWAData;
        try {
            obj = JSON.parse(json);
        } catch (e) {
            throw new Error("マップデータ以外のものが暗号化されたか、マップデータに何かが不足しているようです。\nJSON PARSE FAILED");
        }
        return obj;
    }

    private _quickLoad(restart: boolean = false, password: string = null, apply: boolean = true): WWAData {
        if (!restart && this._quickSaveData === void 0 && password === null) {
            throw new Error("セーブデータがありません。");
        }
        var newData: WWAData;
        if (password !== null) {
            newData = this._decodePassword(password);
        } else {
            newData = <WWAData>JSON.parse(JSON.stringify(restart ? this._restartData : this._quickSaveData));
        }
        // TODO: WWAEvalの属性変更対策, もう少しスマートなディープコピー方法考える
        newData.message = <string[]>JSON.parse(JSON.stringify(this._restartData.message));
        newData.mapAttribute = <number[][]>JSON.parse(JSON.stringify(this._restartData.mapAttribute));
        newData.objectAttribute = <number[][]>JSON.parse(JSON.stringify(this._restartData.objectAttribute));
        if (newData.map === void 0) {
            newData.map = this._decompressMap(newData.mapCompressed);
            newData.mapCompressed = void 0;
        }
        if (newData.mapObject === void 0) {
            newData.mapObject = this._decompressMap(newData.mapObjectCompressed);
            newData.mapObjectCompressed = void 0;
        }

        if (password !== null) {
            var checkString = this._generateSaveDataHash(newData);
            if (newData.checkString !== checkString) {
                throw new Error("データが壊れているようです。\nInvalid hash (ALL DATA)= " + newData.checkString + " " + this._generateSaveDataHash(newData));
            }
            var checkOriginalMapString = this._generateMapDataHash(this._restartData);
            if (newData.checkOriginalMapString !== checkOriginalMapString) {
                throw new Error("管理者によってマップが変更されたようです。\nInvalid hash (ORIGINAL MAP)= " + newData.checkString + " " + this._generateSaveDataHash(newData));
            }
            console.log("Valid Password!");
        }

        if (apply) {
            this._applyQuickLoad(newData);
        }
        return newData;
    }

    private _applyQuickLoad(newData: WWAData): void {
        this._player.setEnergyMax(newData.statusEnergyMax);
        this._player.setEnergy(newData.statusEnergy);
        this._player.setStrength(newData.statusStrength);
        this._player.setDefence(newData.statusDefence);
        this._player.setGold(newData.statusGold);
        this._player.setMoveCount(newData.moves);
        this._player.clearItemBox();
        for (var i = 0; i < newData.itemBox.length; i++) {
            this._player.addItem(newData.itemBox[i], i + 1, true);
        }

        this._player.systemJumpTo(new Position(this, newData.playerX, newData.playerY, 0, 0));
        if (newData.bgm === 0) {
            this.playSound(SystemSound.NO_SOUND);
        } else {
            this.playSound(newData.bgm);
        }
        this.setImgClick(new Coord(newData.imgClickX, newData.imgClickY));
        if (this.getObjectIdByPosition(this._player.getPosition()) !== 0) {
            this._player.setPartsAppearedFlag();
        }
        this._wwaData = newData;
        this._mapIDTableCreate();
        this._replaceAllRandomObjects();
        this.updateCSSRule();
    }
    private _mapIDTableCreate(): void {
        var pid: number;
        this._mapIDTable = [];
        this._mapObjectIDTable = [];
        for (pid = 0; pid < this._wwaData.mapPartsMax; pid++) {
            this._mapIDTable[pid] = [];
        }
        for (pid = 0; pid < this._wwaData.objPartsMax; pid++) {
            this._mapObjectIDTable[pid] = [];
        }
        for (var xx = 0; xx < this._wwaData.mapWidth; xx++) {
            for (var yy = 0; yy < this._wwaData.mapWidth; yy++) {
                var posKey = (yy << IDTable.BITSHIFT) | xx;
                pid = this._wwaData.map[yy][xx];
                if (!(this._mapIDTable[pid] instanceof Array)) {
                    this._mapIDTable[pid] = [];
                }
                this._mapIDTable[pid].push(posKey);
                pid = this._wwaData.mapObject[yy][xx];
                if (!(this._mapObjectIDTable[pid] instanceof Array)) {
                    this._mapObjectIDTable[pid] = [];
                }
                this._mapObjectIDTable[pid].push(posKey);
            }
        }
    }

    private _restartGame(): void {
        this._quickLoad(true);
    }

    private _fadeout(callback: () => void): void {
        var borderWidth = 0;
        var size = Consts.MAP_WINDOW_WIDTH;
        var v = Consts.FADEOUT_SPEED; // borderの一本が増える速さ
        var elm = util.$id("wwa-fader");
        elm.style.display = "block";
        var timer = setInterval(() => {
            borderWidth += v;
            size -= v * 2;
            if (size <= 0 || borderWidth * 2 > Consts.MAP_WINDOW_WIDTH) {
                elm.removeAttribute("style");
                elm.style.display = "block";
                elm.style.borderWidth = "0";
                elm.style.width = Consts.MAP_WINDOW_WIDTH + "px";
                elm.style.height = Consts.MAP_WINDOW_HEIGHT + "px";
                elm.style.backgroundColor = "#808080";
                clearInterval(timer);
                callback();
                return;
            }
            elm.style.width = size + "px";
            elm.style.height = size + "px";
            elm.style.borderWidth = borderWidth + "px";

        }, 20);

    }

    public moveObjects(playerIsMoving: boolean): void {
        var camPos = this._camera.getPosition();
        var pPos = this._player.getPosition();

        var camCoord = camPos.getPartsCoord();

        // 物体が動く範囲は、カメラ内の11*11の1周外側も含む13*13
        var leftX = camPos.getPartsCoord().x;
        var topY = camPos.getPartsCoord().y;
        var objectsInNextFrame: number[][]; // y - x
        var localX: number, localY: number;

        if (this.getMapAttributeByPosition(this._player.getPosition(), Consts.ATR_TYPE) === Consts.MAP_LOCALGATE ||
            this.getObjectAttributeByPosition(this._player.getPosition(), Consts.ATR_TYPE) === Consts.OBJECT_LOCALGATE) {
            return;
        }

        objectsInNextFrame = new Array(Consts.V_PARTS_NUM_IN_WINDOW + 2);
        this.hoge = new Array(Consts.V_PARTS_NUM_IN_WINDOW + 2);
        for (localY = -1; localY <= Consts.V_PARTS_NUM_IN_WINDOW; localY++) {
            objectsInNextFrame[localY + 1] = new Array(Consts.H_PARTS_NUM_IN_WINDOW + 2);
            this.hoge[localY + 1] = new Array(Consts.H_PARTS_NUM_IN_WINDOW + 2);
            for (localX = -1; localX <= Consts.H_PARTS_NUM_IN_WINDOW; localX++) {
                if (topY + localY < 0 || topY + localY >= this._wwaData.mapWidth ||
                    leftX + localX < 0 || leftX + localX >= this._wwaData.mapWidth) {
                    objectsInNextFrame[localY + 1][localX + 1] = 0;
                    this.hoge[localY + 1][localX + 1] = 0;
                    continue;
                }
                try {
                    var pos = new Position(this, leftX + localX, topY + localY, 0, 0);
                    var posc = pos.getPartsCoord();
                } catch (e) {
                    objectsInNextFrame[localY + 1][localX + 1] = 0;
                    this.hoge[localY + 1][localX + 1] = 0;
                    continue;
                }
                var objID = this._wwaData.mapObject[posc.y][posc.x];

                objectsInNextFrame[localY + 1][localX + 1] = this._wwaData.mapObject[posc.y][posc.x];
                this.hoge[localY + 1][localX + 1] = -this._wwaData.mapObject[posc.y][posc.x];
            }
        }

        //            for (localY = -1; localY <= Consts.V_PARTS_NUM_IN_WINDOW; localY++) {
        for (localX = -1; localX <= Consts.H_PARTS_NUM_IN_WINDOW; localX++) {
            //                if (topY + localY < 0 || topY + localY >= this._wwaData.mapWidth) {
            if (leftX + localX < 0 || leftX + localX >= this._wwaData.mapWidth) {
                continue;
            }
            //                for (localX = -1; localX <= Consts.H_PARTS_NUM_IN_WINDOW; localX++) {
            for (localY = -1; localY <= Consts.V_PARTS_NUM_IN_WINDOW; localY++) {
                //                    if (leftX + localX < 0 || leftX + localX >= this._wwaData.mapWidth) {
                if (topY + localY < 0 || topY + localY >= this._wwaData.mapWidth) {
                    continue;
                }
                try {
                    var pos = new Position(this, leftX + localX, topY + localY, 0, 0);
                    var posc = pos.getPartsCoord();
                } catch (e) {
                    continue;
                }
                var partsID = this._wwaData.mapObject[posc.y][posc.x];
                if (
                    partsID === 0 ||
                    this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] === MoveType.STATIC ||
                    this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_LOCALGATE ||
                    this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_RANDOM
                ) {
                    continue;
                }
                // 作成ツールで空白の移動属性が指定でき、その場合に意図しない値が入ることがあるため、これらの属性でなければ静止とみなす.
                if (
                    this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] !== MoveType.CHASE_PLAYER &&
                    this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] !== MoveType.RUN_OUT &&
                    this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] !== MoveType.HANG_AROUND
                ) {
                    continue;
                }
                var moveMode = this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE];
                if (moveMode !== MoveType.HANG_AROUND) {
                    var candCoord = this._getCandidateCoord(playerIsMoving, pos, moveMode);
                    var xCand = new Coord(candCoord.x, posc.y);
                    var yCand = new Coord(posc.x, candCoord.y);
                    var thirdCand: Coord = null;
                    var randomCand: Coord;
                    if (this._objectCanMoveTo(playerIsMoving, candCoord, objectsInNextFrame)) {
                        this._setObjectsInNextFrame(posc, candCoord, leftX, topY, objectsInNextFrame, partsID);
                    } else {
                        var mode = this._getSecondCandidateMoveMode(
                            playerIsMoving, posc, candCoord, xCand, yCand,
                            this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_MONSTER,
                            objectsInNextFrame);
                        if (mode === SecondCandidateMoveType.MODE_X) {
                            this._setObjectsInNextFrame(posc, xCand, leftX, topY, objectsInNextFrame, partsID);
                        } else if (mode === SecondCandidateMoveType.MODE_Y) {
                            this._setObjectsInNextFrame(posc, yCand, leftX, topY, objectsInNextFrame, partsID);
                        } else {
                            thirdCand = this._getThirdCandidate(playerIsMoving, pos, candCoord, moveMode, objectsInNextFrame);
                            // thirdCandを用いた第三候補の作成は WWA 3.10以降のみで有効
                            if (thirdCand !== null && this._wwaData.version >= 31) {
                                this._setObjectsInNextFrame(posc, thirdCand, leftX, topY, objectsInNextFrame, partsID);
                            } else {
                                // うろうろする
                                randomCand = this._getRandomMoveCoord(playerIsMoving, pos, objectsInNextFrame);
                                this._setObjectsInNextFrame(posc, randomCand, leftX, topY, objectsInNextFrame, partsID);
                            }
                        }
                    }

                } else {
                    // うろうろする
                    randomCand = this._getRandomMoveCoord(playerIsMoving, pos, objectsInNextFrame);
                    this._setObjectsInNextFrame(posc, randomCand, leftX, topY, objectsInNextFrame, partsID);
                }

            }
        }

    }

    private _getCandidateCoord(playerIsMoving: boolean, currentPos: Position, moveType: MoveType): Coord {
        var currentCoord = currentPos.getPartsCoord();
        var playerOffsetCoord = this._player.getPosition().getOffsetCoord();
        var playerCoord = this._player.getPosition().getPartsCoord();
        try {
            var playerNextCoord = playerIsMoving ? this._player.getPosition().getNextJustPosition().getPartsCoord() : this._player.getPosition().getPartsCoord();
        } catch (e) {
            throw new Error("予期せぬ方向への移動のようです。");
        }
        var candidateCoord = currentCoord.clone();
        var dx = 0;
        var dy = 0;


        if (moveType === MoveType.CHASE_PLAYER) {
            dx =
                currentCoord.x > playerNextCoord.x ? -1 :
                    currentCoord.x < playerNextCoord.x ? 1 : 0;
            dy =
                currentCoord.y > playerNextCoord.y ? -1 :
                    currentCoord.y < playerNextCoord.y ? 1 : 0;

        } else if (moveType === MoveType.RUN_OUT) {
            dx =
                currentCoord.x > playerNextCoord.x ? 1 :
                    currentCoord.x < playerNextCoord.x ? -1 : 0;
            dy =
                currentCoord.y > playerNextCoord.y ? 1 :
                    currentCoord.y < playerNextCoord.y ? -1 : 0;
        }
        candidateCoord.x += dx;
        candidateCoord.y += dy;

        candidateCoord.x = Math.min(this._wwaData.mapWidth - 1, Math.max(0, candidateCoord.x));
        candidateCoord.y = Math.min(this._wwaData.mapWidth - 1, Math.max(0, candidateCoord.y));

        return candidateCoord;
    }

    private _getSecondCandidateMoveMode(
        playerIsMoving: boolean,
        current: Coord,
        firstCandidate: Coord,
        xCand: Coord,
        yCand: Coord,
        isMonster: boolean,
        objectsInNextFrame: number[][]
    ): SecondCandidateMoveType {
        if (
            playerIsMoving && (
                (this._player.getDir() === Direction.UP || this._player.getDir() === Direction.DOWN) && isMonster ||
                (this._player.getDir() === Direction.LEFT || this._player.getDir() === Direction.RIGHT) && !isMonster
            )
        ) {
            // 移動Yモード
            if (this._objectCanMoveTo(playerIsMoving, yCand, objectsInNextFrame)) {
                return SecondCandidateMoveType.MODE_Y;
            }
            if (this._objectCanMoveTo(playerIsMoving, xCand, objectsInNextFrame)) {
                return SecondCandidateMoveType.MODE_X;
            }
            return SecondCandidateMoveType.UNDECIDED;
        }

        // 移動Xモード
        if (this._objectCanMoveTo(playerIsMoving, xCand, objectsInNextFrame)) {
            return SecondCandidateMoveType.MODE_X;
        }
        if (this._objectCanMoveTo(playerIsMoving, yCand, objectsInNextFrame)) {
            return SecondCandidateMoveType.MODE_Y;
        }
        return SecondCandidateMoveType.UNDECIDED;
    }

    private _getThirdCandidate(
        playerIsMoving: boolean,
        currentPos: Position,
        firstCandidate: Coord,
        mode: MoveType,
        objectsInNextFrame: number[][]): Coord {
        var dir =
            mode === MoveType.CHASE_PLAYER ? 1 :
                mode === MoveType.RUN_OUT ? -1 : 0;

        var npCoord = playerIsMoving ? this._player.getPosition().getNextJustPosition().getPartsCoord() : this._player.getPosition().getPartsCoord();
        var currentCoord = currentPos.getPartsCoord();
        var testCoord: Coord;
        if (npCoord.x !== currentCoord.x) {
            testCoord = new Coord(firstCandidate.x, currentCoord.y + 1 * dir);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

            testCoord = new Coord(firstCandidate.x, currentCoord.y - 1 * dir);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

            testCoord = new Coord(currentCoord.x, currentCoord.y + 1 * dir);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

            testCoord = new Coord(currentCoord.x, currentCoord.y - 1 * dir);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

        }

        if (npCoord.y !== currentCoord.y) {
            testCoord = new Coord(currentCoord.x + 1 * dir, firstCandidate.y);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

            testCoord = new Coord(currentCoord.x - 1 * dir, firstCandidate.y);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

            testCoord = new Coord(currentCoord.x + 1 * dir, currentCoord.y);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

            testCoord = new Coord(currentCoord.x - 1 * dir, currentCoord.y);
            if (this._objectCanMoveTo(playerIsMoving, testCoord, objectsInNextFrame)) {
                return testCoord;
            }

        }

        return null;
    }

    private _getRandomMoveCoord(playerIsMoving: boolean, currentPos: Position, objectsInNextFrame: number[][]): Coord {
        var currentCoord = currentPos.getPartsCoord();
        var resultCoord: Coord = currentCoord.clone();
        var iterNum = this._wwaData.version < 31 ? Consts.RANDOM_MOVE_ITERATION_NUM_BEFORE_V31 : Consts.RANDOM_MOVE_ITERATION_NUM;
        for (var i = 0; i < iterNum; i++) {
            var rand = Math.floor(Math.random() * 8);
            resultCoord.x = currentCoord.x + vx[rand];
            resultCoord.y = currentCoord.y + vy[rand];
            if (this._objectCanMoveTo(playerIsMoving, resultCoord, objectsInNextFrame)) {
                return resultCoord;
            }
        }
        return currentCoord;

    }

    public isPrevFrameEventExecuted(): boolean {
        return this._prevFrameEventExected;
    }



    private _objectCanMoveTo(playerIsMoving: boolean, candCoord: Coord, objectsInNextFrame: number[][]): boolean {
        if (candCoord.x < 0 || candCoord.y < 0 || this._wwaData.mapWidth <= candCoord.x || this._wwaData.mapWidth <= candCoord.y) {
            return false;
        }
        var mapID = this._wwaData.map[candCoord.y][candCoord.x];
        var objID = this._wwaData.mapObject[candCoord.y][candCoord.x];
        var mapType = this._wwaData.mapAttribute[mapID][Consts.ATR_TYPE];
        var camPos = this._camera.getPosition();
        var leftX = camPos.getPartsCoord().x;
        var topY = camPos.getPartsCoord().y;
        if (mapID === 0 && !this.isOldMap() || mapType === Consts.MAP_WALL) {
            return false;
        }
        var targetX = candCoord.x - leftX + 1;
        var targetY = candCoord.y - topY + 1;
        if (0 <= targetX && 0 <= targetY &&
            targetX < objectsInNextFrame.length && targetY < objectsInNextFrame.length) {
            if (objectsInNextFrame[targetY][targetX] !== 0) {
                return false;
            }
        } else {
            if (objID !== 0) {
                return false;
            }
        }
        if (playerIsMoving) {
            if (this._player.getPosition().getNextJustPosition().getPartsCoord().equals(candCoord)) {
                return false;
            }
        } else {
            if (this._player.getPosition().getPartsCoord().equals(candCoord)) {
                return false;
            }
        }

        return true;
    }

    private _setObjectsInNextFrame(currentCoord: Coord, candCoord: Coord, leftX: number, topY: number, objectsInNextFrame: number[][], partsID: number): void {
        var targetX = candCoord.x - leftX + 1;
        var targetY = candCoord.y - topY + 1;
        if (0 <= candCoord.x && candCoord.x <= this._wwaData.mapWidth && 0 <= candCoord.y && candCoord.y <= this._wwaData.mapWidth) {
            if (0 <= targetX && targetX < objectsInNextFrame.length && 0 <= targetY && targetY < objectsInNextFrame.length) {
                objectsInNextFrame[currentCoord.y - topY + 1][currentCoord.x - leftX + 1] = 0;
                objectsInNextFrame[candCoord.y - topY + 1][candCoord.x - leftX + 1] = partsID;
                this.hoge[candCoord.y - topY + 1][candCoord.x - leftX + 1] = partsID;
            }
            this._objectMovingDataManager.add(
                partsID,
                currentCoord.convertIntoPosition(this),
                candCoord.convertIntoPosition(this),
                currentCoord.getDirectionTo(candCoord)
            );
        }

    }

    public launchBattleEstimateWindow(): boolean {
        var cpParts = this._camera.getPosition().getPartsCoord();
        var xLeft = Math.max(0, cpParts.x);
        var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW - 1);
        var yTop = Math.max(0, cpParts.y);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW - 1);
        var monsterList: number[] = [];
        this.playSound(SystemSound.DECISION);
        for (var x: number = xLeft; x <= xRight; x++) {
            for (var y: number = yTop; y <= yBottom; y++) {
                var pid = this._wwaData.mapObject[y][x];
                if (this._wwaData.objectAttribute[pid][Consts.ATR_TYPE] === Consts.OBJECT_MONSTER) {
                    if (monsterList.indexOf(pid) === -1) {
                        monsterList.push(pid);
                    }
                }
            }
        }
        if (this._useBattleReportButton) {
            (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.add("onpress");
        }
        if (monsterList.length === 0) {
            (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
            this.hideBattleEstimateWindow();
            return false;
        }
        this._battleEstimateWindow.update(this._player.getStatus(), monsterList);
        this._battleEstimateWindow.show();
        this._player.setEstimateWindowWating();
        return true;
    }

    public hideBattleEstimateWindow(): void {
        this._battleEstimateWindow.hide();
        this._player.clearEstimateWindowWaiting();
        (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
    }

    public hidePasswordWindow(isCancel: boolean = false): void {
        this._passwordWindow.hide();
        if (isCancel || this._passwordWindow.mode === Mode.SAVE) {
            this._player.clearPasswordWindowWaiting();
            return;
        }
        try {
            var data = this._quickLoad(false, this._passwordWindow.password, false);
        } catch (e) {
            this._player.clearPasswordWindowWaiting();
            // 読み込み失敗
            alert("パスワードが正常ではありません。\nエラー詳細:\n" + e.message);
            return;
        }
        this._passwordLoadExecInNextFrame = true;
        this._passwordSaveExtractData = data;
    }

    private _displayHelp(): void {
        if (!this._useHelp) {
            //パスワードなしの場合はヘルプを開かない
            return;
        }
        if (this._player.isControllable()) {
            this.setMessageQueue(
                "　【ショートカットキーの一覧】\n" +
                "Ｆ１、Ｍ：戦闘結果予測の表示\n" +
                //                                "Ｆ２、Ｐ：移動速度の切り換え\n" +
                "Ｆ３：復帰用パスワード入力\n" +
                "Ｆ４：復帰用パスワード表示\n" +
                "Ｆ５：一時保存データの読み込み\n" +
                "Ｆ６：データの一時保存\n" +
                "Ｆ７：初めからスタート\n" +
                "Ｆ８：ＷＷＡ公式ページにリンク\n" +
                //                               "Ｆ９、Ｇ：描画モードの切り換え\n" +
                "Ｆ１２：このリストの表示\n" +
                //                                "Ｌ：リンクを別のウィンドウで開く\n" +
                "キーボードの「１２３、ＱＷＥ、ＡＳＤ、ＺＸＣ」は右のアイテムボックスに対応。\n" +
                "「Ｅｎｔｅｒ、Ｙ」はＹｅｓ,\n" +
                "「Ｅｓｃ、Ｎ」はＮｏに対応。\n" +
                "　　　Ｉ: 移動速度を落とす／\n" +
                "Ｆ２、Ｐ: 移動速度を上げる\n" +
                "　　現在の移動回数：" + this._player.getMoveCount() + "\n" +
                "　WWA Wing バージョン:" + Consts.VERSION_WWAJS + "\n" +
                "　マップデータ バージョン: " +
                Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10,
                false, true
            );
        }
    }

    public _setNextMessage(displayCenter: boolean = false): void {  // TODO(rmn): wwa_parts_player からの参照を断ち切ってprivateに戻す
        this._clearFacesInNextFrame = true;
        if (this._scoreWindow.isVisible()) {
            this._scoreWindow.hide();
        }
        if (this._lastMessage.isEndOfPartsEvent && this._reservedMoveMacroTurn !== void 0) {
            this._player.setMoveMacroWaiting(this._reservedMoveMacroTurn);
            this._reservedMoveMacroTurn = void 0;
        }
        if (this._messageQueue.length === 0) {
            this._hideMessageWindow();
        } else {
            var mi = this._messageQueue.shift();
            var message = mi.message;
            var macro = mi.macro;
            this._lastMessage = mi;

            for (var i = 0; i < macro.length; i++) {
                this._execMacroListInNextFrame.push(macro[i]);
            }

            // empty->hide
            if (message !== "") {
                this._messageWindow.hide();
                this._messageWindow.setMessage(message);
                this._messageWindow.setPositionByPlayerPosition(
                    this._faces.length !== 0,
                    this._scoreWindow.isVisible(),
                    displayCenter,
                    this._player.getPosition(),
                    this._camera.getPosition()
                );
                this._messageWindow.show();
                this._player.setMessageWaiting();
            } else {
                if (this._messageQueue.length === 0) {
                    this._hideMessageWindow();
                } else {
                    this._setNextMessage();
                }
            }
        }
    }

    private _hideMessageWindow(messageDisplayed: boolean = true): void {
        var itemID = 0;
        if (this._player.isReadyToUseItem()) {
            itemID = this._player.useItem();
        }
        var mesID = this.getObjectAttributeById(itemID, Consts.ATR_STRING);
        this.clearFaces();
        if (mesID === 0) {
            if (messageDisplayed) {
                this._messageWindow.hide();
                this._keyStore.allClear();
                this._mouseStore.clear();
            }
            this._player.clearMessageWaiting();
        } else {
            this.setMessageQueue(
                this.getMessageById(mesID),
                false, false, itemID, PartsType.OBJECT,
                this._player.getPosition().getPartsCoord(), true);
        }

    }
    public loadMapPartsObjectID(id: number): number {
        id = id | 0;
        if ((id < 0) || (id >= this._wwaData.objPartsMax)) {
            return 0;
        }
        return id;
    }
    public loadMapPartsID(id: number): number {
        id = id | 0;
        if ((id < 0) || (id >= this._wwaData.mapPartsMax)) {
            return 0;
        }
        return id;
    }

    public replaceParts(
        srcID: number,
        destID: number,
        partsType: PartsType = PartsType.OBJECT,
        onlyThisSight: boolean = false
    ): void {

        var cpParts = this._camera.getPosition().getPartsCoord();
        var xLeft = onlyThisSight ? Math.max(0, cpParts.x) : 0;
        var xRight = onlyThisSight ? Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW - 1) : this._wwaData.mapWidth - 1;
        var yTop = onlyThisSight ? Math.max(0, cpParts.y) : 0;
        var yBottom = onlyThisSight ? Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW) - 1 : this._wwaData.mapWidth - 1;
        onlyThisSight = (xLeft !== 0) || (xRight !== this._wwaData.mapWidth - 1) || (yTop !== 0) || (yBottom !== this._wwaData.mapWidth - 1);

        var posKey: number, len: number, i: number, list: number[];
        var xx: number, yy: number;
        var srcList: number[], destList: number[];
        if (partsType === PartsType.OBJECT) {
            srcID = this.loadMapPartsObjectID(srcID);
            destID = this.loadMapPartsObjectID(destID);

            list = this._mapObjectIDTable[srcID].concat();
            srcList = this._mapObjectIDTable[srcID];
            srcList.length = 0;
            destList = this._mapObjectIDTable[destID];
            len = list.length;
            if (onlyThisSight) {
                //範囲指定あり
                for (i = 0; i < len; i++) {
                    posKey = list[i];
                    xx = (posKey & IDTable.BITMASK);
                    yy = ((posKey >>> IDTable.BITSHIFT) & IDTable.BITMASK);
                    if ((xLeft <= xx) && (xx <= xRight) && (yTop <= yy) && (yy <= yBottom)) {
                        this._wwaData.mapObject[yy][xx] = destID;
                        destList.push(posKey);
                    } else {
                        srcList.push(posKey);
                    }
                }
            } else {
                //マップ全体
                for (i = 0; i < len; i++) {
                    posKey = list[i];
                    xx = (posKey & IDTable.BITMASK);
                    yy = ((posKey >>> IDTable.BITSHIFT) & IDTable.BITMASK);
                    this._wwaData.mapObject[yy][xx] = destID;
                }
                Array.prototype.push.apply(destList, list);
            }
        } else {
            srcID = this.loadMapPartsID(srcID);
            destID = this.loadMapPartsID(destID);

            list = this._mapIDTable[srcID].concat();
            srcList = this._mapIDTable[srcID];
            srcList.length = 0;
            destList = this._mapIDTable[destID];
            len = list.length;
            if (onlyThisSight) {
                //範囲指定あり
                for (i = 0; i < len; i++) {
                    posKey = list[i];
                    xx = (posKey & IDTable.BITMASK);
                    yy = ((posKey >>> IDTable.BITSHIFT) & IDTable.BITMASK);
                    if ((xLeft <= xx) && (xx <= xRight) && (yTop <= yy) && (yy <= yBottom)) {
                        this._wwaData.map[yy][xx] = destID;
                        destList.push(posKey);
                    } else {
                        srcList.push(posKey);
                    }
                }
            } else {
                //マップ全体
                for (i = 0; i < len; i++) {
                    posKey = list[i];
                    xx = (posKey & IDTable.BITMASK);
                    yy = ((posKey >>> IDTable.BITSHIFT) & IDTable.BITMASK);
                    this._wwaData.map[yy][xx] = destID;
                }
                Array.prototype.push.apply(destList, list);
            }
        }
    }

    public getYesNoImgCoord(): Coord {
        return new Coord(this._wwaData.yesnoImgPosX, this._wwaData.yesnoImgPosY);
    }

    public setYesNoImgCoord(coord: Coord): Coord {
        this._wwaData.yesnoImgPosX = coord.x;
        this._wwaData.yesnoImgPosY = coord.y;
        return coord;
    }

    public getPlayerImgCoord(): Coord {
        return new Coord(this._wwaData.playerImgPosX, this._wwaData.playerImgPosY);
    }

    public setPlayerImgCoord(coord: Coord): Coord {
        this._wwaData.playerImgPosX = coord.x;
        this._wwaData.playerImgPosY = coord.y;
        return coord;
    }

    public setPlayerEnergyMax(eng: number): number {
        return this._player.setEnergyMax(eng);
    }
    public getMapPartsNum(): number {
        return this._wwaData.mapPartsMax;
    }
    public getObjectPartsNum(): number {
        return this._wwaData.objPartsMax;
    }
    public setMoveMacroWaitingToPlayer(moveNum: number): void {
        this._reservedMoveMacroTurn = moveNum;
    }

    public disableSave(flag: boolean): boolean {
        return this._wwaData.disableSaveFlag = flag;
    }

    public isOldMap(): boolean {
        return this._wwaData.isOldMap;
    }

    public setOldMap(flag: boolean): boolean {
        return this._wwaData.isOldMap = flag;
    }

    public setObjectNotCollapseOnPartsOnPlayer(flag: boolean): boolean {
        return this._wwaData.objectNoCollapseDefaultFlag = flag;
    }

    public setGameOverPosition(pos: Coord): Coord {
        if (pos.x < 0 || pos.x >= this.getMapWidth() || pos.y < 0 || pos.y >= this.getMapWidth()) {
            throw new Error("マップの範囲外が指定されています!");
        }
        this._wwaData.gameoverX = pos.x;
        this._wwaData.gameoverY = pos.y;
        return pos;
    }

    public setPlayerStatus(type: MacroStatusIndex, value: number): void {
        if (type === MacroStatusIndex.ENERGY) {
            this._player.setEnergy(value);
        } else if (type === MacroStatusIndex.STRENGTH) {
            this._player.setStrength(value);
        } else if (type === MacroStatusIndex.DEFENCE) {
            this._player.setDefence(value);
        } else if (type === MacroStatusIndex.GOLD) {
            this._player.setGold(value);
        } else if (type === MacroStatusIndex.MOVES) {
            this._player.setMoveCount(value);
        } else {
            throw new Error("未定義のステータスタイプです");
        }
        // ステータス変更アニメーションは対応なし (原作通り)
    }

    public setDelPlayer(flag: boolean): boolean {
        return this._wwaData.delPlayerFlag = flag;
    }
    public setPlayerGetItem(pos: number, id: number): void {
        try {
            this._player.addItem(id, pos, true);
        } catch (e) {
            // アイテムを持てない時、メッセージを出さない。
        }
    }

    public setFrameCoord(coord: Coord): Coord {
        return this._frameCoord = coord.clone();
    }

    public setBattleEffectCoord(coord: Coord): Coord {
        return this._battleEffectCoord = coord.clone();
    }

    public canInput(): boolean {
        return !this._temporaryInputDisable;
    }

    /*public setWaitTime( time: number): void {
    this._waitTimeInCurrentFrame += time;
    this._temporaryInputDisable = true;
    }*/


    public setEffect(waits: number, coords: Coord[]): void {
        this._wwaData.effectWaits = waits;
        this._wwaData.effectCoords = coords;
    }

    public stopEffect(): void {
        this._wwaData.effectCoords = [];
    }

    public setImgClick(pos: Coord): void {
        this._wwaData.imgClickX = pos.x;
        this._wwaData.imgClickY = pos.y;
        if (pos.equals(new Coord(0, 0))) {
            // reset
            Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-click-border"), (node: HTMLElement) => {
                node.style.backgroundImage = "url('" + Consts.ITEM_BORDER_IMG_DATA_URL + "')";
                node.style.backgroundPosition = "0 0"
            });
        } else {
            var escapedFilename: string = this._wwaData.mapCGName.replace("(", "\\(").replace(")", "\\)");
            Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-click-border"), (node: HTMLElement) => {
                node.style.backgroundImage = "url('" + escapedFilename + "')";
                node.style.backgroundPosition = "-" + pos.x * Consts.CHIP_SIZE + "px -" + pos.y * Consts.CHIP_SIZE + "px";
            });

        }
    }

    public addFace(face: Face): void {
        this._faces.push(face);
    }

    public clearFaces(): void {
        this._faces = [];
    }

    public updateItemEffectEnabled(isEnabled: boolean): void {
        this._wwaData.isItemEffectEnabled = isEnabled;
    }

    private _stylePos: number[]; // w
    private _styleElm: HTMLStyleElement;
    private _sheet: CSSStyleSheet;
    public initCSSRule() {
        this._styleElm = <HTMLStyleElement>util.$id(Consts.WWA_STYLE_TAG_ID);
        this._sheet = <CSSStyleSheet>this._styleElm.sheet;
        this.updateCSSRule();
    }
    public updateCSSRule() {
        if (this._stylePos === void 0) {
            this._stylePos = new Array(2);
        } else {
            if (this._sheet.addRule !== void 0) {
                for (var i = 0; i < this._stylePos.length; i++) {
                    this._sheet.removeRule(this._stylePos[this._styleElm[i]]);
                }
            } else {
                for (var i = 0; i < this._stylePos.length; i++) {
                    this._sheet.deleteRule(this._stylePos[this._styleElm[i]]);
                }
            }
        }
        const messageWindowStyleSelector = "div.wwa-message-window, div#wwa-battle-estimate, div#wwa-password-window";
        const messageWindowOpacity = this._isClassicModeEnable ? 1 : 0.9;
        const messageWindowStyleRules = `
background-color: rgba(${this._wwaData.frameColorR},  ${this._wwaData.frameColorG}, ${this._wwaData.frameColorB}, ${messageWindowOpacity});
border-color: rgba(${this._wwaData.frameOutColorR}, ${this._wwaData.frameOutColorG}, ${this._wwaData.frameOutColorB }, 1);
color: rgba(${this._wwaData.fontColorR}, ${this._wwaData.fontColorG}, ${this._wwaData.fontColorB}, 1);
white-space: pre-wrap;
`;
        const sidebarStyleSelector = "div#wwa-sidebar";
        const sidebarStyleRules = `
color: rgba(${this._wwaData.statusColorR}, ${this._wwaData.statusColorG}, ${this._wwaData.statusColorB},1);
font-weight: bold;
`;

        if (this._sheet.addRule !== void 0) {
            this._stylePos[SelectorType.MESSAGE_WINDOW] = this._sheet.addRule(messageWindowStyleSelector,messageWindowStyleRules);
            this._stylePos[SelectorType.SIDEBAR] = this._sheet.addRule(sidebarStyleSelector, sidebarStyleRules);
        } else {
            this._stylePos[SelectorType.MESSAGE_WINDOW] = this._sheet.insertRule(`${messageWindowStyleSelector} { ${messageWindowStyleRules} }`, 0);
            this._stylePos[SelectorType.SIDEBAR] = this._sheet.insertRule(`${sidebarStyleSelector} { ${sidebarStyleRules} }`, 1);
        }
    }
    public changeStyleRule(type: ChangeStyleType, r: number, g: number, b: number) {
        if (type === ChangeStyleType.COLOR_FRAME) {
            this._wwaData.frameColorR = r;
            this._wwaData.frameColorG = g;
            this._wwaData.frameColorB = b;
        } else if (type === ChangeStyleType.COLOR_FRAMEOUT) {
            this._wwaData.frameOutColorR = r;
            this._wwaData.frameOutColorG = g;
            this._wwaData.frameOutColorB = b;
        } else if (type === ChangeStyleType.COLOR_STR) {
            this._wwaData.fontColorR = r;
            this._wwaData.fontColorG = g;
            this._wwaData.fontColorB = b;
        } else if (type === ChangeStyleType.COLOR_STATUS_STR) {
            this._wwaData.statusColorR = r;
            this._wwaData.statusColorG = g;
            this._wwaData.statusColorB = b;
        }
        this.updateCSSRule();
    }

    public showMonsterWindow(): void {
        this._monsterWindow.show();
    }

    public isClassicMode(): boolean {
        return this._isClassicModeEnable;
    }

    public isConsoleOutputMode(): boolean {
        return this._useConsole;
    }
};

var isCopyRightClick = false;
function start() {
    if (window["wwap_mode"] === void 0) {
        wwap_mode = false;
    }
    Array.prototype.forEach.call(util.$qsAll("a.wwa-copyright"), (node: HTMLElement) => {
        node.addEventListener("click", (): void => {
            isCopyRightClick = true;
        });
    });
    window.addEventListener("beforeunload", (e): string => {
        var mes = "このページを離れますか？";
        if (isCopyRightClick) {
            isCopyRightClick = false;
            e.returnValue = mes     // Gecko and Trident
            return mes;             // Gecko and WebKit
        }
    });
    var titleImgName = wwap_mode ?
        Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_TITLE_IMG :
        util.$id("wwa-wrapper").getAttribute("data-wwa-title-img");
    inject(<HTMLDivElement>util.$id("wwa-wrapper"), titleImgName);
    var mapFileName = util.$id("wwa-wrapper").getAttribute("data-wwa-mapdata");
    var loaderFileName = util.$id("wwa-wrapper").getAttribute("data-wwa-loader");

    var audioDirectory = util.$id("wwa-wrapper").getAttribute("data-wwa-audio-dir");
    var urlgateEnabled = true;
    if (util.$id("wwa-wrapper").getAttribute("data-wwa-urlgate-enable").match(/^false$/i)) {
        urlgateEnabled = false;
    }
    var classicModeAttribute = util.$id("wwa-wrapper").getAttribute("data-wwa-classic-mode-enable"); // null値の可能性もあるので一旦属性を取得する
    var classicModeEnabled = false;
    if (classicModeAttribute !== null && classicModeAttribute.match(/^true$/i)) {
        classicModeEnabled = true;
    }
    var itemEffectEnabled = true;
    var itemEffectAttribute = util.$id("wwa-wrapper").getAttribute("data-wwa-item-effect-enable");
    if (itemEffectAttribute !== null && itemEffectAttribute.match(/^false$/i)) {
        itemEffectEnabled = false;
    }
    wwa = new WWA(mapFileName, loaderFileName, urlgateEnabled, titleImgName, classicModeEnabled, itemEffectEnabled, audioDirectory);
}


if (document.readyState === "complete") {
    setTimeout(start);
} else {
    window.addEventListener("load", function () {
        setTimeout(start);
    });
}
