declare var VERSION_WWAJS: string; // webpackにより注入

import type { JsonResponseError } from "./json_api_client";
import {
    WWAConsts as Consts, WWAData as Data, Coord, Position, WWAButtonTexts,
    LoaderProgress, LoadStage, YesNoState, ChoiceCallInfo, Status, WWAData, Face, LoadType, Direction,
    SidebarButton, SystemMessage2, LoadingMessageSize, LoadingMessagePosition, loadMessagesClassic,
    SystemSound, loadMessages, SystemMessage1, sidebarButtonCellElementID, SpeedChange, PartsType, dirToKey,
    speedNameList, dirToPos, MoveType, AppearanceTriggerType, vx, vy, EquipmentStatus, SecondCandidateMoveType,
    ChangeStyleType, MacroStatusIndex, SelectorType, IDTable, UserDevice, OS_TYPE, DEVICE_TYPE, BROWSER_TYPE, ControlPanelBottomButton, MacroImgFrameIndex, DrawPartsData,
    speedList, StatusKind, MacroType, StatusSolutionKind, UserVarNameListRequestErrorKind, ConditionalMacroExecStatus,
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
import * as util from "./wwa_util";
import { CGManager } from "./wwa_cgmanager";
import { Camera } from "./wwa_camera";
import { Parts, Player } from "./wwa_parts_player";
import { Monster } from "./wwa_monster";
import { ObjectMovingDataManager } from "./wwa_motion";
import {
    MessageWindow, MonsterWindow, ScoreWindow, ParsedMessage, Macro, parseMacro, MessageSegments, isEmptyMessageTree, getLastMessage, concatMessage, Node, Junction, Page, MessageLineType, messagLineIsText, MessageLine,
} from "./wwa_message";
import { BattleEstimateWindow } from "./wwa_estimate_battle";
import { PasswordWindow, Mode } from "./wwa_password_window";
import { inject } from "./wwa_inject_html";
import { ItemMenu } from "./wwa_item_menu";
import { encodeSaveData, decodeSaveDataV0, decodeSaveDataV1, generateMD5 } from "./wwa_encryption";
import { WWACompress, WWASave, LoadErrorCode, generateMapDataRevisionKey, WWADataWithWorldNameStatus, Migrators } from "./wwa_save";
import { Sound } from "./wwa_sound";
import { WWALoader, WWALoaderEventEmitter, Progress, LoaderError } from "@wwawing/loader";
import { BrowserEventEmitter, IEventEmitter } from "@wwawing/event-emitter";
import { fetchJsonFile } from "./json_api_client";
import * as ExpressionParser from "./wwa_expression";

let wwa: WWA

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

interface PartsAppearance {
    pos: Coord;
    triggerType: AppearanceTriggerType;
    triggerPartsId: number;
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
    private _monsterWindow: MonsterWindow;
    private _scoreWindow: ScoreWindow;
    private _pages: Page[];
    private _yesNoJudge: YesNoState;
    private _yesNoJudgeInNextFrame: YesNoState;
    private _yesNoChoicePartsCoord: Coord;
    private _yesNoChoicePartsID: number;
    private _yesNoChoiceCallInfo: ChoiceCallInfo;
    private _yesNoDispCounter: number;
    private _yesNoUseItemPos: number;
    private _yesNoURL: string;
    private _waitFrame: number;
    private _usePassword: boolean;
    private _bottomButtonType: number;
    private _mouseControllerElement: HTMLDivElement;
    private _statusPressCounter: Status; // ステータス型があるので、アニメーション残りカウンタもこれで代用しまぁす。
    private _battleEstimateWindow: BattleEstimateWindow;
    private _passwordWindow: PasswordWindow;
    private _wwaSave: WWASave;

    private _stopUpdateByLoadFlag: boolean;
    private _isURLGateEnable: boolean;
    private _loadType: LoadType;
    private _restartData: WWAData;

    /**
     * 所持状態のマップデータの文字列加工をMD5化した文字列です。
     * データが壊れていないかなどの検証に使います。
     * TODO: originalMapDataHash などの名前が適切だと思うが、WWADataに同じ名前のプロパティがいるので安易に変えられない。どこかで対応する。
     */
    public checkOriginalMapString: string;

    private _prevFrameEventExected: boolean;

    private _reservedMoveMacroTurn: number; // $moveマクロは、パーツマクロの中で最後に効果が現れる。実行されると予約として受け付け、この変数に予約内容を保管。
    private _lastPage: {
        isLastPage: boolean;
        isEmpty: boolean;
    } | undefined;
    private _reservedPartsAppearance: PartsAppearance | undefined;
    private _frameCoord: Coord;
    private _battleEffectCoord: Coord;

    private sounds: Sound[];

    private _temporaryInputDisable: boolean;

    private _isLoadedSound: boolean;
    private _isSkippedSoundMessage: boolean; // メッセージの読み込みジャッジを飛ばすフラグ(汎用的に使えるようにプロパティに入れている)

    private _soundLoadSkipFlag: boolean;

    private _passwordLoadExecInNextFrame: boolean;
    private _passwordSaveExtractData: WWAData;

    private _faces: Face[];
    private _execPageInNextFrame?: Page;
    private _clearFacesInNextFrame: boolean;
    private _paintSkipByDoorOpen: boolean; // WWA.javaの闇を感じる扉モーションのための描画スキップフラグ
    private _isClassicModeEnable: boolean;

    private _useConsole: boolean;
    private _audioDirectory: string;
    private _hasTitleImg: boolean;
    private _useSuspend: boolean = false;
    private _useLookingAround: boolean = true;  //待機時にプレイヤーが自動回転するか
    private _isDisallowLoadOldSave: boolean = false;

    /**
     * ゲーム内ユーザ変数ビューワの設定
     */
    private _inlineUserVarViewer: {
        /**
         * 表示されているかどうか
         */
        isVisible: boolean
        /**
         * 表示中の先頭にあるユーザ変数の添字
         */
        topUserVarIndex: number;
    }
    /**
     * ユーザ変数の名前 (wwaData のユーザ変数と添字が対応)
     */
    private _userVarNameList: string[];

    /**
     * ユーザ変数名一覧の取得エラー
     */
    private _userVarNameListRequestError: JsonResponseError<UserVarNameListRequestErrorKind> | undefined;

    /**
     * ユーザ変数を表示できるか
     */
    private _canDisplayUserVars: boolean;

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

    /**
     * #wwa-wrapper の DOM に対してカスタムイベントを発生させる EventEmitter.
     * 外部のアプリケーションが #wwa-wrapper に対してイベントリスナを設定することで
     * WWAと連携する機能を作ることができます。
     */
    public wwaCustomEventEmitter: IEventEmitter;

    /**
     * スコア表示に使うレート
     * スコアが表示されていない場合は undefined.
     */
    private _scoreRates?: {
        energy: number;
        strength: number;
        defence: number;
        gold: number;
    };

    ////////////////////////
    public debug: boolean;
    private hoge: number[][];
    ////////////////////////

    private _loadHandler: (wwaData: WWAData) => void;
    public audioContext: AudioContext;
    public audioGain: GainNode;
    private audioExtension: string = "";

    public userDevice: UserDevice;
    private soundLoadedCheckTimer: number | undefined = undefined;

    private _startTime: number;
    private _dumpElement: HTMLElement;

    constructor(
        mapFileName: string,
        urlgateEnabled: boolean = false,
        titleImgName: string,
        classicModeEnabled: boolean,
        itemEffectEnabled: boolean,
        useGoToWWA: boolean,
        audioDirectory: string = "",
        disallowLoadOldSave: boolean = false,
        dumpElm: HTMLElement = null,
        userVarNamesFile: string | null,
        canDisplayUserVars: boolean
    ) {
        this.wwaCustomEventEmitter = new BrowserEventEmitter(util.$id("wwa-wrapper"));
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
        this._dumpElement = dumpElm;
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
        // Go To WWA を強制するオプションが無効なら、Battle Reportにする
        this._bottomButtonType = useGoToWWA ? ControlPanelBottomButton.GOTO_WWA : ControlPanelBottomButton.BATTLE_REPORT;

        var t_start: number = new Date().getTime();
        var isLocal = !!location.href.match(/^file/);
        if (isLocal) {
            switch (this.userDevice.device) {
                case DEVICE_TYPE.GAME:
                    switch (this.userDevice.os) {
                        case OS_TYPE.NINTENDO:
                            Consts.BATTLE_INTERVAL_FRAME_NUM = 5;
                            break;
                    }
                    this._bottomButtonType = ControlPanelBottomButton.GAME_END;
                    break;
                default:
                    alert(
                        "【警告】直接HTMLファイルを開いているようです。\n" +
                        "このプログラムは正常に動作しない可能性があります。\n" +
                        "マップデータの確認を行う場合には同梱の「wwa-server.exe」をご利用ください。\n" + (
                            this.userDevice.browser === BROWSER_TYPE.FIREFOX ?
                                "Firefoxの場合も、バージョン68以降はローカルのHTMLファイルを直接開いた場合、通常起動できないことを確認しております。" :
                                ""
                        )
                    );
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

        util.$id("cell-save").textContent = WWAButtonTexts.QUICK_SAVE;
        if (!this._usePassword) {
            util.$id("cell-load").textContent = WWAButtonTexts.EMPTY_LOAD;
        } else {
            util.$id("cell-load").textContent = WWAButtonTexts.PASSWORD;
        }
        switch (this._bottomButtonType) {
            case ControlPanelBottomButton.GOTO_WWA:
                util.$id("cell-gotowwa").textContent = WWAButtonTexts.GOTO_WWA;
                break;
            case ControlPanelBottomButton.BATTLE_REPORT:
                util.$id("cell-gotowwa").textContent = WWAButtonTexts.BATTLE_REPORT;
                break;
            case ControlPanelBottomButton.GAME_END:
                util.$id("cell-gotowwa").textContent = WWAButtonTexts.GAME_END;
                break;
        }

        this._loadHandler = (wwaData: WWAData): void => {
            this._wwaData = wwaData;
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
            this._wwaData.mapCGName = pathList.join("/");  //pathを復元

            // プレイ時間関連
            this._startTime = new Date().getTime();
            this._restartData = JSON.parse(JSON.stringify(this._wwaData));
            this.checkOriginalMapString = this._generateMapDataHash(this._restartData);

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

            var escapedFilename: string = this._wwaData.mapCGName.replace("(", "\\(").replace(")", "\\)");
            /**
             * Node に対して background-color を設定します。
             *     主に操作パネルの各部位に背景画像を割り当てる際に使用します。
             * @param node 
             */
            const applyBackground = (node: HTMLElement) => {
                node.style.backgroundImage = "url(" + escapedFilename + ")";
            };
            Array.prototype.forEach.call(util.$qsAll("div.item-cell"), (node: HTMLElement) => {
                node.style.backgroundPosition = `-${
                    this._wwaData.imgItemboxX * Consts.CHIP_SIZE
                }px -${
                    this._wwaData.imgItemboxY * Consts.CHIP_SIZE
                }px`;
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
            Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-disp"), applyBackground);
            Array.prototype.forEach.call(util.$qsAll("div.wide-cell-row>.status-icon"), applyBackground);
            this.setStatusIconCoord(MacroImgFrameIndex.ENERGY,
                new Coord(this._wwaData.imgStatusEnergyX, this._wwaData.imgStatusEnergyY)
            );
            this.setStatusIconCoord(MacroImgFrameIndex.STRENGTH,
                new Coord(this._wwaData.imgStatusStrengthX, this._wwaData.imgStatusStrengthY)
            );
            this.setStatusIconCoord(MacroImgFrameIndex.DEFENCE,
                new Coord(this._wwaData.imgStatusDefenceX, this._wwaData.imgStatusDefenceY)
            );
            this.setStatusIconCoord(MacroImgFrameIndex.GOLD,
                new Coord(this._wwaData.imgStatusGoldX, this._wwaData.imgStatusGoldY)
            );

            this._setProgressBar(getProgress(1, 4, LoadStage.GAME_INIT));
            this._setLoadingMessage(ctxCover, 3);
            this._mapIDTableCreate();
            this._replaceAllRandomObjects();

            var t_end: number = new Date().getTime();
            console.log("Loading Complete!" + (t_end - t_start) + "ms");

            this._cvs = <HTMLCanvasElement>util.$id("wwa-map");
            var ctx = <CanvasRenderingContext2D>this._cvs.getContext("2d", {alpha:false});
            ctx.fillStyle = "rgba( 255, 255, 255, 0.5)";
            ctx.fillRect(0, 0, 440, 440);
            var playerPosition = new Position(this, this._wwaData.playerX, this._wwaData.playerY);
            this._camera = new Camera(playerPosition);
            this._itemMenu = new ItemMenu();
            var status = new Status(
                this._wwaData.statusEnergy, this._wwaData.statusStrength,
                this._wwaData.statusDefence, this._wwaData.statusGold);
            this._player = new Player(this, playerPosition, this._camera, status, this._wwaData.statusEnergyMax, this._wwaData.moves, this._wwaData.gameSpeedIndex);
            this._objectMovingDataManager = new ObjectMovingDataManager(this, this._player);
            this._camera.setPlayer(this._player);
            this._keyStore = new KeyStore();
            this._mouseStore = new MouseStore();
            this._gamePadStore = new GamePadStore();
            this._pages = [];
            this._yesNoJudge = YesNoState.UNSELECTED;
            this._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
            this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
            this._prevFrameEventExected = false;
            this._lastPage = undefined;
            this._reservedPartsAppearance = undefined;
            this._execPageInNextFrame = undefined;
            this._passwordLoadExecInNextFrame = false;

            //ロード処理の前に追加
            this._messageWindow = new MessageWindow(
                this, 50, 180, 340, 0, this._wwaData.mapCGName, false, true, false, util.$id("wwa-wrapper"));
            this._scoreWindow = new ScoreWindow(
                this, new Coord(50, 50), false, util.$id("wwa-wrapper"));

            this._wwaSave = new WWASave(wwa, wwa._wwaData.worldName, wwa._wwaData.worldPassNumber, this._checkSaveDataCompatibility.bind(this), failedLoadingSaveDataCauses => {
                if (failedLoadingSaveDataCauses.length > 0) {
                    let message = "これまでに保存されていたセーブデータは、下記の理由により消えたものがあります。";
                    failedLoadingSaveDataCauses.forEach((cause) => {
                        switch (cause) {
                            case LoadErrorCode.UNMATCHED_WORLD_NAME:
                                message += "\n・制作者によるマップデータのワールド名の変更";
                                break;
                            case LoadErrorCode.UNMATCHED_WORLD_PASS_NUMBER:
                                message += "\n・制作者によるマップデータの暗証番号の変更";
                                break;
                            case LoadErrorCode.DISALLOW_OLD_REVISION_WORLD_SAVE_DATA:
                                message += "\n・制作者によるマップデータの内容変更 (マップデータ制作者の設定により、内容が変更されるとセーブデータが消去されます)";
                                break;
                        }
                    });
                    alert(message);
                }
            });
            this._isDisallowLoadOldSave = disallowLoadOldSave;
            this._messageWindow.setWWASave(this._wwaSave);

            WWACompress.setRestartData(this._restartData, this._wwaData);
            this.clearFaces();
            const resumeSaveDataText = util.$id("wwa-wrapper").getAttribute("data-wwa-resume-savedata");
            if (typeof resumeSaveDataText === "string") {
                this._useSuspend = true;//中断モード
                if (resumeSaveDataText) {
                    //再開
                    var resumeData: WWAData = WWACompress.getStartWWAData(resumeSaveDataText);
                    if (this._restartData !== resumeData) {
                        this._applyQuickLoad(resumeData);
                        this._wwaSave.resumeStart();
                    }
                }
            }
            const autosaveString: string = util.$id("wwa-wrapper").getAttribute("data-wwa-autosave");
            if (autosaveString !== null) {
                this._wwaSave.setAutoSaveInterval(Number(autosaveString) | 0);
            }
            const lookingAroundString: string = util.$id("wwa-wrapper").getAttribute("data-wwa-looking-around");
            this._useLookingAround = !((lookingAroundString) && (lookingAroundString.match(/false/i)));

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


            this._mouseControllerElement = <HTMLDivElement>(util.$id("wwa-controller"));
            this._mouseControllerElement.addEventListener("mousedown", (e): void => {
                if (!this._isActive) { return; }
                if (e.which === 1) {
                    if (this._mouseStore.getMouseState() !== MouseState.NONE) {
                        e.preventDefault();
                        return;
                    }
                    // TODO: タッチ入力と似たようなコードになっているので統合する
                    const clickingPosition = util.$localPos(e.clientX, e.clientY);
                    const playerPosition = this._player.getDrawingCenterPosition();
                    const dist = clickingPosition.substract(playerPosition);
                    const dx = Math.abs(dist.x);
                    const dy = Math.abs(dist.y);
                    let dir: Direction;
                    let isPlayerInScreenEdge = false;
                    /*
                      プレイヤーと同じマスをタップしていて、画面端4辺にプレイヤーがいる場合
                      に、画面外にプレイヤーを動かすことを可能にする細かい処理

                      4辺(4隅以外)のマスについて:
                      プレイヤーが4辺のいずれかのマスにいる場合に、プレイヤーと同じマスをクリックした場合は下記のような挙動をします。
                      プレイヤーが左の辺にいる => 左の画面へ移動, 上の辺 => 上の画面へ移動, 下の辺 => 下の画面へ移動, 右の辺 => 右の辺へ移動

                      4隅の場合について:
                      プレイヤーが画面四隅のいずれかマスにいる場合に、プレイヤーと同じマスをクリックした場合は下記のような挙動をします。
                      (上下方向の方が左右方向より優先されます。)
                      プレイヤーが左上にいる => 上に移動, 左下 => 下に移動, 右上 => 上に移動, 右下 => 下に移動
                    */
                    if ((dx < Consts.CHIP_SIZE) && (dy < Consts.CHIP_SIZE)) {
                        switch ((playerPosition.x / Consts.CHIP_SIZE | 0)) {
                            case 0:
                                isPlayerInScreenEdge = true;
                                dir = Direction.LEFT;
                                break;
                            case Consts.H_PARTS_NUM_IN_WINDOW - 1:
                                isPlayerInScreenEdge = true;
                                dir = Direction.RIGHT;
                                break;
                        }
                        switch ((playerPosition.y / Consts.CHIP_SIZE | 0)) {
                            case 0:
                                isPlayerInScreenEdge = true;
                                dir = Direction.UP;
                                break;
                            case Consts.V_PARTS_NUM_IN_WINDOW - 1:
                                isPlayerInScreenEdge = true;
                                dir = Direction.DOWN;
                                break;
                        }

                    }
                    if (!isPlayerInScreenEdge) {
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
                    this._mouseStore.setPressInfo(dir, 0);
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
            if (window.TouchEvent) {
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

                this._mouseControllerElement.addEventListener("touchstart", (touchEvent): void => {
                    if (!this._isActive) { return; }
                    if (this._mouseStore.getMouseState() !== MouseState.NONE) {
                        touchEvent.preventDefault();
                        return;
                    }
                    const changedTouches = touchEvent.changedTouches;
                    const touchLength = changedTouches.length;
                    for (let touchID = 0; touchID < touchLength; touchID++) {
                        const changedTouch = changedTouches[touchID];
                        const touchedPosition = util.$localPos(changedTouch.clientX, changedTouch.clientY);
                        const playerPosition = this._player.getDrawingCenterPosition();
                        const dist = touchedPosition.substract(playerPosition);
                        const dx = Math.abs(dist.x);
                        const dy = Math.abs(dist.y);
                        let dir: Direction;
                        let isPlayerInScreenEdge = false;
                        /*
                          プレイヤーと同じマスをタップしていて、画面端4辺にプレイヤーがいる場合
                          に、画面外にプレイヤーを動かすことを可能にする細かい処理

                          4辺(4隅以外)のマスについて:
                          プレイヤーが4辺のいずれかのマスにいる場合に、プレイヤーと同じマスをタッチした場合は下記のような挙動をします。
                          プレイヤーが左の辺にいる => 左の画面へ移動, 上の辺 => 上の画面へ移動, 下の辺 => 下の画面へ移動, 右の辺 => 右の辺へ移動

                          4隅の場合について:
                          プレイヤーが画面四隅のいずれかマスにいる場合に、プレイヤーと同じマスをタッチした場合は下記のような挙動をします。
                          (上下方向の方が左右方向より優先されます。)
                          プレイヤーが左上にいる => 上に移動, 左下 => 下に移動, 右上 => 上に移動, 右下 => 下に移動
                        */
                        if ((dx < Consts.CHIP_SIZE) && (dy < Consts.CHIP_SIZE)) {
                            switch ((playerPosition.x / Consts.CHIP_SIZE | 0)) {
                                case 0:
                                    isPlayerInScreenEdge = true;
                                    dir = Direction.LEFT;
                                    break; 
                                case Consts.H_PARTS_NUM_IN_WINDOW - 1:
                                    isPlayerInScreenEdge = true;
                                    dir = Direction.RIGHT;
                                    break;
                            }
                            switch ((playerPosition.y / Consts.CHIP_SIZE | 0)) {
                                case 0:
                                    isPlayerInScreenEdge = true;
                                    dir = Direction.UP;
                                    break;
                                case Consts.V_PARTS_NUM_IN_WINDOW - 1:
                                    isPlayerInScreenEdge = true;
                                    dir = Direction.DOWN;
                                    break;
                            }

                        }
                        // 画面端4辺でない普通の場合
                        if (!isPlayerInScreenEdge) {
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
                        this._mouseStore.setPressInfo(dir, changedTouch.identifier);
                    }
                    if (touchEvent.cancelable) {
                        touchEvent.preventDefault();
                    }
                });

                const onTouchReleased = (event: TouchEvent): void => {
                    if (!this._isActive) { return; }
                    for (let i = 0; i < event.changedTouches.length; i++) {
                        if (this._mouseStore.getTouchID() === event.changedTouches[i].identifier) {
                            this._mouseStore.setReleaseInfo();
                            event.preventDefault();
                            break;
                        }
                    }
                };
                this._mouseControllerElement.addEventListener("touchend", onTouchReleased);
                this._mouseControllerElement.addEventListener("touchcancel", onTouchReleased);
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
                    this.onselectbutton(SidebarButton.GOTO_WWA, false, false);
                }
            });

            Array.prototype.forEach.call(util.$qsAll(".wide-cell-row"), (node: HTMLElement) => {
                node.addEventListener("click", () => {
                    this._displayHelp();
                });

            });

            this._frameCoord = new Coord(Consts.IMGPOS_DEFAULT_FRAME_X, Consts.IMGPOS_DEFAULT_YESNO_Y);
            this._battleEffectCoord = new Coord(Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_X, Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_Y);;

            this._battleEstimateWindow = new BattleEstimateWindow(
                this, this._wwaData.mapCGName, util.$id("wwa-wrapper"));

            this._passwordWindow = new PasswordWindow(
                this, <HTMLDivElement>util.$id("wwa-wrapper"), disallowLoadOldSave);

            this._monsterWindow = new MonsterWindow(
                this, new Coord(50, 180), 340, 60, false, util.$id("wwa-wrapper"), this._wwaData.mapCGName);
            this._setProgressBar(getProgress(3, 4, LoadStage.GAME_INIT));

            this._isLoadedSound = false;
            this._temporaryInputDisable = false;
            this._paintSkipByDoorOpen = false
            this._clearFacesInNextFrame = false
            this._useConsole = false;
            
            this.wwaCustomEvent('wwa_startup');
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


            this._cgManager = new CGManager(ctx, this._wwaData.mapCGName, this._frameCoord, (): void => {
                this._isSkippedSoundMessage = true;
                const setGameStartingMessageWhenPcOrSP = () => {
                    switch (this.userDevice.device) {
                        case DEVICE_TYPE.PC:
                            this.generatePageAndReserveExecution("ゲームを開始します。\n画面をクリックしてください。", false, true);
                            break;
                        case DEVICE_TYPE.SP:
                            this.generatePageAndReserveExecution("ゲームを開始します。\n画面にふれてください。", false, true);
                            break;
                    }
                };
                if (this._wwaData.systemMessage[SystemMessage2.LOAD_SE] === "ON") {
                    this._isLoadedSound = true;
                    setGameStartingMessageWhenPcOrSP();
                    this._setLoadingMessage(ctxCover, LoadStage.AUDIO);
                    this.loadSound();
                    window.requestAnimationFrame(this.soundCheckCaller);
                    return;
                } else if (this._wwaData.systemMessage[SystemMessage2.LOAD_SE] === "OFF") {
                    this._isLoadedSound = false;
                    setGameStartingMessageWhenPcOrSP();
                    this.openGameWindow();
                    return;
                } // 読み込みメッセージをスキップした場合、処理はここまで
                this._isSkippedSoundMessage = false;
                if (!this._hasTitleImg) {
                    ctxCover.clearRect(0, 0, Consts.SCREEN_WIDTH, Consts.SCREEN_HEIGHT);
                }

                if (this._usePassword) {
                    let showMessage = "効果音・ＢＧＭデータをロードしますか？";
                    if (canDisplayUserVars) {
                        showMessage += "\n\n※変数表示が有効になっています。\n公開前に必ずHTMLファイル内の\n data-wwa-display-user-vars=\"true\" \nを消してください。"
                    }
                    this._messageWindow.setMessage(
                        this._wwaData.systemMessage[SystemMessage2.LOAD_SE] === "" ?
                            showMessage :
                            this._wwaData.systemMessage[SystemMessage2.LOAD_SE]
                    );
                    // TODO: システムメッセージなのでメッセージウィンドウの中央配置が必要かも
                    this._messageWindow.show();
                    this._setProgressBar(getProgress(4, 4, LoadStage.GAME_INIT));
                    var timer = setInterval((): void => {
                        this._keyStore.update();
                        this._gamePadStore.update();

                        if (this._yesNoJudgeInNextFrame === YesNoState.UNSELECTED) {
                            if (
                                this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                                this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)
                            ) {
                                this._yesNoJudgeInNextFrame = YesNoState.YES
                            } else if (
                                this._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                                this._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                                this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_B)
                            ) {
                                this._yesNoJudgeInNextFrame = YesNoState.NO
                            }
                        }

                        if (this._yesNoJudgeInNextFrame === YesNoState.YES) {
                            clearInterval(timer);
                            this._messageWindow.update();
                            this._yesNoJudge = this._yesNoJudgeInNextFrame;
                            this._messageWindow.setInputDisable();
                            setTimeout((): void => {
                                this._player.setDelayFrame();
                                this._messageWindow.hide();
                                this._yesNoJudge = YesNoState.UNSELECTED;
                                this._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
                                this._isLoadedSound = true;
                                this._setLoadingMessage(ctxCover, LoadStage.AUDIO);
                                this.loadSound();
                                window.requestAnimationFrame(this.soundCheckCaller);
                            }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                        }

                        else if (this._yesNoJudgeInNextFrame === YesNoState.NO) {
                            clearInterval(timer);
                            this._messageWindow.update();
                            this._yesNoJudge = this._yesNoJudgeInNextFrame;
                            this._messageWindow.setInputDisable();
                            setTimeout((): void => {
                                this._player.setDelayFrame();
                                this._messageWindow.hide();
                                this._yesNoJudge = YesNoState.UNSELECTED;
                                this._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
                                this._isLoadedSound = false;
                                this.openGameWindow();
                            }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                        }
                    }, Consts.DEFAULT_FRAME_INTERVAL);

                } else {
                    clearInterval(timer);
                    this._player.setDelayFrame();
                    this._messageWindow.hide();
                    this._yesNoJudge = YesNoState.UNSELECTED;
                    this._yesNoJudgeInNextFrame = YesNoState.UNSELECTED;
                    this._isLoadedSound = true;
                    this.loadSound();
                    window.requestAnimationFrame(this.soundCheckCaller);
                }
            });

            this.wwaCustomEvent('wwa_start');
        }
        const eventEmitter: WWALoaderEventEmitter = new BrowserEventEmitter();
        const mapDataHandler = (mapData: WWAData) =>  this._loadHandler(mapData);
        const progressHandler = (progress: Progress) => this._setProgressBar(progress);
        const errorHandler = (error: LoaderError) => this._setErrorMessage("下記のエラーが発生しました。: \n" + error.message, ctxCover);
        // TODO removeListener
        eventEmitter.addListener("mapData", mapDataHandler )
        eventEmitter.addListener("progress", progressHandler )
        eventEmitter.addListener("error", errorHandler )
        const loader = new WWALoader(mapFileName, eventEmitter);
        loader.requestAndLoadMapData().then(async () => {
            this._canDisplayUserVars = canDisplayUserVars;
            this._userVarNameList = [];
            if (!this._canDisplayUserVars) {
                return undefined;;
            }
            this._inlineUserVarViewer = { topUserVarIndex: 0, isVisible: false };
            // ユーザー変数ファイルを読み込む
            return userVarNamesFile ? fetchJsonFile(userVarNamesFile) : {
                kind: "noFileSpecified" as const,
                errorMessage: "data-wwa-user-var-names-file 属性に、変数の説明を記したファイル名を書くことで、その説明を表示できます。詳しくはマニュアルをご覧ください。"
            }
        }).then(status => {
            if (!status) {
                return;
            }
            if (status.kind === "noFileSpecified") {
                // noFileSpecified の場合は、こういうこともできますよ、という案内なのでエラーにはしない
                this._updateVarDumpInformationArea(status.errorMessage, false);
                return;
            }
            if(status.kind !== "data") {
                this._userVarNameListRequestError = status;
                this._updateVarDumpInformationArea(this._userVarNameListRequestError.errorMessage, true);
                return;
            }
            if (!status.data || typeof status.data !== "object") {
                this._userVarNameListRequestError = {
                    kind: "notObject",
                    errorMessage: `ユーザ変数一覧 ${userVarNamesFile} が正しい形式で書かれていません。`
                }
                this._updateVarDumpInformationArea(this._userVarNameListRequestError.errorMessage, true);
                return;
            }
            this._userVarNameList = this.convertUserVariableNameListToArray(status.data);
            if (this._dumpElement === null) {
                return;
            }
            // 以下は変数一覧に変数名を流し込む処理
            for (var i = 0; i < Consts.USER_VAR_NUM; i++) {
                const varNum = i.toString(10);
                if (!this._userVarNameList[i]) {
                    continue;
                }
                const varIndexQuery = `.var-index${varNum}`;
                const varIndexElement = this._dumpElement.querySelector(varIndexQuery);
                const varLabelElement = varIndexElement.querySelector(`${varIndexQuery} > div`);
                varLabelElement.textContent = this._userVarNameList[i];
                varIndexElement.setAttribute("data-labelled-var-index", "true");
                varIndexElement.addEventListener("mouseover", () => varLabelElement.removeAttribute("aria-hidden"))
                varIndexElement.addEventListener("mouseleave", () => varLabelElement.setAttribute("aria-hidden", "true"));
            }
        });
    }

    /**
     *  ユーザー変数名前リストのオブジェクトを、ユーザ変数の個数文の配列に変換する
     * { "0": "hoge", "1": "fuga", "4": "foo" } => ["hoge", "fuga", undefined, undefined, "foo", undefined ... undefined]
     **/
    private convertUserVariableNameListToArray(userVariableNameList: object): string[] {
        const userVariableNames = new Array<string>(Consts.USER_VAR_NUM);
        for (let i = 0; i < Consts.USER_VAR_NUM; i++) {
            userVariableNames[i] = undefined;
        }
        Object.keys(userVariableNameList).forEach(key => {
            const keyNumber = parseInt(key, 10);
            if (
                typeof userVariableNameList[key] !== "string" ||
                typeof key !== "string" ||
                isNaN(keyNumber) ||
                keyNumber < 0 ||
                keyNumber >= Consts.USER_VAR_NUM
            ) {
                return;
            }
            userVariableNames[keyNumber] = userVariableNameList[key];
        });
        return userVariableNames;
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
            ctx.fillText("WWA Wing Ver." + VERSION_WWAJS, LoadingMessagePosition.FOOTER_X, LoadingMessagePosition.COPYRIGHT_Y);
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

    public createSoundInstance(soundId: number): void {
        if (soundId === 0 || soundId === SystemSound.NO_SOUND || this.sounds[soundId]) {
            return;
        }
        const filePath = `${this._audioDirectory}${soundId}.${this.audioExtension}`;
        this.sounds[soundId] = new Sound(soundId, filePath, this.audioContext, this.audioGain);
    }

    public loadSound(): void {
        this.sounds = new Array(Consts.SOUND_MAX + 1);

        this.createSoundInstance(SystemSound.DECISION);
        this.createSoundInstance(SystemSound.ATTACK);

        for (let partsId = 1; partsId < this._wwaData.mapPartsMax; partsId++) {
            const soundId = this._wwaData.mapAttribute[partsId][Consts.ATR_SOUND];
            this.createSoundInstance(soundId);
        }
        for (let partsId = 1; partsId < this._wwaData.objPartsMax; partsId++) {
            if (this._wwaData.objectAttribute[partsId][Consts.ATR_TYPE] === Consts.OBJECT_RANDOM) {
                continue;
            }
            const soundId = this._wwaData.objectAttribute[partsId][Consts.ATR_SOUND];
            this.createSoundInstance(soundId);
        }
        // 全メッセージを解析し、$sound マクロのパラメータからロードすべきサウンド番号を全取得し、ロードする。
        this._wwaData.message.forEach(message =>
            message
                .split("\n")
                .forEach(line => {
                    const matchResult = line.match(/^\$sound=(\d+)/);
                    if (!matchResult || matchResult.length < 2) {
                        return;
                    }
                    const id = parseInt(matchResult[1], 10);
                    if (!isNaN(id) && 0 < id && id < SystemSound.NO_SOUND) {
                        this.createSoundInstance(id);
                    }
                })
        );
        this._wwaData.bgm = 0;
        this._soundLoadSkipFlag = false;
    }

    public checkAllSoundLoaded(): void {
        let loadedNum = 0;
        let total = 0;
        if (!this._hasTitleImg) {
            var ctxCover = <CanvasRenderingContext2D>this._cvsCover.getContext("2d");
        } // 本当はコンストラクタで生成した変数を利用したかったけど、ゆるして
        this._keyStore.update();
        if (this._keyStore.getKeyState(KeyCode.KEY_SPACE) === KeyState.KEYDOWN) {
            this._soundLoadSkipFlag = true;
        }
        for (let i = 1; i <= Consts.SOUND_MAX; i++) {
            const instance = this.sounds[i];
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
            window.requestAnimationFrame(this.soundCheckCaller);
            return;
        }

        this._setProgressBar(getProgress(Consts.SOUND_MAX, Consts.SOUND_MAX, LoadStage.AUDIO));
        this._setLoadingMessage(ctxCover, LoadStage.FINISH);
        this.openGameWindow();
    }

    /**
     * 音楽ファイルがロードされたかの確認を 100ms 間隔で行うように設定します。
     * ロードが完了した場合には再生します。
     * @param targetSoundId 確認する音楽ファイルのサウンド番号
     */
    private _setSoundLoadedCheckTimer(targetSoundId: number): void {
        const targetAudio = this.sounds[targetSoundId];
        // 対象音源が存在しないなど、エラーの場合は何度確認しても無駄なので何もせず終了
        if (targetAudio.isError()) {
            return;
        }
        this.soundLoadedCheckTimer = window.setInterval((): void => {
            // 本来鳴っているはずのBGMが targetSoundId 番であるときは再生
            if (this._wwaData.bgm === targetSoundId) {
                if (targetAudio.hasData()) {
                    targetAudio.play();
                    this._wwaData.bgm = targetSoundId;
                    this._clearSoundLoadedCheckTimer();
                } else if (targetAudio.isError()) {
                    // 途中でロードがエラーになった場合はそこでチェックを終了
                    this._clearSoundLoadedCheckTimer();
                }
            } else {
                // 他のBGMが鳴っているはずの設定になっているなら、タイマーを止める
                // そのBGMの再生系の処理は playSound で実行されているはずなので、ここでは何もしない
                this._clearSoundLoadedCheckTimer();
            }
        }, 100);
    }

    private _clearSoundLoadedCheckTimer(): void {
        if(this.soundLoadedCheckTimer) {
            clearInterval(this.soundLoadedCheckTimer);
            this.soundLoadedCheckTimer = undefined;
        }
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
            if (this.sounds[this._wwaData.bgm].hasData()) {
                this.sounds[this._wwaData.bgm].pause();
            }
            this._wwaData.bgm = 0;
        }

        if (id === 0 || id === SystemSound.NO_SOUND) {
            return;
        }
        const audioInstance = this.sounds[id];
        if (!audioInstance.hasData()) {
            if (id >= SystemSound.BGM_LB) {
               /* 
                  音源がロードされていなくても、QuickLoad などでゲーム状態を復元したときにはBGMを復元しなければならない。
                  ので、ゲームデータ上にはBGM設定を反映する
                */
                this._wwaData.bgm = id;
                this._setSoundLoadedCheckTimer(id);
            }
        } else {
            if (id >= SystemSound.BGM_LB) {
                this.sounds[id].play();
                this._wwaData.bgm = id;
            } else {
                this.sounds[id].play();
            }
        }

    }

    public openGameWindow(): void {
        var ppos = this._player.getPosition();
        util.$id("wwa-cover").style.opacity = "0";
        if (this.getObjectIdByPosition(ppos) !== 0) {
            this._player.setPartsAppearedFlag();
        }

        //ゲーム開始直後に中断データ再開
        var resumeSaveDataText = util.$id("wwa-wrapper").getAttribute("data-wwa-resume-savedata");
        if (typeof resumeSaveDataText === "string") {
            this._useSuspend = true;//中断モード
            if (resumeSaveDataText) {
                //再開
                var resumeData: WWAData = WWACompress.getStartWWAData(resumeSaveDataText);
                if (this._restartData !== resumeData) {
                    this._applyQuickLoad(resumeData);
                    this._wwaSave.resumeStart();
                }
            }
        }

        setTimeout( () => {
            util.$id("wwa-wrapper").removeChild(util.$id("wwa-cover"));
            // TODO: これが表示終わるまでプレイヤーをcontrollableにしない
            //                setTimeout(this.mainCaller, Consts.DEFAULT_FRAME_INTERVAL, this);
            this._main();
        }, Consts.SPLASH_SCREEN_DISP_MILLS);

    }

    public mainCaller = () => this._main();
    public soundCheckCaller = () => this.checkAllSoundLoaded();

    /**
     * アイテムを使用。
     * @param itemPos アイテムのID
     * @returns {boolean} 使用できる場合
     */
    public onselectitem(itemPos: number): boolean {
        if (this._player.canUseItem(itemPos)) {
            var bg = <HTMLDivElement>(util.$id("item" + (itemPos - 1)));
            bg.classList.add("onpress");
            this.playSound(SystemSound.DECISION);
            if (this._wwaData.message[SystemMessage1.USE_ITEM] === "BLANK") {
                this._player.readyToUseItem(itemPos);
                var itemID = this._player.useItem();
                var mesID = this.getObjectAttributeById(itemID, Consts.ATR_STRING);
                this.generatePageAndReserveExecution(
                    this.getMessageById(mesID),
                    false, false, itemID, PartsType.OBJECT,
                    this._player.getPosition().getPartsCoord());
            } else {
                this.generatePageAndReserveExecution(
                    this._wwaData.message[SystemMessage1.USE_ITEM] === "" ?
                        "このアイテムを使用します。\nよろしいですか?" :
                        this._wwaData.message[SystemMessage1.USE_ITEM], true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_ITEM_USE;
                this._yesNoUseItemPos = itemPos;
            }
            return true;
        }
        return false;
    }

    public onselectbutton(button: SidebarButton, forcePassword: boolean = false, forceGoToWWA: boolean = false): void {
        var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[button]));
        this.playSound(SystemSound.DECISION);
        this._itemMenu.close();
        bg.classList.add("onpress");
        if (button === SidebarButton.QUICK_LOAD) {
            this._yesNoChoiceCallInfo = this._wwaSave.getFirstSaveChoiceCallInfo(forcePassword);
            switch (this._yesNoChoiceCallInfo) {
                case ChoiceCallInfo.CALL_BY_QUICK_LOAD:
                case ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD:
                    var secondCallInfo: ChoiceCallInfo;
                    var loadTest: string = "";
                    switch (this._yesNoChoiceCallInfo) {
                        case ChoiceCallInfo.CALL_BY_QUICK_LOAD:
                            loadTest = "読み込むデータを選んでください。";
                            this._wwaSave.selectDBSaveDataList();
                            break;
                        case ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD:
                            loadTest = "読み込むオートセーブを選んでください。";
                            this._wwaSave.selectLogSaveDataList();
                            break;
                    }
                    secondCallInfo = this._wwaSave.getSecondSaveChoiceCallInfo(this._usePassword);//クイックロード後の選択肢
                    this._messageWindow.createSaveDom();
                    switch (secondCallInfo) {
                        case ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD:
                            this.generatePageAndReserveExecution(loadTest+"\n→Ｎｏでオートセーブ復帰画面に移ります。", true, true);
                            break;
                        case ChoiceCallInfo.CALL_BY_PASSWORD_LOAD:
                            this.generatePageAndReserveExecution(loadTest +"\n→Ｎｏでデータ復帰用パスワードの\n　入力選択ができます。", true, true);
                            break;
                        case ChoiceCallInfo.NONE:
                            this.generatePageAndReserveExecution(loadTest, true, true);
                            break;
                    }
                    break;
                case ChoiceCallInfo.CALL_BY_PASSWORD_LOAD:
                    this.onpasswordloadcalled();
                    break;
            }
        } else if (button === SidebarButton.QUICK_SAVE) {
            if (!this._wwaData.disableSaveFlag) {
                this._wwaSave.selectDBSaveDataList();
                this._messageWindow.createSaveDom();
                if (this._usePassword) {
                    this.generatePageAndReserveExecution("データの一時保存先を選んでください。\n→Ｎｏでデータ復帰用パスワードの\n　表示選択ができます。", true, true);
                    this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_QUICK_SAVE;
                } else {
                    this.generatePageAndReserveExecution("データの一時保存先を選んでください。", true, true);
                    this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_QUICK_SAVE;
                }
            } else {
                this.generatePageAndReserveExecution("ここではセーブ機能は\n使用できません。", false, true);
            }
        } else if (button === SidebarButton.RESTART_GAME) {
            this.generatePageAndReserveExecution("初めからスタートしなおしますか？", true, true);
            this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_RESTART_GAME;
        } else if (button === SidebarButton.GOTO_WWA) {
            if (forceGoToWWA) {
                // F8 で Goto WWAを選んだ場合で、Goto WWAボタンが表示されていない場合は、
                // Battle Report ボタンを凹ませない
                if (this._bottomButtonType !== ControlPanelBottomButton.GOTO_WWA) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                }
                this.generatePageAndReserveExecution("ＷＷＡの公式サイトを開きますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_GOTO_WWA;
            } else {
                switch (this._bottomButtonType) {
                    case ControlPanelBottomButton.GOTO_WWA:
                        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_GOTO_WWA;
                        this.generatePageAndReserveExecution("ＷＷＡの公式サイトを開きますか？", true, true);
                        break;
                    case ControlPanelBottomButton.GAME_END:
                        this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_END_GAME;
                        this.generatePageAndReserveExecution("ＷＷＡゲームを終了しますか？", true, true);
                        break;
                    case ControlPanelBottomButton.BATTLE_REPORT:
                        this.launchBattleEstimateWindow();
                        break;
                }
            }
        }
    }
    public onpasswordloadcalled() {
        if (this._usePassword) {
            var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]));
            bg.classList.add("onpress");
            this.generatePageAndReserveExecution("データ復帰用のパスワードを入力しますか？", true, true);
            this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
        } else {
            this.generatePageAndReserveExecution("セーブデータがありません。", false, true);
        }
    }

    public onpasswordsavecalled() {
        var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]));
        bg.classList.add("onpress");
        if (!this._wwaData.disableSaveFlag) {
            if (this._useSuspend) {//中断モード
                this.generatePageAndReserveExecution("ゲームを中断しますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_SUSPEND;
            } else if (this._usePassword) {
                this.generatePageAndReserveExecution("データ復帰用のパスワードを表示しますか？", true, true);
                this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_PASSWORD_SAVE;
            }
        } else {
            this.generatePageAndReserveExecution("ここではセーブ機能は\n使用できません。", false, true);
        }
    }
    public onpasssuspendsavecalled() {
        var bg = <HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]));
        bg.classList.add("onpress");
        if (!this._wwaData.disableSaveFlag) {
            this.generatePageAndReserveExecution("ゲームを中断しますか？", true, true);
            this._yesNoChoiceCallInfo = ChoiceCallInfo.CALL_BY_SUSPEND;
        } else {
            this.generatePageAndReserveExecution("ここではセーブ機能は\n使用できません。", false, true);
        }

    }
    public onitemmenucalled() {
        this.generatePageAndReserveExecution("右のメニューを選択してください。", false, true);
        this._messageWindow.setItemMenuChoice(true);
        this.playSound(SystemSound.DECISION);
        this._itemMenu.openView();
    }

    public onchangespeed(type: SpeedChange) {
        if (!this._wwaData.permitChangeGameSpeed) {
            this.generatePageAndReserveExecution("ここでは移動速度を\n変更できません。", false, true);
            return;
        }
        var speedIndex: number, speedMessage: string;
        if (type === SpeedChange.UP) {
            speedIndex = this._player.speedUp();
        } else {
            speedIndex = this._player.speedDown();
        }
        speedMessage = "移動速度を【" + speedNameList[speedIndex] + "】に切り替えました。\n" +
            (this.isBattleSpeedIndexForQuickBattle(speedIndex) ? "戦闘も速くなります。\n" : "") +
            "(" + (Consts.MAX_SPEED_INDEX + 1) + "段階中" + (speedIndex + 1) + "）";
        // TODO(rmn): 適切な分岐に直したい
        switch (this.userDevice.os) {
            case OS_TYPE.NINTENDO:
                speedMessage += "速度を落とすには-ボタン, 速度を上げるには+ボタンを押してください。";
                break;
            default:
                speedMessage += "速度を落とすにはIキー, 速度を上げるにはPキーを押してください。";
                break;
        }
        this.generatePageAndReserveExecution(speedMessage, false, true);
    }

    public isBattleSpeedIndexForQuickBattle(battleSpeedIndex: number): boolean {
        return Consts.QUICK_BATTLE_SPEED_INDECIES.some(index => index === battleSpeedIndex);
    }

    /**
     * 方向キーと同時押しで、移動せずにプレイヤーの向きを変更するキーの入力判定
     */
    private _checkTurnKeyPressed = () => (
        this._keyStore.checkHitKey(KeyCode.KEY_ESC)  ||
        this._keyStore.checkHitKey(KeyCode.KEY_SHIFT) ||
        this._keyStore.checkHitKey(KeyCode.KEY_N)
    );


    private _executeNode(node: Node | undefined, tokenValues: ExpressionParser.TokenValues): ParsedMessage[] {
        if (node instanceof ParsedMessage) {
            node.macro?.forEach(macro => macro.execute());
            return [node, ...this._executeNode(node.next, tokenValues)];
        } else if (node instanceof Junction) {
            const next = node.evaluateAndGetNextNode(tokenValues);
            return next ? this._executeNode(next, tokenValues) : [];
        }
        // node === undefined
        return [];
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
            window.requestAnimationFrame(this.mainCaller);
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
        if (this._reservedPartsAppearance) {
            this.appearParts(this._reservedPartsAppearance);
            this._reservedPartsAppearance = undefined;
        }
        if (this._execPageInNextFrame) {
            const messageLines = this._executeNode(this._execPageInNextFrame.firstNode, this._generateTokenValues());

            // executeNode の結果、ゲームオーバーになるなどして、execPageInNextFrame がクリアされた場合は以下の処理は実行しない
            if (this._execPageInNextFrame) {
                if (this._lastPage?.isEmpty && this._lastPage.isLastPage && this._reservedMoveMacroTurn !== void 0) {
                    this._player.setMoveMacroWaiting(this._reservedMoveMacroTurn);
                    this._reservedMoveMacroTurn = void 0;
                }

                const messageLinesToDisplay = messageLines.filter(line => !line.isEmpty());
                const existsMessageToDisplay = messageLinesToDisplay.length > 0;
                // set message
                if (existsMessageToDisplay) {
                    const message = messageLinesToDisplay.map(line => line.generatePrintableMessage()).join("\n");
                    this._messageWindow.setMessage(message);
                    this._messageWindow.setYesNoChoice(this._execPageInNextFrame.showChoice);
                    this._messageWindow.setPositionByPlayerPosition(
                        this._faces.length !== 0,
                        this._scoreWindow.isVisible(),
                        this._execPageInNextFrame.isSystemMessage,
                        this._player.getPosition(),
                        this._camera.getPosition()
                    );
                    this._player.setMessageWaiting();
                } else {
                    if (this._pages.length === 0) {
                        this._hideMessageWindow(existsMessageToDisplay);
                    } else {
                        this._setNextPage();
                    }
                }
                this._lastPage = {
                    isEmpty: !existsMessageToDisplay,
                    isLastPage: this._execPageInNextFrame.isLastPage
                }
                this._execPageInNextFrame = undefined;
            } else {
                this._lastPage = undefined;
            }
        }

        // キー入力とプレイヤー移動
        ////////////// DEBUG IMPLEMENTATION //////////////////////
        /////// 本番では必ず消すこと /////////////////////////////
        //            this.debug = this._keyStore.checkHitKey(KeyCode.KEY_SPACE);
        //////////////////////////////////////////////////////////
        this._player.mainFrameCount();//プレイ時間を計測加算
        var prevPosition = this._player.getPosition();

        var pdir = this._player.getDir();


        if (this._player.isControllable()) {
            if (!this._wwaData.disableSaveFlag) {
                //オートセーブ処理
                if (this._wwaSave.isAutoSaveFrame(this._player)) {
                    this._quickSave(ChoiceCallInfo.CALL_BY_LOG_QUICK_SAVE)
                }
            }
            if (this._player.isDelayFrame()) {
                /*
                 * メッセージ表示直後、何も操作しないフレームを用意する。
                 * ショップで1フレーム待機しないと効果音付きのアイテムが入手されないため、
                 * ゲームパッド使用時に購入アイテムが入手されないケースがあることの対処
                 */
                this._player.updateDelayFrame();
            } else {
                    //マクロ用処理割込
                if (this._actionGamePadButtonItemMacro()) {

                    //getKeyStateForControllPlayer　分岐
                } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_LEFT) === KeyState.KEYDOWN) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.LEFT);
                    } else {
                        this._player.controll(Direction.LEFT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_UP) === KeyState.KEYDOWN) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.UP);
                    } else {
                        this._player.controll(Direction.UP);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_RIGHT) === KeyState.KEYDOWN) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.RIGHT);
                    } else {
                        this._player.controll(Direction.RIGHT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_DOWN) === KeyState.KEYDOWN) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.DOWN);
                    } else {
                        this._player.controll(Direction.DOWN);
                        this._objectMovingDataManager.update();
                    }


                    //getMouseStateForControllPlayer　分岐
                } else if (this._mouseStore.getMouseStateForControllPlayer(Direction.LEFT) === MouseState.MOUSEDOWN) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.LEFT);
                    } else {
                        this._player.controll(Direction.LEFT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._mouseStore.getMouseStateForControllPlayer(Direction.UP) === MouseState.MOUSEDOWN) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.UP);
                    } else {
                        this._player.controll(Direction.UP);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._mouseStore.getMouseStateForControllPlayer(Direction.RIGHT) === MouseState.MOUSEDOWN) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.RIGHT);
                    } else {
                        this._player.controll(Direction.RIGHT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._mouseStore.getMouseStateForControllPlayer(Direction.DOWN) === MouseState.MOUSEDOWN) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.DOWN);
                    } else {
                        this._player.controll(Direction.DOWN);
                        this._objectMovingDataManager.update();
                    }

                    //checkHitKey　pdir　分岐
                } else if (this._keyStore.checkHitKey(dirToKey[pdir])) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(pdir);
                    } else {
                        this._player.controll(pdir);
                        this._objectMovingDataManager.update();
                    }
                    //checkHitKey　分岐
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT)) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.LEFT);
                    } else {
                        this._player.controll(Direction.LEFT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP)) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.UP);
                    } else {
                        this._player.controll(Direction.UP);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT)) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.RIGHT);
                    } else {
                        this._player.controll(Direction.RIGHT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN)) {
                    if (this._checkTurnKeyPressed()) {
                        this._player.setDir(Direction.DOWN);
                    } else {
                        this._player.controll(Direction.DOWN);
                        this._objectMovingDataManager.update();
                    }
                    //checkClickMouse　分岐
                } else if (this._mouseStore.checkClickMouse(Direction.LEFT)) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.LEFT);
                    } else {
                        this._player.controll(Direction.LEFT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._mouseStore.checkClickMouse(Direction.UP)) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.UP);
                    } else {
                        this._player.controll(Direction.UP);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._mouseStore.checkClickMouse(Direction.RIGHT)) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.RIGHT);
                    } else {
                        this._player.controll(Direction.RIGHT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._mouseStore.checkClickMouse(Direction.DOWN)) {
                    if (this._mouseStore.touchIDIsSetDir()) {
                        this._player.setDir(Direction.DOWN);
                    } else {
                        this._player.controll(Direction.DOWN);
                        this._objectMovingDataManager.update();
                    }
                    //crossPressed　分岐
                } else if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                    if (this._gamePadStore.buttonPressed(GamePadState.BUTTON_INDEX_B)) {
                        this._player.setDir(Direction.LEFT);
                    } else {
                        this._player.controll(Direction.LEFT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                    if (this._gamePadStore.buttonPressed(GamePadState.BUTTON_INDEX_B)) {
                        this._player.setDir(Direction.UP);
                    } else {
                        this._player.controll(Direction.UP);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                    if (this._gamePadStore.buttonPressed(GamePadState.BUTTON_INDEX_B)) {
                        this._player.setDir(Direction.RIGHT);
                    } else {
                        this._player.controll(Direction.RIGHT);
                        this._objectMovingDataManager.update();
                    }
                } else if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                    if (this._gamePadStore.buttonPressed(GamePadState.BUTTON_INDEX_B)) {
                        this._player.setDir(Direction.DOWN);
                    } else {
                        this._player.controll(Direction.DOWN);
                        this._objectMovingDataManager.update();
                    }
                    //アイテムショートカット
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
                    //移動速度
                } else if (this._keyStore.getKeyState(KeyCode.KEY_I) ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_MINUS)) {
                    this.onchangespeed(SpeedChange.DOWN);
                } else if (
                    this._keyStore.checkHitKey(KeyCode.KEY_P) ||
                    this._keyStore.checkHitKey(KeyCode.KEY_F2) ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_PLUS)) {
                    this.onchangespeed(SpeedChange.UP);
                    // 戦闘結果予測 
                } else if (
                    this._keyStore.getKeyState(KeyCode.KEY_F1) === KeyState.KEYDOWN ||
                    this._keyStore.getKeyState(KeyCode.KEY_M) === KeyState.KEYDOWN ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)) {
                    if (this.launchBattleEstimateWindow()) {
                    }
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_F3)) {
                    this.playSound(SystemSound.DECISION);
                    this.onselectbutton(SidebarButton.QUICK_LOAD, true);
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_F4)) {
                    this.playSound(SystemSound.DECISION);
                    if (this._useSuspend) {//中断モード
                        this.onpasssuspendsavecalled();
                    } else if (this._usePassword) {
                        this.onpasswordsavecalled();
                    }
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
                    this.onselectbutton(SidebarButton.GOTO_WWA, false, true);
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_F9) ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_X)) {
                    if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                        this.onitemmenucalled();
                    }
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_V)) {
                    this._displayUserVars();
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_F12) ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_Y)) {
                    // コマンドのヘルプ 
                    this._displayHelp();
                }
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
                if (this._messageWindow.isSaveChoice()) {
                    //セーブ領域参照
                    this._messageWindow.saveUpdate();
                    if (!this._messageWindow.isSaveClose()) {
                        if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                            this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                            this._messageWindow.saveControll(Direction.LEFT);
                        } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                            this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                            this._messageWindow.saveControll(Direction.UP);
                        } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                            this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                            this._messageWindow.saveControll(Direction.RIGHT);
                        } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                            this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                            this._messageWindow.saveControll(Direction.DOWN);
                        }
                    }
                }
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
                    this._itemMenu.controll(Direction.LEFT);
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                    this._itemMenu.controll(Direction.UP);
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                    this._itemMenu.controll(Direction.RIGHT);
                } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                    this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                    this._itemMenu.controll(Direction.DOWN);
                }
                if (
                    this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                    this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                    this._gamePadStore.buttonTrigger(GamePadState.BUTTON_INDEX_A)
                ) {
                    this._setNextPage();
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
                    this._setNextPage();
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
                    this._setNextPage();

                }
            }

            // ユーザー変数表示モードの場合
            if (this._inlineUserVarViewer?.isVisible) {
                let isInputKey = false;
                if (this._keyStore.getKeyState(KeyCode.KEY_DOWN) === KeyState.KEYDOWN) {
                    this._inlineUserVarViewer.topUserVarIndex++;
                    isInputKey = true;
                }
                if (this._keyStore.getKeyState(KeyCode.KEY_UP) === KeyState.KEYDOWN) {
                    this._inlineUserVarViewer.topUserVarIndex--;
                    isInputKey = true;
                }
                if (this._keyStore.getKeyState(KeyCode.KEY_RIGHT) === KeyState.KEYDOWN) {
                    this._inlineUserVarViewer.topUserVarIndex += Consts.INLINE_USER_VAR_VIEWER_DISPLAY_NUM;
                    isInputKey = true;
                }
                if (this._keyStore.getKeyState(KeyCode.KEY_LEFT) === KeyState.KEYDOWN) {
                    this._inlineUserVarViewer.topUserVarIndex -= Consts.INLINE_USER_VAR_VIEWER_DISPLAY_NUM;
                    isInputKey = true;
                }
                // 0 - USER_VAR_NUMの範囲外ならループさせる
                if (this._inlineUserVarViewer.topUserVarIndex < 0) {
                    this._inlineUserVarViewer.topUserVarIndex += (Consts.USER_VAR_NUM);
                }
                if (this._inlineUserVarViewer.topUserVarIndex > Consts.USER_VAR_NUM) {
                    this._inlineUserVarViewer.topUserVarIndex -= (Consts.USER_VAR_NUM);
                }
                if (isInputKey) {
                    this._setNextPage();
                    this._inlineUserVarViewer.isVisible = true;
                    this._displayUserVars();
                }
                if (this._keyStore.getKeyState(KeyCode.KEY_V) === KeyState.KEYDOWN) {
                    this._setNextPage();
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
            window.requestAnimationFrame(this.mainCaller);
        } else {
            this._fadeout((): void => {
                if (this._loadType === LoadType.QUICK_LOAD) {
                    this._quickLoad();
                    this.wwaCustomEvent('wwa_quickload');
                } else if (this._loadType === LoadType.RESTART_GAME) {
                    this._restartGame();
                    this.wwaCustomEvent('wwa_restert');
                } else if (this._loadType === LoadType.PASSWORD) {
                    this._applyQuickLoad(this._passwordSaveExtractData);
                    this._passwordSaveExtractData = void 0;
                    this.wwaCustomEvent('wwa_passwordload');
                }
                setTimeout(this.mainCaller, Consts.DEFAULT_FRAME_INTERVAL, this)
            });
        }
        if (this._dumpElement !== null) {
            for (var i = 0; i < Consts.USER_VAR_NUM; i++) {
                const varNum = i.toString(10);
                this._dumpElement.querySelector(`.var${varNum}`).textContent = this._wwaData.userVar[i] + "";
            }
        }
    }
    public vibration(isStrong: boolean) {
        this._gamePadStore.vibration(isStrong);
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

        // 1. カメラの状況を確認し、エフェクト効果の段階であれば、 yLimit を更新
        if (this._camera.isResetting()) {
            if (this._camera.getPreviousPosition() !== null) {
                var cpPartsPrev = this._camera.getPreviousPosition().getPartsCoord();
                var cpOffsetPrev = this._camera.getPreviousPosition().getOffsetCoord();
            }
            yLimit = this._camera.getTransitionStepNum() * Consts.CHIP_SIZE;
        }

        // 2. 再描画が必要であればフラグを更新
        var cacheDrawFlag: boolean = false;
        if (yLimit !== this._cgManager.mapCacheYLimit) {
            // yLimitが異なるために再描画
            this._cgManager.mapCacheYLimit = yLimit;
            cacheDrawFlag = true;
        }
        if ((cpParts.x !== this._cgManager.cpPartsLog.x) || (cpParts.y !== this._cgManager.cpPartsLog.y)) {
            // cpParts座標が変わったため再描画
            this._cgManager.cpPartsLog.x = cpParts.x;
            this._cgManager.cpPartsLog.y = cpParts.y;
            cacheDrawFlag = true;
        }

        // 3. 再描画が必要であれば、事前に Canvas をクリア
        if (cacheDrawFlag) {
            this._cgManager.clearBackCanvas();
            this._cgManager.clearObjectCanvases();
        }

        // 4. エフェクト効果の段階であれば、エフェクトを描画
        if (this._camera.isResetting()) {
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

        // 5. マップを描画
        this._drawMap(cpParts, cpOffset, yLimit, false, cacheDrawFlag);
        this._drawPlayer(cpParts, cpOffset, yLimit);
        this._drawObjects(cpParts, cpOffset, yLimit, false, cacheDrawFlag);

        // 6. 攻撃エフェクト描画
        if (this._player.isFighting() && !this._player.isBattleStartFrame()) {
            targetX = this._player.isTurn() ? this._monster.position.x : ppos.x;
            targetY = this._player.isTurn() ? this._monster.position.y : ppos.y;

            this._cgManager.drawCanvas(
                this._battleEffectCoord.x, this._battleEffectCoord.y,
                Consts.CHIP_SIZE * (targetX - cpParts.x) - cpOffset.x,
                Consts.CHIP_SIZE * (targetY - cpParts.y) - cpOffset.y
            );
        }

        // 7. マクロ文で描画されるエフェクトや顔表示、フレームなどを描画
        this._drawEffect();
        this._drawFaces();
        this._drawFrame();

    }

    // 背景描画
    private _drawMap(cpParts: Coord, cpOffset: Coord, yLimit: number, isPrevCamera: boolean = false, cacheDrawFlag: boolean = false): void {
        if (cpParts === void 0) {
            return;
        }
        var xLeft = Math.max(0, cpParts.x - 1);
        var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW);
        var yTop = Math.max(0, cpParts.y - 1);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW);
        var count: number;
        count = 0;

        if (isPrevCamera) {
            for (var x: number = xLeft; x <= xRight; x++) {
                for (var y: number = yTop; y <= yBottom; y++) {
                    var partsID: number = this._wwaData.map[y][x];
                    var ppx = this._wwaData.mapAttribute[partsID][Consts.ATR_X] / Consts.CHIP_SIZE;
                    var ppy = this._wwaData.mapAttribute[partsID][Consts.ATR_Y] / Consts.CHIP_SIZE;
                    var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) - cpOffset.x;
                    var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) - cpOffset.y;
                    this._cgManager.copyBackCanvasWithLowerYLimit(ppx, ppy, canvasX, canvasY, yLimit);
                }
            }
        } else {
            for (var x: number = xLeft; x <= xRight; x++) {
                for (var y: number = yTop; y <= yBottom; y++) {
                    var partsID: number = this._wwaData.map[y][x];
                    if (this._cgManager.mapCache[count] !== partsID) {
                        this._cgManager.mapCache[count] = partsID;
                        cacheDrawFlag = true;
                    }
                    count++;
                }
            }

            if (cacheDrawFlag) {
                this._cgManager.clearBackCanvasWithLowerYLimit(yLimit);
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

        if (this._useLookingAround && this._player.isLookingAround() && !this._player.isWaitingMessage()) {
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
    private _drawObjects(cpParts: Coord, cpOffset: Coord, yLimit: number, isPrevCamera: boolean = false, cacheDrawFlag:boolean = false): void {
        if (cpParts === void 0) {
            return;
        }
        var xLeft = Math.max(0, cpParts.x - 1);
        var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW);
        var yTop = Math.max(0, cpParts.y - 1);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW);
        var offset: Coord;
        var count: number = 0;
        var animationType: boolean = this._animationCounter > Consts.ANIMATION_REP_HALF_FRAME;
        var imgType: boolean, ppxo: number, ppyo: number, canvasX: number, canvasY: number, type: number, num: number, result: Coord;
        var x: number, y: number, partsIDObj: number, savePartsIDObj: number, n: number;
        var useBattleArea: boolean = this._player.isFighting() &&
            this._player.isTurn() &&
            this._player.getPosition().getPartsCoord().equals(this._monster.position);
        if (isPrevCamera) {
            // 画面内物体描画
            for (x = xLeft; x <= xRight; x++) {
                for (y = yTop; y <= yBottom; y++) {
                    if ((useBattleArea) &&
                        new Coord(x, y).equals(this._monster.position)) {
                        continue;
                    }
                    partsIDObj = this._wwaData.mapObject[y][x];
                    offset = new Coord(0, 0);
                    if (this._wwaData.objectAttribute[partsIDObj][Consts.ATR_MOVE] !== MoveType.STATIC) {
                        result = this._objectMovingDataManager.getOffsetByBeforePartsCoord(new Coord(x, y));
                        if (result !== null) {
                            offset = result;
                        }
                    }
                    canvasX = Consts.CHIP_SIZE * (x - cpParts.x) + offset.x - cpOffset.x;
                    canvasY = Consts.CHIP_SIZE * (y - cpParts.y) + offset.y - cpOffset.y;
                    imgType = (
                        animationType ||
                        this._wwaData.objectAttribute[partsIDObj][Consts.ATR_X2] === 0 &&
                        this._wwaData.objectAttribute[partsIDObj][Consts.ATR_Y2] === 0
                    );
                    ppxo =
                        this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_X : Consts.ATR_X2] / Consts.CHIP_SIZE;
                    ppyo =
                        this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_Y : Consts.ATR_Y2] / Consts.CHIP_SIZE;
                    type = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_TYPE];
                    num = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_NUMBER];
                    if (partsIDObj !== 0 && !this._checkNoDrawObject(new Coord(x, y), type, num)) {
                        this._cgManager.copyObjectCanvasWithLowerYLimit(animationType ? 1 : 0, ppxo, ppyo, canvasX, canvasY, yLimit);
                    }
                }
            }
        } else {
            var drawPartsList: DrawPartsData[] = [];
            var drawStaticPartsList: DrawPartsData[] = [];
            var drawPartsData: DrawPartsData;
            var isStatic: boolean, isFighting: boolean;
            for (x = xLeft; x <= xRight; x++) {
                for (y = yTop; y <= yBottom; y++) {
                    savePartsIDObj = partsIDObj = this._wwaData.mapObject[y][x];
                    type = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_TYPE];
                    num = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_NUMBER];
                    if (this._checkNoDrawObject(new Coord(x, y), type, num)) {
                        savePartsIDObj = 0;//非表示オブジェクト
                    }
                    isStatic = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_MOVE] === MoveType.STATIC;
                    if (savePartsIDObj !== 0) {
                        //描画対象に追加
                        if ((useBattleArea) &&
                            new Coord(x, y).equals(this._monster.position)) {
                            isFighting = true;
                        } else {
                            isFighting = false;
                        }
                        
                        if (isStatic) {
                            drawStaticPartsList.push(new DrawPartsData(partsIDObj, x, y, isStatic, isFighting));
                        } else {
                            drawPartsList.push(new DrawPartsData(partsIDObj, x, y, isStatic, isFighting));
                            savePartsIDObj = 0;//移動系は表示しないものとみなす
                        }
                        if (isFighting) {
                            savePartsIDObj = 0;//戦闘中に一時的に描画をOFFにする
                        }
                    }
                    if (this._cgManager.mapObjectCache[count] !== savePartsIDObj) {
                        this._cgManager.mapObjectCache[count] = savePartsIDObj;
                        cacheDrawFlag = true;
                    }
                    count++;
                }
            }

            if (cacheDrawFlag) {
                this._cgManager.clearObjectCanvasesWithLowerYLimit(yLimit);
                Array.prototype.push.apply(drawPartsList, drawStaticPartsList); // staticを描画対象に追加
            }
            var i: number, len: number;
            len = drawPartsList.length;
            for (i = 0; i < len; i++) {
                drawPartsData = drawPartsList[i];
                x = drawPartsData.x;
                y = drawPartsData.y;
                partsIDObj = drawPartsData.partsIDObj;
                isStatic = drawPartsData.isStatic;
                isFighting = drawPartsData.isFighting;
                canvasX = Consts.CHIP_SIZE * (x - cpParts.x) - cpOffset.x;
                canvasY = Consts.CHIP_SIZE * (y - cpParts.y) - cpOffset.y;
                if (isStatic) {
                    if (isFighting) {
                        //戦闘中に一時的に描画をOFFにする
                        continue;
                    }
                    //移動しないもの
                    //キャッシュキャンバスに移動しない物体を描画
                    for (n = 0; n < 2; n++) {
                        imgType = (
                            (!!n) ||
                            this._wwaData.objectAttribute[partsIDObj][Consts.ATR_X2] === 0 &&
                            this._wwaData.objectAttribute[partsIDObj][Consts.ATR_Y2] === 0
                        );
                        ppxo =
                            this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_X : Consts.ATR_X2] / Consts.CHIP_SIZE;
                        ppyo =
                            this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_Y : Consts.ATR_Y2] / Consts.CHIP_SIZE;
                        this._cgManager.copyObjectCanvasWithUpperYLimit(n, ppxo, ppyo, canvasX, canvasY, yLimit);
                    }
                } else {
                    //移動するもの
                    result = this._objectMovingDataManager.getOffsetByBeforePartsCoord(new Coord(x, y));
                    if (result !== null) {
                        canvasX += result.x;
                        canvasY += result.y;
                    }
                    imgType = (
                        animationType ||
                        this._wwaData.objectAttribute[partsIDObj][Consts.ATR_X2] === 0 &&
                        this._wwaData.objectAttribute[partsIDObj][Consts.ATR_Y2] === 0
                    );
                    ppxo =
                        this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_X : Consts.ATR_X2] / Consts.CHIP_SIZE;
                    ppyo =
                        this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_Y : Consts.ATR_Y2] / Consts.CHIP_SIZE;
                    this._cgManager.drawCanvasWithUpperYLimit(ppxo, ppyo, canvasX, canvasY, yLimit);

                }
            }
            // オブジェクトキャンバスをメインキャンバスに描画
            this._cgManager.drawObjectCanvas(animationType ? 1 : 0);
        }

    }

    private _drawEffect(): void {
        if (this._wwaData.effectCoords.length === 0 || this._wwaData.effectWaits === 0) {
            return;
        }
        var id:number = Math.floor(this._mainCallCounter % (this._wwaData.effectCoords.length * this._wwaData.effectWaits) / this._wwaData.effectWaits);
        this._cgManager.drawEffect(id);
    }

    private _drawFaces(): void {
        for (var i = 0; i < this._faces.length; i++) {
            this._cgManager.drawCanvasWithSize(
                this._faces[i].srcPos.x, this._faces[i].srcPos.y,
                this._faces[i].srcSize.x, this._faces[i].srcSize.y,
                this._faces[i].destPos.x, this._faces[i].destPos.y
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

        this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.MAP);
        var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        // 待ち時間
        //this._waitTimeInCurrentFrame += this._wwaData.mapAttribute[partsID][Consts.ATR_NUMBER] * 100;
        this._waitFrame += this._wwaData.mapAttribute[partsID][Consts.ATR_NUMBER] * Consts.WAIT_TIME_FRAME_NUM;
        this._temporaryInputDisable = true;
        var messageDisplayed = this.generatePageAndReserveExecution(message, false, false, partsID, PartsType.MAP, pos.clone());
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

            this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.MAP);
            var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
            var message = this._wwaData.message[messageID];

            this.generatePageAndReserveExecution(message, false, false, partsID, PartsType.MAP, pos.clone());
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
        this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.MAP);
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
        this.generatePageAndReserveExecution(
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
        this.generatePageAndReserveExecution(message, false, false, partsID, PartsType.OBJECT, pos);
        // 待ち時間
        //this._waitTimeInCurrentFrame += this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER] * 100;
        this._waitFrame += this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER] * Consts.WAIT_TIME_FRAME_NUM;
        this._temporaryInputDisable = true;
        this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.OBJECT, partsID);

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
        if (
            this._player.isDead() &&
            this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY] !== 0 &&
            this.shouldApplyGameOver({ isCalledByMacro: false })
        ) {
            this.gameover();
            return;
        }

        this.generatePageAndReserveExecution(message, false, false, partsID, PartsType.OBJECT, pos.clone());


        //this._wwaData.mapObject[pos.y][pos.x] = 0;
        this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
        this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.OBJECT, partsID);
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
        this.generatePageAndReserveExecution(message, true, false, partsID, PartsType.OBJECT, pos.clone());
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
        this.generatePageAndReserveExecution(message, true, false, partsID, PartsType.OBJECT, pos.clone());
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
                    screenPixelCoord: new Coord(screenXPixel, screenYPixel),
                    itemBoxBackgroundImageCoord: new Coord(
                        this._wwaData.imgItemboxX * Consts.CHIP_SIZE,
                        this._wwaData.imgItemboxY * Consts.CHIP_SIZE
                    )
                } : undefined
            );
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
            if (this._wwaData.objectAttribute[partsID][Consts.ATR_MODE] !== 0) {
                // 使用型アイテム の場合は、処理は使用時です。
            } else {
                this.generatePageAndReserveExecution(message, false, false, partsID, PartsType.OBJECT, pos.clone());
                this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.OBJECT, partsID);
            }
        } catch (e) {
            // これ以上、アイテムを持てません
            if (this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] !== "BLANK") {
                this.generatePageAndReserveExecution(
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
            this.generatePageAndReserveExecution(message, false, false, partsID, PartsType.OBJECT, pos.clone());
            //this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.setPartsOnPosition(PartsType.OBJECT, 0, pos);
            this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.OBJECT, partsID);
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
        this.generatePageAndReserveExecution(message, true, false, partsID, PartsType.OBJECT, pos.clone());
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
        this.reserveAppearPartsInNextFrame(pos, AppearanceTriggerType.OBJECT, partsID);
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
        this.generatePageAndReserveExecution(
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
        const pages = this.generatePagesByRawMessage(rawMessage, partsID, PartsType.OBJECT, pos, false, false);
        // TODO: スコア表示は仕様変更されるべき
        // メッセージの有無に関わらず、スコア表示ウィンドウは決定ボタンなどで閉じられるべきなので
        // マクロのみや空メッセージの場合であっても、スコア表示は決定ボタンで閉じられるようにする
        // <P> による改ページがある場合は、全ページの表示が終わるまでスコアは表示されるべき。
        const existsMessage = pages.reduce((existsMessageBefore, node) => existsMessageBefore || isEmptyMessageTree(node), false);
        if (existsMessage) {
            this._scoreRates = {
                energy: this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY],
                strength: this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH],
                defence: this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE],
                gold: this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]
            };
            this.updateScore();
            this._scoreWindow.show();
        }
        this.generatePageAndReserveExecution(rawMessage, false, false, partsID, PartsType.OBJECT, pos);
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);

    }

    public updateScore() {
        if (!this._scoreRates) {
            return;
        }
        const score = this._player.getStatus().calculateScore(this._scoreRates);
        this._scoreWindow.update(score);
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
                            this.reserveAppearPartsInNextFrame(this._yesNoChoicePartsCoord, AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                        } else {
                            // アイテムを持っていない
                            if (this._wwaData.message[SystemMessage1.NO_ITEM] !== "BLANK") {
                                this._execPageInNextFrame = new Page((new ParsedMessage(
                                    this._wwaData.message[SystemMessage1.NO_ITEM] === "" ?
                                        "アイテムを持っていない。" : this._wwaData.message[SystemMessage1.NO_ITEM],
                                )
                                ), true, false, true);
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
                                            screenPixelCoord: new Coord(screenXPixel, screenYPixel),
                                            itemBoxBackgroundImageCoord: new Coord(
                                                this._wwaData.imgItemboxX * Consts.CHIP_SIZE,
                                                this._wwaData.imgItemboxY * Consts.CHIP_SIZE
                                            )
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
                                if (
                                    this._player.isDead() &&
                                    this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ENERGY] !== 0 &&
                                    this.shouldApplyGameOver({isCalledByMacro: false})
                                ) {
                                    this.gameover();
                                    return;
                                }
                                this.reserveAppearPartsInNextFrame(this._yesNoChoicePartsCoord, AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                            } else {
                                // アイテムをボックスがいっぱい
                                if (this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] !== "BLANK") {
                                    this._execPageInNextFrame = new Page(
                                        new ParsedMessage(
                                            this._wwaData.systemMessage[SystemMessage2.FULL_ITEM] === "" ?
                                                "これ以上、アイテムを持てません。" : this._wwaData.systemMessage[SystemMessage2.FULL_ITEM],
                                        ), true, false, true)
                                }
                            }
                        } else {
                            // 所持金が足りない
                            if (this._wwaData.message[SystemMessage1.NO_MONEY] !== "BLANK") {
                                this._execPageInNextFrame = new Page(
                                    new ParsedMessage(
                                        this._wwaData.message[SystemMessage1.NO_MONEY] === "" ?
                                            "所持金がたりない。" : this._wwaData.message[SystemMessage1.NO_MONEY],
                                    ), true, false, true
                                );
                            }
                        }

                    } else if (partsType === Consts.OBJECT_SELECT) {
                        this.reserveAppearPartsInNextFrame(this._yesNoChoicePartsCoord, AppearanceTriggerType.CHOICE_YES, this._yesNoChoicePartsID);
                    } else if (partsType === Consts.OBJECT_URLGATE) {
                        location.href = util.$escapedURI(this._yesNoURL);
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_ITEM_USE) {
                    this._player.readyToUseItem(this._yesNoUseItemPos);
                } else if ((this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_LOAD) ||
                           (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD)) {
                    this._messageWindow.deleteSaveDom();
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    if (this._messageWindow.load()) {
                        //ロード可能
                        this._stopUpdateByLoadFlag = true;
                        this._loadType = LoadType.QUICK_LOAD;
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                    this._messageWindow.deleteSaveDom();
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._quickSave(ChoiceCallInfo.CALL_BY_QUICK_SAVE);
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
                    this._passwordWindow.password = this._quickSave(ChoiceCallInfo.CALL_BY_PASSWORD_SAVE);
                    this._passwordWindow.show(Mode.SAVE);
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_SUSPEND) {
                    (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._quickSave(ChoiceCallInfo.CALL_BY_SUSPEND);
                }
                this._yesNoJudge = YesNoState.UNSELECTED;
                this._setNextPage();

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
                        this.reserveAppearPartsInNextFrame(this._yesNoChoicePartsCoord, AppearanceTriggerType.CHOICE_NO, this._yesNoChoicePartsID);
                    } else if (partsType === Consts.OBJECT_URLGATE) {

                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_ITEM_USE) {
                    var bg = <HTMLDivElement>(util.$id("item" + (this._yesNoUseItemPos - 1)));
                    bg.classList.remove("onpress");
                } else if ((this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_LOAD) ||
                           (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD)) {
                    this._messageWindow.deleteSaveDom();
                    this._yesNoChoiceCallInfo = this._wwaSave.getSecondSaveChoiceCallInfo(this._usePassword);
                    switch (this._yesNoChoiceCallInfo) {
                        case ChoiceCallInfo.NONE:
                            (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                            break;
                        case ChoiceCallInfo.CALL_BY_PASSWORD_LOAD:
                            this._yesNoJudge = YesNoState.UNSELECTED;
                            this.onpasswordloadcalled();
                            return;
                        case ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD:
                            this._wwaSave.selectLogSaveDataList();
                            this._messageWindow.createSaveDom();
                            var secondCallInfo: ChoiceCallInfo = this._wwaSave.getSecondSaveChoiceCallInfo(this._usePassword);//クイックロード後の選択肢
                            this._yesNoJudge = YesNoState.UNSELECTED;
                            switch (secondCallInfo) {
                                case ChoiceCallInfo.CALL_BY_PASSWORD_LOAD:
                                    this.generatePageAndReserveExecution("読み込むオートセーブを選んでください。\n→Ｎｏでデータ復帰用パスワードの\n　入力選択ができます。", true, true);
                                    break;
                                case ChoiceCallInfo.NONE:
                                    this.generatePageAndReserveExecution("読み込むオートセーブを選んでください。", true, true);
                                    break;
                            }

                            return;
                    }
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                    this._messageWindow.deleteSaveDom();
                    if ((this._usePassword) || (this._useSuspend)) {
                        this._yesNoJudge = YesNoState.UNSELECTED;
                        if (this._useSuspend) {//中断モード
                            this.onpasssuspendsavecalled();
                        } else if (this._usePassword) {
                            this.onpasswordsavecalled();
                        }
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
                } else if (this._yesNoChoiceCallInfo === ChoiceCallInfo.CALL_BY_SUSPEND) {
                    if (this._usePassword) {
                        this._yesNoJudge = YesNoState.UNSELECTED;
                        this.onpasswordsavecalled();
                        return;
                    } else {
                        (<HTMLDivElement>(util.$id(sidebarButtonCellElementID[SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    }
                }

                this._yesNoJudge = YesNoState.UNSELECTED;
                this._setNextPage();
                this._yesNoChoicePartsCoord = void 0;
                this._yesNoChoicePartsID = void 0;
                this._yesNoUseItemPos = void 0;
                this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
                this._messageWindow.setYesNoChoice(false);
            }
        }
    }

    public generatePageAndReserveExecution(
        message: string,
        showChoice: boolean,
        isSystemMessage: boolean,
        partsID: number = 0,
        partsType: PartsType = PartsType.OBJECT,
        partsPosition: Coord = new Coord(0, 0),
    ): boolean {
        this._pages = this._pages.concat(
            this.generatePagesByRawMessage(message, partsID, partsType, partsPosition, isSystemMessage, showChoice
        ));
        if (this._pages.length !== 0) {
            const topPage = this._pages.shift();
            this._execPageInNextFrame = topPage;
        }
        return false;
    }

    // TODO: ここから別クラスへ切り出し予定
    public generatePagesByRawMessage(
        message: string,
        partsId: number,
        partsType: PartsType,
        partsPosition: Coord,
        isSystemMessage: boolean,
        showChoice: boolean
    ): Page[] {

        // コメント削除
        const messageMain = message
            .split(/\n\<c\>/i)[0]
            .split(/\<c\>/i)[0]
            .replace(/\n\<p\>\n/ig, "<P>")
            .replace(/\n\<p\>/ig, "<P>")
            .replace(/\<p\>\n/ig, "<P>")
            .replace(/\<p\>/ig, "<P>")
            .replace(/\/\/.*\n/ig, "");

        const pages: Page[] = [];
        if (messageMain === "") {
            return [];
        }
        const pageContents = messageMain.split(/\<p\>/ig);
        pageContents.forEach((pageContent, pageId) => {
            let firstNode: Node | undefined = undefined;
            let nodeByPrevLine: Node | undefined = undefined;
            let lastPoppedJunction: Junction | undefined = undefined;
            const lines = this.parseMessageLines(pageContent, partsId, partsType, partsPosition)
            const junctionNodeStack: Junction[] = [];

            lines.forEach((line, index) => {
                try {
                    const previousLineType = index === 0 ? undefined : lines[index - 1].type;
                    const parentJunction = junctionNodeStack[junctionNodeStack.length - 1];
                    const newNode = this.createNewNode(line, !firstNode || !messagLineIsText(previousLineType));
                    const endIfPoppedJunction = this.processConditionalExecuteMacroLine(newNode, line, parentJunction, junctionNodeStack);
                    if (endIfPoppedJunction) {
                        lastPoppedJunction = endIfPoppedJunction;
                    }
                    if (previousLineType) {
                        this.connectToPreviousNode(line, previousLineType, nodeByPrevLine, newNode, parentJunction, lastPoppedJunction);
                    } else {
                        firstNode = newNode;
                    }
                    if (newNode) {
                        nodeByPrevLine = newNode;
                    }
                } catch (error) {
                    console.error(`$if-$else_if-$else-$endif マクロの解析中にエラーが発生しました。ページ ${index}`)
                    console.error(error);
                }
            });
            pages.push(
                new Page(firstNode, pageId === pageContents.length - 1, pageId === 0 && showChoice, isSystemMessage)
            );
        });
        return pages;
   }

    private parseMessageLines(pageContent: string, partsID: number, partsType: PartsType, partsPosition: Coord): MessageLine[] {
        return pageContent.split("\n").map(line => {
            const matchInfo = line.match(/(\$(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:.*))/);
            if (!matchInfo || matchInfo.length < 2 && !line.startsWith("$")) {
                return { type: "text" as const, text: line };
            }
            const macro = parseMacro(this, partsID, partsType, partsPosition, matchInfo[1]);
            switch (macro.macroType) {
                case MacroType.IF:
                case MacroType.ELSE_IF:
                case MacroType.ELSE:
                case MacroType.END_IF:
                case MacroType.SHOW_STR:
                    return { type: macro.macroType, text: line, macro }
                default:
                    return { type: "normalMacro" as const, text: line, macro }
            }
        });
    }

    private createNewNode(currentLine: MessageLine, shouldCreateParsedMessage: boolean): Node | undefined {
        switch (currentLine.type) {
            case MacroType.IF:
                const junction = new Junction([{ descriminant: ExpressionParser.parseDescriminant(currentLine.macro.macroArgs[0]) }]);
                return junction;
           case MacroType.SHOW_STR:
                return shouldCreateParsedMessage ? new ParsedMessage(this._generateUserValString(currentLine.macro.macroArgs)) : undefined;
            case "text":
                return shouldCreateParsedMessage ? new ParsedMessage(currentLine.text) : undefined;
            case "normalMacro":
                return shouldCreateParsedMessage ? new ParsedMessage("", [currentLine.macro]) : undefined;
            default:
                return undefined;
        }
    }

    /**
     * END_IF の場合は junctionNodeStack の先頭を pop し、返します。 
     */
    private processConditionalExecuteMacroLine(
        newNode: Node,
        currentLine: MessageLine,
        parentJunction: Junction | undefined,
        junctionNodeStack: Junction[],
    ): Junction | undefined {
        const isTopLevel = junctionNodeStack.length === 0;
        switch (currentLine.type) {
            case MacroType.IF:
                junctionNodeStack.push(newNode as Junction);
                return undefined;
            case MacroType.ELSE_IF:
                if (isTopLevel) {
                    throw new Error("構文エラー: $if を呼ぶ前に $else_if は呼べません")
                }
                parentJunction.appendBranch({ descriminant: ExpressionParser.parseDescriminant(currentLine.macro.macroArgs[0]) })
                return undefined;
            case MacroType.ELSE:
                if (isTopLevel) {
                    throw new Error("構文エラー: $if を呼ぶ前に $else は呼べません")
                }
                // else の場合、該当する分岐は必ず実行されるべき
                parentJunction.appendBranch({ descriminant: true })
                return undefined;
            case MacroType.END_IF:
                if (isTopLevel) {
                    throw new Error("構文エラー: $if を呼ぶ前に $endif は呼べません")
                }
                return junctionNodeStack.pop();
        }

    }

    private connectToPreviousNode(
        currentLine: MessageLine,
        previousLineType: MessageLineType,
        nodeByPrevLine: Node | undefined,
        newNode: Node | undefined,
        parentJunction: Junction,
        endIfTargetJunction: Junction | undefined
    ) {
        const prevLineIsText = messagLineIsText(previousLineType);
        if (
            previousLineType === MacroType.IF ||
            previousLineType === MacroType.ELSE_IF ||
            previousLineType === MacroType.ELSE
        ) {
            if (!newNode || !parentJunction) {
                return;
            }
            const target = parentJunction.getLastUnconnectedBranch();
            if (target) {
                target.next = newNode;
            } else {
                throw new Error("lastUnconnectedBranchが見つかりませんでした。")
            }
            return;
        }
        if (previousLineType === MacroType.END_IF) {
            if (!newNode || !(endIfTargetJunction instanceof Junction)) {
                return;
            }
            for (let i = 0; i < endIfTargetJunction.branches.length; i++) {
                let finalNode: Node | undefined = endIfTargetJunction.branches[i].next;
                if (!finalNode) {
                    endIfTargetJunction.branches[i] = newNode;
                    continue;
                } 
                // 分かれた処理を合流させるために必要な終端ノードを、Junctionノードから順に走査
                while (true) {
                    if (finalNode instanceof Junction) {
                        // どの分岐を選んでも最終的には同じ結果になるので、確実に存在する分岐を選ぶ。
                        // 理想を言えば Junction ノードは合流地点のノードを覚えていれば処理が高速化されるが
                        // WWAのメッセージで何百行も書くことは想定しないので、処理を簡単にする。必要なら今後考える。
                        finalNode = finalNode.branches[0].next;
                    } 
                    if (finalNode instanceof ParsedMessage) {
                        if (!finalNode.next) {
                            finalNode.next = newNode;
                            break;
                        }
                        finalNode = finalNode.next;
                    }
                }
            }
            return;
        }
        if (prevLineIsText) {
            if (!(nodeByPrevLine instanceof ParsedMessage)) {
                return;
            }
            // 前の行までのメッセージ表示内容がない場合は、改行を挿入しない
            const shouldInsertNewLine = !nodeByPrevLine.isEmpty();
            // 1つ前の行がテキストや通常マクロの場合は1つ前のParsedMessageにマージ
            if (currentLine.type === MacroType.SHOW_STR) {
                nodeByPrevLine.appendMessage(this._generateUserValString(currentLine.macro.macroArgs), shouldInsertNewLine);
            } else if (currentLine.type === "text") {
                nodeByPrevLine.appendMessage(currentLine.text, shouldInsertNewLine);
            } else if (currentLine.type === "normalMacro") {
                nodeByPrevLine.macro.push(currentLine.macro);
            } else { // if などの場合は単純に接続する
                nodeByPrevLine.next = newNode;
            }
        }
    }
    // TODO: ここまで別クラスに切り出し予定
    
    public appearParts({ pos, triggerType, triggerPartsId }: PartsAppearance): void {
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
            triggerPartsId = (triggerPartsId === 0) ? this._wwaData.map[pos.y][pos.x] : triggerPartsId;
            triggerPartsType = PartsType.MAP;
        } else {
            triggerPartsId = (triggerPartsId === 0) ? this._wwaData.mapObject[pos.y][pos.x] : triggerPartsId;
            triggerPartsType = PartsType.OBJECT;
        }

        for (i = rangeMin; i <= rangeMax; i++) {
            var base = Consts.ATR_APPERANCE_BASE + i * Consts.REL_ATR_APPERANCE_UNIT_LENGTH;
            var idxID = base + Consts.REL_ATR_APPERANCE_ID;
            var idxX = base + Consts.REL_ATR_APPERANCE_X;
            var idxY = base + Consts.REL_ATR_APPERANCE_Y;
            var idxType = base + Consts.REL_ATR_APPERANCE_TYPE;

            targetPartsID = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsId][idxID] :
                this._wwaData.objectAttribute[triggerPartsId][idxID];
            targetPartsType = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsId][idxType] :
                this._wwaData.objectAttribute[triggerPartsId][idxType];
            targetX = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsId][idxX] :
                this._wwaData.objectAttribute[triggerPartsId][idxX];
            targetY = (triggerPartsType === PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsId][idxY] :
                this._wwaData.objectAttribute[triggerPartsId][idxY];

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

    }

    public reserveAppearPartsInNextFrame(pos: Coord, triggerType: AppearanceTriggerType, triggerPartsId: number = 0): void {
        this._reservedPartsAppearance = {
            pos,
            triggerType,
            triggerPartsId
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
        this._yesNoJudge = YesNoState.UNSELECTED;
        this._pages = []; // force clear!!
        this._player.setDelayFrame();
        this._messageWindow.hide();
        this._yesNoChoicePartsCoord = void 0;
        this._yesNoChoicePartsID = void 0;
        this._yesNoUseItemPos = void 0;
        this._yesNoChoiceCallInfo = ChoiceCallInfo.NONE;
        this._player.clearMessageWaiting();
        this._messageWindow.clear();
        this._messageWindow.setYesNoChoice(false);

        this._waitFrame = 0;
        this._temporaryInputDisable = true;
        this._execPageInNextFrame = undefined;
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

    /**
     * マップデータを所定の方法で文字列化したもののMD5ハッシュを返します。
     * @param data 対象のマップデータ
     */
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
        return generateMD5(text);
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

        return generateMD5(text);
    }
    private _saveDataList = []

    public compressSystem(): WWACompress {
        return WWACompress;
    }

    private _quickSave(callInfo: number): string {
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
        qd.frameCount = this._player.getFrameCount();
        qd.gameSpeedIndex = this._player.getSpeedIndex();

        switch (callInfo) {
            case ChoiceCallInfo.CALL_BY_LOG_QUICK_SAVE:
            case ChoiceCallInfo.CALL_BY_QUICK_SAVE:
            case ChoiceCallInfo.CALL_BY_SUSPEND:
                //qd.checkString = this._generateSaveDataHash(qd);
                break;
            case ChoiceCallInfo.CALL_BY_PASSWORD_SAVE:
                qd.checkOriginalMapString = this.checkOriginalMapString;
                //qd.mapCompressed = this._compressMap(qd.map);
                //qd.mapObjectCompressed = this._compressMap(qd.mapObject);
                qd.checkString = this._generateSaveDataHash(qd);

                // map, mapObjectについてはcompressから復元
                //qd.map = void 0;
                //qd.mapObject = void 0;
                break;
        }

        // message, mapAttribute, objectAttributeについてはrestartdataから復元
        // TODO: WWAEvalの機能などでrestart時から変更された場合は、差分をセーブするようにする予定
        qd.message = void 0;
        qd.mapAttribute = void 0;
        qd.objectAttribute = void 0;

        switch (callInfo) {
            case ChoiceCallInfo.CALL_BY_QUICK_SAVE:
                this._messageWindow.save(this._cvs, qd);
                this.wwaCustomEvent('wwa_quicksave', {
                    data: qd
                });
                return "";
            case ChoiceCallInfo.CALL_BY_PASSWORD_SAVE:
                const compressQD:any = WWACompress.compress(qd);
                compressQD.isCompress = 1;
                const s = JSON.stringify(compressQD);
                this.wwaCustomEvent('wwa_passwordsave', {
                    data: qd,
                    compress: compressQD
                });
                return encodeSaveData(s, this._wwaData.worldPassNumber);
            case ChoiceCallInfo.CALL_BY_SUSPEND:
                this.wwaCustomEvent('wwa_suspend', {
                    data: qd,
                    compress: WWACompress.compress(qd)
                });
                break;
            case ChoiceCallInfo.CALL_BY_LOG_QUICK_SAVE:
                this.wwaCustomEvent('wwa_autosave', {
                    data: qd
                });
                this._wwaSave.autoSave(this._cvs, qd);
                break;
        }
    }

    public wwaCustomEvent(eventName: string, data: object = {}) {
        this.wwaCustomEventEmitter.dispatch(eventName, data);
    }

    /**
     * 与えられたパスワードセーブの暗号化を解除して、配列の0要素目で返します。
     * 与えられたパスワードセーブの暗号化データ内にワールド名が含まれる(v3.5.6以下の WWA Wingで保存されている)かを配列の1要素目で返します。
     * 暗号化の解除に失敗した場合は、エラー内容をメッセージとする Error オブジェクトがスローされます。
     * @param pass パスワードセーブの文字列
     * @returns 2要素配列: [パスワードセーブの暗号化解除結果, 付加情報オブジェクト(復号化結果にワールド名が含まれないなら isWorldName が true)]
     */
    private _decodePassword(pass: string): WWADataWithWorldNameStatus {
        let decodedPassword: string = "";
        let error: any = undefined;
        try {
            decodedPassword = decodeSaveDataV1(pass, this._wwaData.worldPassNumber);
        } catch (caught) {
            error = caught;
        }
        if (!decodedPassword) {
            console.warn("新方式でのパスワード暗号化解除失敗:", error);
            try {
                // 現在の暗号化キーで復号に失敗した場合は v3.5.6 以前の暗号化キーを使う
                decodedPassword = decodeSaveDataV0(pass, this._wwaData.worldPassNumber, this.checkOriginalMapString);
            } catch (caught) {
                error = caught;
            }
        }
        if (!decodedPassword) {
            console.warn("旧方式でのパスワード暗号化解除失敗:", error);
            const errorMessage = error && error.message ? error.message : "";
            throw new Error("パスワード取得時からワールド制作者によってマップの暗証番号が変更されたか、\nパスワードが壊れているために正常にセーブデータが復元できませんでした。\n" + errorMessage);
        }
        var obj: any;
        try {
            obj = JSON.parse(decodedPassword);
        } catch (e) {
            throw new Error("マップデータ以外のものが暗号化されたか、マップデータに何かが不足しているようです。\nJSON PARSE FAILED");
        }
        if (obj.isCompress) {
            delete obj.isCompress;
            const [data, worldNameStatus] = WWACompress.decompress(obj)
            return [Migrators.applyAllMigrators(data), worldNameStatus];
        } else {
            return [<WWAData>obj, { isWorldNameEmpty: false }];
        };
    }

    private _quickLoad(restart: boolean = false, password: string = null, apply: boolean = true): WWAData {
        if (!restart && this._wwaSave.hasSaveData() === void 0 && password === null) {
            throw new Error("セーブデータがありません。");
        }
        let newData: WWAData;
        let isWorldNameEmpty: boolean = false;
        if (password !== null) {
            const result = this._decodePassword(password);
            newData = result[0];
            isWorldNameEmpty = result[1].isWorldNameEmpty;
        } else {
            newData = <WWAData>JSON.parse(JSON.stringify(restart ? this._restartData : this._messageWindow.load()));
        }
        // TODO: WWAEvalの属性変更対策, もう少しスマートなディープコピー方法考える
        newData.message = <string[]>JSON.parse(JSON.stringify(this._restartData.message));
        newData.mapAttribute = <number[][]>JSON.parse(JSON.stringify(this._restartData.mapAttribute));
        newData.objectAttribute = <number[][]>JSON.parse(JSON.stringify(this._restartData.objectAttribute));
        if (newData.map === void 0) {
            newData.map = this._decompressMap(newData.mapCompressed);
        }
        if (newData.mapObject === void 0) {
            newData.mapObject = this._decompressMap(newData.mapObjectCompressed);
        }
        delete newData.mapCompressed;
        delete newData.mapObjectCompressed;

        if (password !== null) {
            // v3.5.6 以前のセーブデータはワールド名がないので素通しする
            if (!isWorldNameEmpty && newData.worldName !== this._wwaData.worldName) {
                console.error("Invalid title", `(password)=${newData.worldName} (current map)=${this._wwaData.worldName}`);
                throw new Error("前回パスワード取得時から、制作者によってワールド名が変更されたためロードできませんでした。\n予めご了承ください。")
            }
            const checkOriginalMapString = this.checkOriginalMapString;
            if (this._isDisallowLoadOldSave && newData.checkOriginalMapString !== checkOriginalMapString) {
                console.error("Invalid hash", `(password)=${newData.checkOriginalMapString} (current map)=${checkOriginalMapString}`);
                throw new Error("前回パスワード取得時から、制作者によってマップが変更されたためロードできませんでした。\n(マップデータ制作者の設定により、内容が変更されると以前のパスワードは利用できなくなります。)\n予めご了承ください。");
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
        this._player.setFrameCount(newData.frameCount);
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
        this.setStatusIconCoord(MacroImgFrameIndex.ENERGY, new Coord(newData.imgStatusEnergyX, newData.imgStatusEnergyY));
        this.setStatusIconCoord(MacroImgFrameIndex.STRENGTH, new Coord(newData.imgStatusStrengthX, newData.imgStatusStrengthY));
        this.setStatusIconCoord(MacroImgFrameIndex.DEFENCE, new Coord(newData.imgStatusDefenceX, newData.imgStatusDefenceY));
        this.setStatusIconCoord(MacroImgFrameIndex.GOLD, new Coord(newData.imgStatusGoldX, newData.imgStatusGoldY));
        this.setWideCellCoord(new Coord(newData.imgWideCellX, newData.imgWideCellY));
        this.setItemboxBackgroundPosition({ x: newData.imgItemboxX, y: newData.imgItemboxY });
        this.setFrameCoord(new Coord(newData.imgFrameX, newData.imgFrameY));
        this.setPlayerSpeedIndex(newData.gameSpeedIndex);

        this.updateCSSRule();
        this.updateEffect();
        this._player.updateStatusValueBox();
        this._wwaSave.quickSaveButtonUpdate(this._wwaData);
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
                            // thirdCandを用いた第三候補の作成は $oldmove=0 でのみ有効
                            if (thirdCand !== null && !this._wwaData.isOldMove) {
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
        var iterNum = this._wwaData.isOldMove
            ? Consts.RANDOM_MOVE_ITERATION_NUM_BEFORE_V31
            : Consts.RANDOM_MOVE_ITERATION_NUM;
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
        if (this._bottomButtonType === ControlPanelBottomButton.BATTLE_REPORT) {
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
            alert("セーブデータの復元に失敗しました。\nエラー詳細:\n" + e.message);
            return;
        }
        this._passwordLoadExecInNextFrame = true;
        this._passwordSaveExtractData = data;
    }

    private _displayUserVars(): void {
        // 属性によって表示許可されていない場合には何もしない
        // 何らかの事情で inlineUserVarViewer が初期化されていない場合も何もしない
        if (!this._canDisplayUserVars || !this._inlineUserVarViewer) {
            return;
        }
        // 表示中フラグをONにする
        this._inlineUserVarViewer.isVisible = true;
        if (this._player.isControllable()) {
            this.setNowPlayTime();
            let helpMessage: string = '変数一覧\n';
            if (this._userVarNameListRequestError) {
                if (this._userVarNameListRequestError.kind === "noFileSpecified") {
                    helpMessage += this._userVarNameListRequestError.errorMessage + "\n";
                } else {
                    helpMessage += "【変数名取得失敗】\n";
                    helpMessage += "  すべての変数を名無しとしています。\n";
                    helpMessage += `  エラー詳細: ${this._userVarNameListRequestError.errorMessage}\n`
                }
            }
            for (let i = 0; i < Consts.INLINE_USER_VAR_VIEWER_DISPLAY_NUM; i++) {
                /** 終端まで行った際にはループして0番目から参照する */
                let currentIndex = (this._inlineUserVarViewer.topUserVarIndex + i) % Consts.USER_VAR_NUM;
                const displayName = this._userVarNameList && this._userVarNameList[currentIndex] ?
                    this._userVarNameList[currentIndex] : "名無し";
                const label = `変数 ${currentIndex}: ${displayName}`;
                helpMessage += `${label}: ${this._wwaData.userVar[currentIndex]}\n`;
            }
            helpMessage += "\n操作方法\n";
            helpMessage += "上キー：１つ戻す　下キー：１つ進める\n";
            helpMessage += "左キー：１０つ戻す　右キー：１０つ進める\n";
            this.generatePageAndReserveExecution(helpMessage, false, true);
        }
    }

    private _displayHelp(): void {
        if (this._player.isControllable()) {
            this.setNowPlayTime();
            var helpMessage:string = "";
            switch (this.userDevice.device) {
                case DEVICE_TYPE.GAME:
                    switch (this.userDevice.os) {
                        case OS_TYPE.NINTENDO:
                            helpMessage = "　【操作方法】\n" +
                                "Ａ：Ｙｅｓ,戦闘結果予測の表示\n" +
                                "Ｂ：Ｎｏ\n" +
                                "Ｘ：メニュー\n" +
                                "Ｙ：このリストの表示\n" +
                                "Ｒ：初めからスタート\n" +
                                "ＺＬ：データの一時保存\n" +
                                "ＺＲ：一時保存データの読み込み\n" +
                                "＋: 移動速度を上げる\n" +
                                "－: 移動速度を落とす\n" +
                                // 移動回数・プレイ時間表記なし
                                "　WWA Wing バージョン:" + VERSION_WWAJS + "\n" +
                                "　マップデータ バージョン: " +
                                Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10;
                            break;
                        case OS_TYPE.PLAY_STATION:
                            helpMessage = "　【操作方法】\n" +
                                "〇：Ｙｅｓ,戦闘結果予測の表示\n" +
                                "×：Ｎｏ\n" +
                                "△：メニュー\n" +
                                "□：このリストの表示\n" +
                                "Ｒ１：初めからスタート\n" +
                                "Ｌ２：データの一時保存\n" +
                                "Ｒ２：一時保存データの読み込み\n" +
                                "OPTIONS: 移動速度を上げる\n" +
                                "SHARE: 移動速度を落とす\n" +
                                "　　現在の移動回数：" + this._player.getMoveCount() + "\n" +
                                "　　プレイ時間：" + this._player.getPlayTimeText() + "\n" + 
                                "　WWA Wing バージョン:" + VERSION_WWAJS + "\n" +
                                "　マップデータ バージョン: " +
                                Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10;
                            break;
                        case OS_TYPE.XBOX:
                            helpMessage = "　【操作方法】\n" +
                                "Ｂ：Ｙｅｓ,戦闘結果予測の表示\n" +
                                "Ａ：Ｎｏ\n" +
                                "Ｙ：メニュー\n" +
                                "Ｘ：このリストの表示\n" +
                                "ＲＢ：初めからスタート\n" +
                                "ＬＴ：データの一時保存\n" +
                                "ＲＴ：一時保存データの読み込み\n" +
                                "MENU: 移動速度を上げる\n" +
                                "WINDOW: 移動速度を落とす\n" +
                                "　　現在の移動回数：" + this._player.getMoveCount() + "\n" +
                                "　　プレイ時間：" + this._player.getPlayTimeText() + "\n" + 
                                "　WWA Wing バージョン:" + VERSION_WWAJS + "\n" +
                                "　マップデータ バージョン: " +
                                Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10;
                            break;
                        default:
                            return;
                    }
                    break;
                case DEVICE_TYPE.SP:
                    // TODO: 仮想パッドでの操作方法を追記
                    return;
                case DEVICE_TYPE.VR:
                    return;
                case DEVICE_TYPE.PC:
                    helpMessage = "　【操作方法】\n" +
                        "Ｆ１、Ｍ：戦闘結果予測の表示\n" +
                        "Ｆ３：復帰用パスワード入力\n" +
                        "Ｆ４：復帰用パスワード表示\n" +
                        "Ｆ５：一時保存データの読み込み\n" +
                        "Ｆ６：データの一時保存\n" +
                        "Ｆ７：初めからスタート\n" +
                        "Ｆ８：ＷＷＡ公式ページにリンク\n" +
                        "Ｆ１２：このリストの表示\n" +
                        "キーボードの「１２３、ＱＷＥ、ＡＳＤ、ＺＸＣ」は右のアイテムボックスに対応。\n" +
                        "「Ｅｎｔｅｒ、Ｙ」はＹｅｓ,\n" +
                        "「Ｅｓｃ、Ｎ」はＮｏに対応。\n" +
                        "　　　Ｉ: 移動速度を落とす／\n" +
                        "Ｆ２、Ｐ: 移動速度を上げる\n" +
                        "　　現在の移動回数：" + this._player.getMoveCount() + "\n" +
                        "　　プレイ時間：" + this._player.getPlayTimeText() + "\n" + 
                        "　WWA Wing バージョン:" + VERSION_WWAJS + "\n" +
                        "　マップデータ バージョン: " +
                        Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10;
                    break;
                default:
                    return;
            }
            if (helpMessage) {
                this.generatePageAndReserveExecution(helpMessage, false, true);
            }

        }
    }

    public _setNextPage(): void {  // TODO(rmn): wwa_parts_player からの参照を断ち切ってprivateに戻す
        this._clearFacesInNextFrame = true;
        if (this._scoreWindow.isVisible()) {
            this._scoreWindow.hide();
            this._scoreRates = undefined;
        }
        if (this._lastPage.isLastPage && this._reservedMoveMacroTurn !== void 0) {
            this._player.setMoveMacroWaiting(this._reservedMoveMacroTurn);
            this._reservedMoveMacroTurn = void 0;
        }
        if (this._pages.length === 0) {
            this._hideMessageWindow();
        } else {
            this._execPageInNextFrame = this._pages.shift();
       }
        if (this._inlineUserVarViewer) {
            this._inlineUserVarViewer.isVisible = false;
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
                this._player.setDelayFrame();
                this._messageWindow.hide();
                this._keyStore.allClear();
                this._mouseStore.clear();
            }
            this._player.clearMessageWaiting();
        } else {
            this.generatePageAndReserveExecution(
                this.getMessageById(mesID),
                false, false, itemID, PartsType.OBJECT,
                this._player.getPosition().getPartsCoord());
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
        this._wwaData.disableSaveFlag = flag;
        this._wwaSave.quickSaveButtonUpdate(this._wwaData);
        return flag;
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

    // 負値, 数値でない値, NaN は 0にする。
    // 小数部分を含む場合は、整数部分だけ取り出す。
    private toValidStatusValue(x: number): number {
        return this.isNotNumberTypeOrNaN(x) || x < 0 ? 0 : Math.floor(x);
    }

    public setPlayerStatus(type: MacroStatusIndex, value: number, isCalledByMacro: boolean): void {
        if (type === MacroStatusIndex.ENERGY) {
            // 生命力は setEnergy 内でマイナスの値を処理しているためこのまま続行
            this._player.setEnergy(value);
            if(
                this._player.isDead() &&
                this.shouldApplyGameOver({ isCalledByMacro })
            ) {
                this.gameover();
            }
        } else if (type === MacroStatusIndex.STRENGTH) {
            this._player.setStrength(this.toValidStatusValue(value));
        } else if (type === MacroStatusIndex.DEFENCE) {
            this._player.setDefence(this.toValidStatusValue(value));
        } else if (type === MacroStatusIndex.GOLD) {
            this._player.setGold(this.toValidStatusValue(value));
        } else if (type === MacroStatusIndex.MOVES) {
            this._player.setMoveCount(this.toValidStatusValue(value));
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

    /**
     * ステータス画像のアイコンを設定します。
     * @param type 種別
     * @param coord 変更するアイコンのイメージ画像内の座標 (マス単位)
     * @throws 種別が 生命力 ～ 所持金 の範囲を外した場合
     */
    public setStatusIconCoord(type: MacroImgFrameIndex, coord: Coord): Coord {
        const x = coord.x * Consts.CHIP_SIZE;
        const y = coord.y * Consts.CHIP_SIZE;

        const setBackgroundIconNode = (elementId: string) => {
            const iconNode = util.$qsh(`${elementId}>.status-icon`);
            iconNode.style.backgroundPosition = `-${x}px -${y}px`;
        };

        switch (type) {
            case MacroImgFrameIndex.ENERGY:
                this._wwaData.imgStatusEnergyX = coord.x;
                this._wwaData.imgStatusEnergyY = coord.y;
                setBackgroundIconNode("#disp-energy");
                break;
            case MacroImgFrameIndex.STRENGTH:
                this._wwaData.imgStatusStrengthX = coord.x;
                this._wwaData.imgStatusStrengthY = coord.y;
                setBackgroundIconNode("#disp-strength");
                break;
            case MacroImgFrameIndex.DEFENCE:
                this._wwaData.imgStatusDefenceX = coord.x;
                this._wwaData.imgStatusDefenceY = coord.y;
                setBackgroundIconNode("#disp-defence");
                break;
            case MacroImgFrameIndex.GOLD:
                this._wwaData.imgStatusGoldX = coord.x;
                this._wwaData.imgStatusGoldY = coord.y;
                setBackgroundIconNode("#disp-gold");
                break;
            default:
                throw new Error("種別が不正です。");
        }
        return coord.clone();
    }

    /**
     * 操作パネルのステータスやボタンの背景画像を変更します。
     * @param coord 変更する背景画像左部分のイメージ画像内の座標 (マス単位)
     */
    public setWideCellCoord(coord: Coord): Coord {
        this._wwaData.imgWideCellX = coord.x;
        this._wwaData.imgWideCellY = coord.y;

        const x = coord.x * Consts.CHIP_SIZE;
        const y = coord.y * Consts.CHIP_SIZE;
        Array.prototype.forEach.call(util.$qsAll("div.wide-cell-row"), (node: HTMLElement) => {
            node.style.backgroundPosition = "-" + x + "px -" + y + "px";
        });
        return coord.clone();
    }

    public setFrameCoord(coord: Coord): Coord {
        this._wwaData.imgFrameX = coord.x;
        this._wwaData.imgFrameY = coord.y;
        this._cgManager.setFrameImage(coord);
        return coord.clone();
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
        this.updateEffect();
    }

    public stopEffect(): void {
        this._wwaData.effectCoords = [];
        this.updateEffect();
    }
    public updateEffect(): void {
        this._cgManager.updateEffects(<Coord[]>this._wwaData.effectCoords);
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
        // 顔グラフィックがある状態では、メッセージウィンドウを下固定にする必要があるので、
        // メッセージウィンドウの位置を変更する
        this._messageWindow.setPositionByPlayerPosition(
            this._faces.length !== 0,
            this._scoreWindow.isVisible(),
            false, // $face マクロの実行はシステムメッセージから実行されないので false 固定
            this._player.getPosition(),
            this._camera.getPosition()
        );
    }

    public clearFaces(): void {
        this._faces = [];
    }

    public updateItemEffectEnabled(isEnabled: boolean): void {
        this._wwaData.isItemEffectEnabled = isEnabled;
    }

    public setOldMove(flag: boolean) {
        this._wwaData.isOldMove = flag;
    }
    public setGameOverPolicy(gameOverPolicy: number) {
        switch(gameOverPolicy) {
            case 0:
                this._wwaData.gameOverPolicy = "default";
                return;
            case 1:
                this._wwaData.gameOverPolicy = "never";
                return;
            case 2:
                this._wwaData.gameOverPolicy = "except-macro";
                return;
            default:
                // 何もしない
                return;
        }
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
        const messageWindowStyleSelector = "div.wwa-message-window, div#wwa-text-message-window, div#wwa-battle-estimate, div#wwa-password-window";
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
    // JumpGateマクロ実装ポイント
    public forcedJumpGate(jx: number, jy: number): void {
        this._player.jumpTo(new Position(this, jx, jy, 0, 0));
    }
    // User変数記憶
    public setUserVar(index: number, value: number): void {
        // number 型でない変数, NaN, 範囲外の index を弾く
        if (this.isNotNumberTypeOrNaN(index) || !this.isValidUserVarIndex(index)) {
            throw new Error (`代入先のユーザ変数の番号 が 0 以上 ${Consts.USER_VAR_NUM - 1} 以下の数値になっていません!`)
        }
        this._wwaData.userVar[index] = this.toAssignableValue(value);
        
        // メッセージボックスに表示されている変数を更新
        this._messageWindow.update();
    }
    /**
     * 数値 x を代入可能な変数に変換する。
     * 
     * 1. x の整数部分のみを取り出す
     * 2. 最小値未満の値なら最小値に、最大値より大きい値なら最大値に固定する。
     * 3. 保険的に、number 型でない値 と NaN は 0 に変換する。
     * 
     * @param x 対象となる整数値
     */
    private toAssignableValue(x: number): number {
        // 整数部分のみにする. 例) -1.1 -> -1, 1.1 -> 1
        const intValue = x > 0 ? Math.floor(x) : Math.ceil(x);
        const clampedValue = Math.max(Math.min(intValue, Consts.USER_VAR_NUM_MAX_VALUE), Consts.USET_VAR_NUM_MIN_VALUE);
        return this.isNotNumberTypeOrNaN(clampedValue) ? 0 : clampedValue;
    }

    /**
     * 数値 index が ユーザ変数の添字として妥当なら true, さもなくば false を返す。
     * 0 以上 USER_VAR_NUM 未満 の整数が妥当。
     * @param index 判定対象の index
     */
    private isValidUserVarIndex(index: unknown): boolean {
        return typeof index === "number" && index >= 0 && index < Consts.USER_VAR_NUM && (index | 0) === index;
    }

    /**
     * 変数 x が number 型 かつ NaN でないなら true, さもなくば false を返す。
     * @param x 判定対象の変数
     */
    private isNotNumberTypeOrNaN(x: unknown): boolean {
        return typeof x !== "number" || x !== x;
    }

    // User変数取得
    public getUserVar(no: number): number {
        return this._wwaData.userVar[no];
    }
    // 現在の位置情報記憶
    public recUserPosition(x: number, y: number): void {
        var pos = this._player.getPosition().getPartsCoord();
        this.setUserVar(x, pos.x);
        this.setUserVar(y, pos.y);
    }
    // 記憶していた座標にジャンプ
    public jumpRecUserPosition(x: number, y: number): void {
        this.forcedJumpGate(this._wwaData.userVar[x], this._wwaData.userVar[y]);
    }
    // 変数デバッグ出力
    public outputUserVar(num: number): void {
        console.log("Var[" + num + "] = " + this._wwaData.userVar[num]);
    }
    // ユーザ変数 <= HP
    public setUserVarHP(num: number): void {
        this.setUserVar(num, this._player.getStatus().energy);
    }
    // ユーザ変数 <= HPMAX
    public setUserVarHPMAX(num: number): void {
        this.setUserVar(num, this._player.getEnergyMax());
    }
    // ユーザ変数 <= AT
    public setUserVarAT(num: number, kind: StatusSolutionKind): void {
        switch (kind) {
            case "bare":
                this.setUserVar(num, this._player.getStatusWithoutEquipments().strength);
                return;
            case "equipment":
                this.setUserVar(num, this._player.getStatusOfEquipments().strength);
                return;
            case "all":
            default:
                this.setUserVar(num, this._player.getStatus().strength);
                return;
        }
    }
    // ユーザ変数 <= DF
    public setUserVarDF(num: number, kind: StatusSolutionKind): void {
        switch (kind) {
            case "bare":
                this.setUserVar(num, this._player.getStatusWithoutEquipments().defence);
                return;
            case "equipment":
                this.setUserVar(num, this._player.getStatusOfEquipments().defence);
                return;
            case "all":
            default:
                this.setUserVar(num, this._player.getStatus().defence);
                return;
        }
    }
    // ユーザ変数 <= MONEY
    public setUserVarMONEY(num: number): void {
        this.setUserVar(num, this._player.getStatus().gold);
    }

    // HP <- ユーザ変数
    public setHPUserVar(index: number, isCalledByMacro: boolean): void {
        if (!this.isValidUserVarIndex(index)) {
            throw new Error("ユーザ変数の添字が範囲外です。");
        }
        this._player.setEnergy(this.toValidStatusValue(this._wwaData.userVar[index]));
        // 0 になった場合はゲームオーバー
        if (
            this._player.isDead() && 
            this.shouldApplyGameOver({ isCalledByMacro })
        ) {
            this.gameover();
        }
        this._player.updateStatusValueBox();
    }
    // HPMAX <- ユーザ変数
    public setHPMAXUserVar(index: number): void {
        if (!this.isValidUserVarIndex(index)) {
            throw new Error("ユーザ変数の添字が範囲外です。");
        }
        this._player.setEnergyMax(this.toValidStatusValue(this._wwaData.userVar[index]));
        this._player.updateStatusValueBox();
    }
    // AT (装備品以外) <- ユーザ変数
    public setATUserVar(index: number): void {
        if (!this.isValidUserVarIndex(index)) {
            throw new Error("ユーザ変数の添字が範囲外です。");
        }
        this._player.setStrength(this.toValidStatusValue(this._wwaData.userVar[index]));
        this._player.updateStatusValueBox();
    }
    // DF (装備品以外) <- ユーザ変数
    public setDFUserVar(index: number): void {
        if (!this.isValidUserVarIndex(index)) {
            throw new Error("ユーザ変数の添字が範囲外です。");
        }
        this._player.setDefence(this.toValidStatusValue(this._wwaData.userVar[index]));
        this._player.updateStatusValueBox();
    }
    // MONEY <- ユーザ変数
    public setMONEYUserVar(index: number): void {
        if (!this.isValidUserVarIndex(index)) {
            throw new Error("ユーザ変数の添字が範囲外です。");
        }
        this._player.setGold(this.toValidStatusValue(this._wwaData.userVar[index]));
        this._player.updateStatusValueBox();
    }
    // ユーザ変数 <- 歩数
    public setUserVarStep(num: number): void {
        this.setUserVar(num, this._player.getMoveCount());
    }
    // ユーザ変数 <- 定数
    public setUserVarVal(x: number, num: number): void {
        this.setUserVar(x, num);
    }
    // ユーザ変数X <- ユーザ変数Y
    public setUserValOtherUserVal(x: number, y: number): void {
        this.setUserVar(x, this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- ユーザ変数X + ユーザ変数Y
    public setUserValAdd(x: number, y: number): void {
        this.setUserVar(x, this._wwaData.userVar[x] + this._wwaData.userVar[y])
    }
    // ユーザ変数X <- ユーザ変数X - ユーザ変数Y
    public setUserValSub(x: number, y: number): void {
        this.setUserVar(x, this._wwaData.userVar[x] - this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- ユーザ変数X * ユーザ変数Y
    public setUserValMul(x: number, y: number): void {
        this.setUserVar(x, this._wwaData.userVar[x] * this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- ユーザ変数X / ユーザ変数Y
    public setUserValDiv(x: number, y: number): void {
        // 商の整数部分を取り出す処理は、setUserVar に任せるのでここではしない。
        this.setUserVar(x, this._wwaData.userVar[y] === 0 ? 0 : this._wwaData.userVar[x] / this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- ユーザ変数X % ユーザ変数Y
    public setUserValMod(x: number, y: number): void {
        // 剰余の整数部分を取り出す処理は、setUserVar に任せるのでここではしない。
        this.setUserVar(x, this._wwaData.userVar[y] === 0 ? 0 : this._wwaData.userVar[x] % this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- rand
    public setUserValRandNum(x: number, num: number, bias: number): void {
        // 最大値で抑える処理は setUserVar でやるのでここではしない
        this.setUserVar(x, Math.floor(Math.random() * this.toAssignableValue(num)) + bias);
    }
    
    // ユーザ変数付きの文字列を組み立てる。
    // 変数は表示する時に評価される。
    private _generateUserValString(macroArgs: string[]): MessageSegments {
        return macroArgs.map((macroArg) => {
            const parsedArg = parseInt(macroArg, 10);
            return isNaN(parsedArg) ?
                // 引数を文字列として解釈する場合
                // 何故か \n が反映されない？
                macroArg.replace(/\\n/g, "\n") :
                // 引数を数値として解釈する場合: ユーザ変数の値を表示する.
                () => this._wwaData.userVar[parsedArg]
        });
    }
    // 速度変更禁止
    public speedChangeJudge(speedChangeFlag: boolean): void {
        this._wwaData.permitChangeGameSpeed = speedChangeFlag;
    }

    public execSetMacro(macroStr: string = ""): void {
        const { assignee, rawValue } = ExpressionParser.evaluateSetMacroExpression(
            macroStr, this._generateTokenValues()
        );
        switch(assignee) {
            case "energy":
                this._player.setEnergy(this.toValidStatusValue(rawValue));
                if (
                    this._player.isDead() &&
                    this.shouldApplyGameOver({ isCalledByMacro: true })
                ) {
                    this.gameover();
                }
                break;
            case "energyMax":
                this._player.setEnergyMax(this.toValidStatusValue(rawValue));
                break;
            case "strength":
                this._player.setStrength(this.toValidStatusValue(rawValue));
                break;
            case "defence":
                this._player.setDefence(this.toValidStatusValue(rawValue));
                break;
            case "gold":
                this._player.setGold(this.toValidStatusValue(rawValue));
                break;
            default:
                if (isNaN(assignee) || !this.isValidUserVarIndex(assignee)) {
                    throw new Error("ユーザ変数の添字が範囲外です。");
                }
                this.setUserVar(assignee, this.toAssignableValue(rawValue));
                break;
        }
        this._player.updateStatusValueBox();
    }

    private _generateTokenValues(): ExpressionParser.TokenValues {
        // TODO: これ呼ぶ以外の方法ないのかな
        this.setNowPlayTime();
        return {
            totalStatus: this._player.getStatus(),
            bareStatus: this._player.getStatusWithoutEquipments(),
            itemStatus: this._player.getStatusOfEquipments(),
            energyMax: this._player.getEnergyMax(),
            moveCount: this._player.getMoveCount(),
            playTime: this._wwaData.playTime,
            userVars: this._wwaData.userVar,
            playerCoord: this._player.getPosition().getPartsCoord(),
        }
    }

    // ユーザ変数 IFElse
    public userVarUserIf(_triggerPartsPosition: Coord, args: string[]): void {
        // true 時配置パーツの Y 座標 (必須パラメータの最後の引数) が省略されている場合は, エラーとする
        if (args[5] === undefined) {
            throw new Error("$if の引数不足 str=" + args);
        }
        const userVar1Index = parseInt(args[0], 10);
        const userVar2Index = parseInt(args[2], 10);
        if(!this.isValidUserVarIndex(userVar1Index) || !this.isValidUserVarIndex(userVar2Index)) {
            throw new Error("判定対象のユーザ変数の添字が範囲外です!")
        }
        const userVar1 = this._wwaData.userVar[userVar1Index];
        const opeCode = args[1];
        const userVar2 = this._wwaData.userVar[userVar2Index];

        /**
         *  partsTypeArgument が 0 以外の数値として解釈できるなら 背景パーツ
         *  0 に解釈される文字列や undefined なら 物体パーツ を返す。
         */
        const parsePartsType = (partsTypeArgument: string | undefined): PartsType => 
            // parseInt(undefined, 10) => NaN であり, NaN は falsy である.
            parseInt(partsTypeArgument, 10) ? PartsType.MAP : PartsType.OBJECT

        if (this.compareUserVar(userVar1, opeCode, userVar2)) {
            const partsId = parseInt(args[3], 10);
            const partsX = args[4];
            const partsY = args[5];
            // str[6] 省略や 0 など falsy なら物体パーツ.
            const partsType = parsePartsType(args[6]);
            this.appearPartsEval(_triggerPartsPosition, partsX, partsY, partsId, partsType);
            return;
        }

        // false 時配置パーツの Y 座標が省略されている場合は, false 時の配置はしない
        if (args[9] === undefined) {
            return;
        }
        const partsId = parseInt(args[7], 10);
        const partsX = args[8];
        const partsY = args[9];
        // str[10] 省略や 0 など falsy なら物体パーツ
        const partsType = parsePartsType(args[10]);
        this.appearPartsEval(_triggerPartsPosition, partsX, partsY, partsId, partsType);
    }

    private compareUserVar(userVar1: number, opecode: string, userVar2: number): boolean {
        switch (opecode) {
            case "==":
                return userVar1 === userVar2;
            case "!=":
                return userVar1 !== userVar2;
            case ">=":
                return userVar1 >= userVar2;
            case ">":
                return userVar1 > userVar2;
            case "<=":
                return userVar1 <= userVar2;
            case "<":
                return userVar1 < userVar2;
            default:
                throw new Error(`未定義の演算子です: ${opecode}`)
        }
    }

    // プレイヤー速度設定
    public setPlayerSpeedIndex(speedIndex: number): void {
        if (speedIndex < Consts.MIN_SPEED_INDEX || Consts.MAX_SPEED_INDEX < speedIndex) {
            throw new Error("#set_speed の引数が異常です:" + speedIndex);
        }
        this._wwaData.gameSpeedIndex = this._player.setSpeedIndex(speedIndex);
    }
    // ユーザ変数にプレイ時間を代入
    public setUserVarPlayTime(num: number): void {
        this.setNowPlayTime();
        this.setUserVar(num, this._wwaData.playTime);
    }
    // 現在時刻セット
    private setNowPlayTime(): void {
        const _nowTime = new Date();
        this._wwaData.playTime += (_nowTime.getTime() - this._startTime);
        this._startTime = _nowTime.getTime();
    }
    // 各種ステータスを非表示にする
    public hideStatus(no: number, isHide: boolean): void {
        if (no < 0 || no > StatusKind.length) {
            throw new Error("隠すパラメータは０から３の間で指定してください。");
        }
        this._changeStatusVisibility(StatusKind[no], !isHide);
        this._player.updateStatusValueBox();
    }
    // 指定位置にパーツを出現を変数で行う
    public varMap(
        triggerPartsPos: Coord,
        xstr: string,
        ystr: string,
        partsID: number,
        targetPartsType: PartsType
    ): void {
        if (!this.isValidUserVarIndex(partsID)) {
            throw new Error("対象のユーザ変数の添字が範囲外です");
        }
        const targetPartsID = this._wwaData.userVar[partsID];
        if (targetPartsID < 0) {
            throw new Error("負のパーツ番号は指定できません");
        }
        if (targetPartsType === PartsType.OBJECT && targetPartsID >= this.getObjectPartsNum()) {
            throw new Error("物体パーツ番号の最大値を超えるパーツ番号が指定されました");
        }
        if ( targetPartsType === PartsType.MAP && targetPartsID >= this.getMapPartsNum()) {
            throw new Error("背景パーツ番号の最大値を超えるパーツ番号が指定されました");
        }
        this.appearPartsEval(triggerPartsPos, xstr, ystr, targetPartsID, targetPartsType);
    }

    /**
     * アイテムボックスの背景画像を置き換えます。
     * 単位は、利用している画像の左上のチップを(x, y)=(0, 0)とするチップ単位です。
     * @param pos 置き換えるアイテムボックスの背景の画像の、WWAで利用している画像内における位置
     */
    public setItemboxBackgroundPosition(pos: { x: number, y: number}): void {
        this._wwaData.imgItemboxX = pos.x;
        this._wwaData.imgItemboxY = pos.y;
        Array.prototype.forEach.call(util.$qsAll("div.item-cell"), (node: HTMLElement) => {
            node.style.backgroundPosition = `-${pos.x * Consts.CHIP_SIZE}px -${pos.y * Consts.CHIP_SIZE}px`;
        });
    }

    private _actionGamePadButtonItemMacro(): boolean{
        if(!this._wwaData.gamePadButtonItemTable) {
            return false;
        }
        var len: number, buttonID: number, itemBoxNo: number, inputButtonFlag: boolean;
        len = this._wwaData.gamePadButtonItemTable.length;
        for (buttonID = 0; buttonID < len; buttonID++) {
            itemBoxNo = this._wwaData.gamePadButtonItemTable[buttonID];
            if (!itemBoxNo) {
                //使用するアイテムボックス番号が存在しない
                continue;
            }
            inputButtonFlag = false;
            switch (buttonID) {
                case GamePadState.BUTTON_CROSS_KEY_LEFT:
                    if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                        inputButtonFlag = true;
                    }
                    break;
                case GamePadState.BUTTON_CROSS_KEY_RIGHT:
                    if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                        inputButtonFlag = true;
                    }
                    break;
                case GamePadState.BUTTON_CROSS_KEY_UP:
                    if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                        inputButtonFlag = true;
                    }
                    break;
                case GamePadState.BUTTON_CROSS_KEY_DOWN:
                    if (this._gamePadStore.crossPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                        inputButtonFlag = true;
                    }
                    break;
            }
            if (this._gamePadStore.buttonTrigger(buttonID)) {
                inputButtonFlag = true;
            }
            if (inputButtonFlag) {
                //ゲームパッドのボタンIDが押されている
                if (this.onselectitem(itemBoxNo)) {
                    //アイテムを実行
                    return true;
                }
            }

        }
        return false;
    }

    /**
      ゲームパッドのボタン割当設定を追加します。
      @param buttonID ボタンのID ( GamePad で割り当てているボタンに従う )
      @param itemBoxNo 割り当てるアイテムボックスの番号 (アイテムの物体パーツ番号ではない)
    **/
    public setGamePadButtonItemTable(buttonID: number, itemBoxNo: number): void {
        // TODO: this._wwaData.gamePadButtonItemTable は起動時に初期化したい
        if (!this._wwaData.gamePadButtonItemTable) {
            var currentButtonID: string, currentButtonKey: string;
            this._wwaData.gamePadButtonItemTable = [];
            for (currentButtonKey in GamePadState) {
                currentButtonID = currentButtonKey;
                this._wwaData.gamePadButtonItemTable[currentButtonID] = 0;
            }
        }
        if (this._wwaData.gamePadButtonItemTable.length > buttonID) {
            this._wwaData.gamePadButtonItemTable[buttonID] = itemBoxNo;
        }
    }

    /**
     * セーブデータの内容を確認し、現在の WWA のマップデータで互換性があるか確認します。
     * エラーがある場合はエラーコードを、エラーがない場合は null を返します
     * @param saveDataWorldName セーブデータのワールド名 v3.5.6 以下の WWA では存在しないので undefined
     * @param saveDataHash セーブデータのハッシュ値 （マップデータから生成されるMD5ハッシュ値）
     * @param mapDataRevisionKey セーブデータのリビジョン（ワールド名と暗証番号から生成されるMD5ハッシュ値） v3.5.6 以下の WWA では存在しないので undefined
     */
    private _checkSaveDataCompatibility(saveDataWorldName: string | undefined, saveDataHash: string, mapDataRevisionKey: string | undefined): LoadErrorCode | null {
        if (saveDataWorldName !== undefined && saveDataWorldName !== this._wwaData.worldName) {
            return LoadErrorCode.UNMATCHED_WORLD_NAME;
          // v3.5.6 以下より WWA Wing をアップデートした場合にセーブデータが無効になるのを防ぐため、 メジャーリビジョンがない場合はエラーとしない。
        } else if (mapDataRevisionKey && mapDataRevisionKey !== generateMapDataRevisionKey(this._wwaData.worldName, this._wwaData.worldPassNumber)) {
            // リビジョン が不一致だが、前段の if 文よりタイトルは一致しているので、暗証番号が不一致である。
            return LoadErrorCode.UNMATCHED_WORLD_PASS_NUMBER;
        } else if (this._isDisallowLoadOldSave && saveDataHash !== this.checkOriginalMapString) {
            return LoadErrorCode.DISALLOW_OLD_REVISION_WORLD_SAVE_DATA;
        }
        return null;
    }

    public isVisibleStatus(statusKind: StatusKind): boolean {
        switch(statusKind) {
            case "energy": return this._wwaData.isVisibleStatusEnergy;
            case "strength": return this._wwaData.isVisibleStatusStrength;
            case "defence": return this._wwaData.isVisibleStatusDefence;
            case "gold": return this._wwaData.isVisibleStatusGold;
            default: throw new Error("存在しないステータスが与えられました");
        }
    }

    private _changeStatusVisibility(statusKind: StatusKind, isVisible: boolean): boolean {
        switch(statusKind) {
            case "energy":
                this._wwaData.isVisibleStatusEnergy = isVisible;
                return;
            case "strength":
                this._wwaData.isVisibleStatusStrength = isVisible;
                return;
            case "defence":
                this._wwaData.isVisibleStatusDefence = isVisible;
                return;
            case "gold":
                this._wwaData.isVisibleStatusGold = isVisible;
                return;
            default: throw new Error("存在しないステータスが与えられました");
        }
    }

    private _updateVarDumpInformationArea(content: string, isError: boolean = false) {
        if(!this._dumpElement) {
            return;
        }
        const elm = this._dumpElement.querySelector(".varlist-information");
        if (!elm) {
            return;
        }
        elm.textContent = `${isError ? "【エラー】" : ""}${content}`;
    }

    public shouldApplyGameOver({ isCalledByMacro }: { isCalledByMacro: boolean }) {
        if(isCalledByMacro) {
            return this._wwaData.gameOverPolicy === "default";
        } else {
            return this._wwaData.gameOverPolicy === "default" || this._wwaData.gameOverPolicy ==="except-macro";
        }
    }
};

var isCopyRightClick = false;

function setupVarDumpElement(dumpElmQuery: string): HTMLElement | null {
    const dumpElm = util.$qs(dumpElmQuery) as HTMLElement | null;
    if (!dumpElm) {
        // 要素がない場合は何もしない
        return null;
    }
    dumpElm.classList.add("wwa-vardump-wrapper")
    const tableElm = document.createElement("table");
    const headerTrElm = document.createElement("tr");
    const headerThElm = document.createElement("th");
    const hideButton = document.createElement("button");
    const informationElm = document.createElement("td");
    hideButton.textContent = "隠す";
    headerThElm.textContent = "変数一覧";
    headerThElm.setAttribute("colspan", "10");
    headerThElm.classList.add("varlist-header");
    headerThElm.appendChild(hideButton);
    headerTrElm.appendChild(headerThElm);
    informationElm.setAttribute("colspan", "10");
    informationElm.classList.add("varlist-information");
    informationElm.textContent = "強調されている番号にカーソルを乗せると説明が表示されます。";
    tableElm.appendChild(headerTrElm);
    tableElm.appendChild(informationElm);
    let trNumElm: HTMLElement = null;
    let trValElm: HTMLElement = null;
    for (var i = 0; i < Consts.USER_VAR_NUM; i++) {
        if (i % 10 === 0) {
            if (trNumElm !== null) {
                tableElm.appendChild(trNumElm);
                tableElm.appendChild(trValElm);
            }
            trNumElm = document.createElement("tr");
            trNumElm.classList.add("var-number");
            trValElm = document.createElement("tr");
            trValElm.classList.add("var-val");
        }
        const thNumElm = document.createElement("th");
        const varLabelElm = document.createElement("div");
        varLabelElm.textContent = "-";
        varLabelElm.setAttribute("aria-hidden", "true");
        thNumElm.classList.add(`var-index${i}`);
        const tdValElm = document.createElement("td");
        thNumElm.textContent = i + "";
        thNumElm.appendChild(varLabelElm);
        tdValElm.classList.add(`var${i}`);
        tdValElm.textContent = "-";
        trNumElm.appendChild(thNumElm);
        trValElm.appendChild(tdValElm);
    }
    if (Consts.USER_VAR_NUM % 10 !== 0) {
        tableElm.appendChild(trNumElm);
        tableElm.appendChild(trValElm);
    }
    dumpElm.appendChild(tableElm);
    var varDispStatus = true;
    hideButton.addEventListener("click", function (e) {
        if (varDispStatus) {
            this.textContent = "表示";
            informationElm.style.display = "none";
            Array.prototype.forEach.call(
                tableElm.querySelectorAll("tr.var-number"), function (etr) {
                    etr.style.display = "none";
                });
            Array.prototype.forEach.call(
                tableElm.querySelectorAll("tr.var-val"), function (etr) {
                    etr.style.display = "none";
                });
            varDispStatus = false;
        } else {
            this.textContent = "隠す";
            informationElm.style.display = "";
            Array.prototype.forEach.call(
                tableElm.querySelectorAll("tr.var-number"), function (etr) {
                    etr.style.display = "";
                });
            Array.prototype.forEach.call(
                tableElm.querySelectorAll("tr.var-val"), function (etr) {
                    etr.style.display = "";
                });
            varDispStatus = true;
        }
    });
    return dumpElm;
}

function start() {
    if (
      // Internet Explorer
      navigator.userAgent.match(/(?:msie|trident)/i) ||
      // Microsoft Edge レガシ (Chromium Edge の UA に含まれるのは「Edg」なので問題ない)
      navigator.userAgent.match(/edge/i)
    ) {
      alert(`このゲームをプレイするには、Google Chrome や Mozilla Firefox などの最新のブラウザでこのページを開いてください。
ご利用の環境のサポートは、既に終了しています。`);
      return;
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
    var titleImgName = util.$id("wwa-wrapper").getAttribute("data-wwa-title-img");
    inject(<HTMLDivElement>util.$id("wwa-wrapper"), titleImgName);
    var mapFileName = util.$id("wwa-wrapper").getAttribute("data-wwa-mapdata");
    var audioDirectory = util.$id("wwa-wrapper").getAttribute("data-wwa-audio-dir");
    var dumpElmQuery = util.$id("wwa-wrapper").getAttribute("data-wwa-var-dump-elm");
    var dumpElm: HTMLElement | null = null;
    /** 変数を表示できるか */
    var canDisplayUserVars = (util.$id("wwa-wrapper").getAttribute("data-wwa-display-user-vars") === "true");
    /** WWAの変数命名データを読み込む */
    var userVarNamesFile = util.$id("wwa-wrapper").getAttribute("data-wwa-user-var-names-file");
    if (util.$id("wwa-wrapper").hasAttribute("data-wwa-var-dump-elm") && canDisplayUserVars) {
        dumpElm = setupVarDumpElement(dumpElmQuery);
    }
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
    let useGoToWWA = false;
    const useGoToWWAAttribute = util.$id("wwa-wrapper").getAttribute("data-wwa-use-go-to-wwa");
    if (useGoToWWAAttribute !== null && useGoToWWAAttribute.match(/^true$/i)) {
        useGoToWWA = true;
    }
    const disallowLoadOldSave = (() => {
        const disallowLoadOldSaveAttribute = util.$id("wwa-wrapper").getAttribute("data-wwa-disallow-load-old-save");
        if (disallowLoadOldSaveAttribute !== null && disallowLoadOldSaveAttribute.match(/^true$/i)) {
            return true;
        }
        return false;
    })();
    wwa = new WWA(
        mapFileName,
        urlgateEnabled,
        titleImgName,
        classicModeEnabled,
        itemEffectEnabled,
        useGoToWWA,
        audioDirectory,
        disallowLoadOldSave,
        dumpElm,
        userVarNamesFile,
        canDisplayUserVars
    );
}


if (document.readyState === "complete") {
    setTimeout(start);
} else {
    window.addEventListener("load", function () {
        setTimeout(start);
    });
}
