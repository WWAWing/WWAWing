interface AudioJSInstance {
    play(): void;
    pause(): void;
    skipTo(pos: number): void;
    element: HTMLAudioElement;
    loadedPercent: number
    wrapper: HTMLElement;
}

interface AudiojsTScomp {
    create(a, b?): AudioJSInstance;
}

declare var audiojs: AudiojsTScomp;
declare var wwap_mode: boolean;
declare var external_script_inject_mode: boolean;
declare var CryptoJS: any; // ゆるして
declare function loader_start(e: any): void;
var postMessage_noWorker = function (e: any): void { };

var wwa: WWA;

/**
 *
 *
 * @param current
 * @param total
 * @param stage
 * @returns {wwa_data.LoaderProgress}
 */
export function getProgress(current: number, total: number, stage: wwa_data.LoadStage): wwa_data.LoaderProgress {
    var progress = new wwa_data.LoaderProgress();
    progress.current = current;
    progress.total = total;
    progress.stage = stage;
    return progress;
}

export class WWA {
    private _cvs: HTMLCanvasElement;
    private _cvsSub: HTMLCanvasElement;
    private _cgManager: CGManager;
    private _wwaData: Data;
    private _mainCallCounter: number;
    private _animationCounter: number;
    private _player: wwa_parts_player.Player;
    private _monster: wwa_monster.Monster;
    private _keyStore: KeyStore;
    private _mouseStore: MouseStore;
    private _camera: Camera;
    private _objectMovingDataManager: wwa_motion.ObjectMovingDataManager;
    private _messageWindow: wwa_message.MessageWindow;
    private _monsterWindow: wwa_message.MosterWindow;
    private _scoreWindow: wwa_message.ScoreWindow;
    //        private _messageQueue: string[];
    private _messageQueue: wwa_message.MessageInfo[];
    private _yesNoJudge: wwa_data.YesNoState;
    private _yesNoJudgeInNextFrame: wwa_data.YesNoState;
    private _yesNoChoicePartsCoord: Coord;
    private _yesNoChoicePartsID: number;
    private _yesNoChoiceCallInfo: wwa_data.ChoiceCallInfo;
    private _yesNoDispCounter: number;
    private _yesNoUseItemPos: number;
    private _yesNoURL: string;
    private _waitTimeInCurrentFrame: number;
    private _wwaWrapperElement: HTMLDivElement;
    private _mouseControllerElement: HTMLDivElement;
    private _statusPressCounter: wwa_data.Status; // ステータス型があるので、アニメーション残りカウンタもこれで代用しまぁす。
    private _battleEstimateWindow: wwa_estimate_battle.BattleEstimateWindow;
    private _passwordWindow: wwa_password_window.PasswordWindow;

    private _stopUpdateByLoadFlag: boolean;
    private _isURLGateEnable: boolean;
    private _loadType: wwa_data.LoadType;
    private _restartData: wwa_data.WWAData;
    private _quickSaveData: wwa_data.WWAData;
    private _prevFrameEventExected: boolean;

    private _reservedMoveMacroTurn: number; // $moveマクロは、パーツマクロの中で最後に効果が現れる。実行されると予約として受け付け、この変数に予約内容を保管。
    private _lastMessage: wwa_message.MessageInfo;
    private _frameCoord: Coord;
    private _battleEffectCoord: Coord;

    private _audioJSInstances: AudioJSInstance[];
    private _audioJSInstancesSub: AudioJSInstance[]; // 戦闘など、同じ音を高速に何度も鳴らす時用のサブのインスタンスの配列
    private _nextSoundIsSub: boolean;

    private _playSound: (s: number) => void;

    private _temporaryInputDisable: boolean;

    private _isLoadedSound: boolean;

    private _soundLoadSkipFlag: boolean;

    private _passwordLoadExecInNextFrame: boolean;
    private _passwordSaveExtractData: wwa_data.WWAData;

    private _faces: wwa_data.Face[];
    private _execMacroListInNextFrame: wwa_message.Macro[];
    private _clearFacesInNextFrame: boolean;
    private _paintSkipByDoorOpen: boolean; // WWA.javaの闇を感じる扉モーションのための描画スキップフラグ

    private _useConsole: boolean;
    private _audioDirectory: string;
    ////////////////////////
    public debug: boolean;
    private hoge: number[][];
    ////////////////////////

    private _loadHandler: (e) => void;

    // private _wwaData.userVar: number[];
    // private _wwaData.permitGameSpeed: boolean;
    private _startTime: number;
    private _dumpElement: HTMLElement;

    constructor(mapFileName: string, workerFileName: string, urlgateEnabled: boolean = false, audioDirectory: string = "", dumpElm: HTMLElement = null) {
        try {
            util.$id("version").textContent = "WWA Wing XE Ver." + Consts.VERSION_WWAJS;
        } catch (e) { }

        // User変数宣言
        /*
              this._wwaData.userVar = new Array(Consts.USER_VAR_NUM);
              for(var i=0; i<Consts.USER_VAR_NUM; i++){
                  this._wwaData.userVar[i] = 0;
              }
        */
        this._dumpElement = dumpElm;

        // 速度変更許可
        this._isURLGateEnable = urlgateEnabled;
        this._mainCallCounter = 0;
        this._animationCounter = 0;
        this._statusPressCounter = new wwa_data.Status(0, 0, 0, 0);
        if (!audioDirectory) {
            audioDirectory = "./audio/";
        } else if (audioDirectory[audioDirectory.length - 1] !== "/") {
            audioDirectory += "/";
        }
        this._audioDirectory = audioDirectory;
        var t_start: number = new Date().getTime();
        var isLocal = !!location.href.match(/^file/);
        if (isLocal) {
            alert(
                "【警告】直接HTMLファイルを開いているようです。\n" +
                "このプログラムは正常に動作しない可能性があります。\n" +
                "マップデータの確認を行う場合には同梱の「WWA Debugger」をご利用ください。"
            );
        }
        if (window["audiojs"] === void 0) {
            alert("Audio.jsのロードに失敗しました。\n" +
                "フォルダ" + this._audioDirectory + "の中にaudio.min.jsは配置されていますか？ \n" +
                "フォルダを変更される場合には data-wwa-audio-dir 属性を指定してください");
            return;
        }

        this._loadHandler = (e): void => {
            if (e.data.error !== null && e.data.error !== void 0) {
                alert("下記のエラーが発生しました。: \n" + e.data.error.message);
                return;
            }
            if (e.data.progress !== null && e.data.progress !== void 0) {
                this._setProgressBar(e.data.progress);
                return;
            }

            this._wwaData = e.data.wwaData;
            /* WWAWing XE 拡張部分 */
            //
            this._wwaData.permitGameSpeed = true;
            this._wwaData.userVar = new Array(Consts.USER_VAR_NUM);
            for (var i = 0; i < Consts.USER_VAR_NUM; i++) {
                this._wwaData.userVar[i] = 0;
            }
            this._wwaData.gameSpeed = 3;
            // プレイ時間関連
            this._wwaData.playTime = 0;
            var _nowTime: any;
            _nowTime = new Date();
            this._startTime = _nowTime.getTime();
            /* WWAWing XE 拡張部分ここまで */
            this.initCSSRule();
            this._setProgressBar(getProgress(0, 4, wwa_data.LoadStage.GAME_INIT));
            var cgFile = new Image();
            cgFile.src = this._wwaData.mapCGName;
            cgFile.addEventListener("error", (): void => {
                alert("画像ファイル「" + this._wwaData.mapCGName + "」が見つかりませんでした。\n" +
                    "管理者の方へ: データがアップロードされているか、パーミッションを確かめてください。");
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

            this._setProgressBar(getProgress(1, 4, wwa_data.LoadStage.GAME_INIT));
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
            var status = new wwa_data.Status(
                this._wwaData.statusEnergy, this._wwaData.statusStrength,
                this._wwaData.statusDefence, this._wwaData.statusGold);
            this._player = new wwa_parts_player.Player(this, playerPosition, this._camera, status, this._wwaData.statusEnergyMax);
            this._objectMovingDataManager = new wwa_motion.ObjectMovingDataManager(this, this._player);
            this._camera.setPlayer(this._player);
            this._keyStore = new KeyStore();
            this._mouseStore = new MouseStore();
            this._messageQueue = [];
            this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
            this._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.NONE;
            this._prevFrameEventExected = false;
            this._lastMessage = new wwa_message.MessageInfo("", false, false, []);
            this._execMacroListInNextFrame = [];
            this._passwordLoadExecInNextFrame = false;
            this._setProgressBar(getProgress(2, 4, wwa_data.LoadStage.GAME_INIT));
            window.addEventListener("keydown", (e): void => {
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
                e.preventDefault();
            });
            this._wwaWrapperElement = <HTMLDivElement>(wwa_util.$id("wwa-wrapper"));
            this._mouseControllerElement = <HTMLDivElement>(wwa_util.$id("wwa-controller"));

            this._mouseControllerElement.addEventListener("mousedown", (e): void => {
                if (e.which === 1) {
                    if (this._mouseStore.getMouseState() !== wwa_input.MouseState.NONE) {
                        e.preventDefault();
                        return;
                    }
                    var mousePos = wwa_util.$localPos(e.clientX, e.clientY);
                    var playerPos = this._player.getDrawingCenterPosition();
                    var dist = mousePos.substract(playerPos);
                    var dx = Math.abs(dist.x);
                    var dy = Math.abs(dist.y);
                    var dir: wwa_data.Direction;
                    if (dist.y > 0 && dy > dx) {
                        dir = wwa_data.Direction.DOWN;
                    } else if (dist.y < 0 && dy > dx) {
                        dir = wwa_data.Direction.UP;
                    } else if (dist.x > 0 && dy < dx) {
                        dir = wwa_data.Direction.RIGHT;
                    } else if (dist.x < 0 && dy < dx) {
                        dir = wwa_data.Direction.LEFT;
                    }
                    this._mouseStore.setPressInfo(dir);
                    e.preventDefault();
                }
            });


            this._mouseControllerElement.addEventListener("mouseleave", (e): void => {
                this._mouseStore.clear();
            });
            this._mouseControllerElement.addEventListener("mouseup", (e): void => {
                if (e.which === 1) {
                    this._mouseStore.setReleaseInfo();
                    e.preventDefault();
                }
            });

            //////////////// タッチ関連 超β ////////////////////////////
            if (window["TouchEvent"] /* ←コンパイルエラー回避 */) {
                this._mouseControllerElement.addEventListener("touchstart", (e: any /*←コンパイルエラー回避*/): void => {
                    if (this._mouseStore.getMouseState() !== wwa_input.MouseState.NONE) {
                        e.preventDefault();
                        return;
                    }
                    var mousePos = wwa_util.$localPos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                    var playerPos = this._player.getDrawingCenterPosition();
                    var dist = mousePos.substract(playerPos);
                    var dx = Math.abs(dist.x);
                    var dy = Math.abs(dist.y);
                    var dir: wwa_data.Direction;
                    if (dist.y > 0 && dy > dx) {
                        dir = wwa_data.Direction.DOWN;
                    } else if (dist.y < 0 && dy > dx) {
                        dir = wwa_data.Direction.UP;
                    } else if (dist.x > 0 && dy < dx) {
                        dir = wwa_data.Direction.RIGHT;
                    } else if (dist.x < 0 && dy < dx) {
                        dir = wwa_data.Direction.LEFT;
                    }
                    this._mouseStore.setPressInfo(dir, e.changedTouches[0].identifier);
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                });

                this._mouseControllerElement.addEventListener("touchend", (e: any): void => {
                    for (var i = 0; i < e.changedTouches.length; i++) {
                        if (this._mouseStore.getTouchID() === e.changedTouches[i].identifier) {
                            this._mouseStore.setReleaseInfo();
                            e.preventDefault();
                            break;
                        }
                    }
                });


                this._mouseControllerElement.addEventListener("touchcancel", (e: any): void => {
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
                if (this._player.isControllable()) {
                    this.onselectbutton(wwa_data.SidebarButton.QUICK_LOAD);
                }
            });

            util.$id("button-save").addEventListener("click", () => {
                if (this._player.isControllable()) {
                    this.onselectbutton(wwa_data.SidebarButton.QUICK_SAVE);
                }
            });

            util.$id("button-restart").addEventListener("click", () => {
                if (this._player.isControllable()) {
                    this.onselectbutton(wwa_data.SidebarButton.RESTART_GAME);
                }
            });
            util.$id("button-gotowwa").addEventListener("click", () => {
                if (this._player.isControllable()) {
                    this.onselectbutton(wwa_data.SidebarButton.GOTO_WWA);
                }
            });

            Array.prototype.forEach.call(util.$qsAll(".wide-cell-row"), (node: HTMLElement) => {
                node.addEventListener("click", () => {
                    this._displayHelp();
                });

            });

            this._frameCoord = new Coord(Consts.IMGPOS_DEFAULT_FRAME_X, Consts.IMGPOS_DEFAULT_YESNO_Y);
            this._battleEffectCoord = new Coord(Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_X, Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_Y);

            this._battleEstimateWindow = new wwa_estimate_battle.BattleEstimateWindow(
                this, this._wwaData.mapCGName, wwa_util.$id("wwa-wrapper"));

            this._passwordWindow = new wwa_password_window.PasswordWindow(
                this, <HTMLDivElement>wwa_util.$id("wwa-wrapper"));

            this._messageWindow = new wwa_message.MessageWindow(
                this, 50, 180, 340, 0, "", this._wwaData.mapCGName, false, true, util.$id("wwa-wrapper"));
            this._monsterWindow = new wwa_message.MosterWindow(
                this, new Coord(50, 180), 340, 60, false, util.$id("wwa-wrapper"), this._wwaData.mapCGName);
            this._scoreWindow = new wwa_message.ScoreWindow(
                this, new Coord(50, 50), false, util.$id("wwa-wrapper"));
            this._setProgressBar(getProgress(3, 4, wwa_data.LoadStage.GAME_INIT));

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


            this._cgManager = new CGManager(ctx, ctxSub, this._wwaData.mapCGName, (): void => {
                if (this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE] === "ON") {
                    this._isLoadedSound = true;
                    this.setMessageQueue("ゲームを開始します。\n画面をクリックしてください。\n" +
                        "※iOS, Android端末では、音楽は再生されないことがあります。", false, true);
                    this.loadSound();

                    setTimeout(this.soundCheckCaller, Consts.DEFAULT_FRAME_INTERVAL, this);

                    return;
                } if (this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE] === "OFF") {
                    this._isLoadedSound = false;
                    this.setMessageQueue("ゲームを開始します。\n画面をクリックしてください。", false, true);
                    this.openGameWindow();
                    return;
                }

                this._messageWindow.setMessage(
                    (
                        this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE] === "" ?
                            "効果音・ＢＧＭデータをロードしますか？" :
                            this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE]
                    ) + "\n※iOS, Android端末では、選択に関わらず音楽が再生されないことがあります。");
                this._messageWindow.show();
                this._setProgressBar(getProgress(4, 4, wwa_data.LoadStage.GAME_INIT));
                var timer = setInterval((): void => {
                    self._keyStore.update();

                    if (self._yesNoJudgeInNextFrame === wwa_data.YesNoState.UNSELECTED) {
                        if (
                            self._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                            self._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN
                        ) {
                            self._yesNoJudgeInNextFrame = wwa_data.YesNoState.YES
                        } else if (
                            self._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                            self._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN
                        ) {
                            self._yesNoJudgeInNextFrame = wwa_data.YesNoState.NO
                        }
                    }

                    if (self._yesNoJudgeInNextFrame === wwa_data.YesNoState.YES) {
                        clearInterval(timer);
                        self._messageWindow.update();
                        self._yesNoJudge = self._yesNoJudgeInNextFrame;
                        self._messageWindow.setInputDisable();
                        setTimeout((): void => {
                            self._messageWindow.update();
                            setTimeout((): void => {
                                self._messageWindow.hide();
                                self._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                                self._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
                                self._isLoadedSound = true;
                                self.loadSound();
                                setTimeout(this.soundCheckCaller, Consts.DEFAULT_FRAME_INTERVAL, this);
                            }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                        }, Consts.DEFAULT_FRAME_INTERVAL);
                    } else if (self._yesNoJudgeInNextFrame === wwa_data.YesNoState.NO) {
                        clearInterval(timer);
                        self._messageWindow.update();
                        self._yesNoJudge = self._yesNoJudgeInNextFrame;
                        self._messageWindow.setInputDisable();
                        setTimeout((): void => {
                            self._messageWindow.update();
                            setTimeout((): void => {
                                self._messageWindow.hide();
                                self._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                                self._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
                                self._isLoadedSound = false;
                                self.openGameWindow();
                            }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                        }, Consts.DEFAULT_FRAME_INTERVAL);
                    }

                }, Consts.DEFAULT_FRAME_INTERVAL);

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
                if (!script.src.match(/^http:\/\/wwawing\.com/) && !script.src.match(/^http:\/\/www\.wwawing\.com/)) {
                    throw new Error("SCRIPT ORIGIN ERROR");
                }
            }
            var self1 = this;
            postMessage_noWorker = (e): void => {
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

    private _setProgressBar(progress: wwa_data.LoaderProgress) {

        if (progress.stage <= Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO) {
            (wwa_util.$id("progress-message-container")).textContent =
                (progress.stage === Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO ? "World Name: " + this._wwaData.worldName : wwa_data.loadMessages[progress.stage]);

            (wwa_util.$id("progress-bar")).style.width =
                (1 * progress.stage + (progress.current / progress.total) * 1) / (Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO + 1) * Consts.MAP_WINDOW_WIDTH + "px";

            (wwa_util.$id("progress-disp")).textContent =
                ((1 * progress.stage + (progress.current / progress.total) * 1) / (Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO + 1) * 100).toFixed(2) + "%";
        } else {
            (wwa_util.$id("progress-message-container")).textContent = "効果音/BGMを読み込んでいます。(スペースキーでスキップ）";

            (wwa_util.$id("progress-bar-audio")).style.width =
                (progress.current * Consts.MAP_WINDOW_WIDTH / progress.total) + "px";

            (wwa_util.$id("progress-disp")).textContent =
                ((progress.current / progress.total * 100).toFixed(2)) + "%";
        }
    }


    public createAudioJSInstance(idx: number, isSub: boolean = false): void {
        if (idx === 0 || this._audioJSInstances[idx] !== void 0 || idx === wwa_data.SystemSound.NO_SOUND) {
            return;
        }
        var file = (wwap_mode ? Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_AUDIO_DIR + "/" + idx + ".mp3" : this._audioDirectory + idx + ".mp3");
        var audioElement = new Audio(file);
        audioElement.preload = "auto";
        if (idx >= wwa_data.SystemSound.BGM_LB) {
            audioElement.loop = true;
        }
        util.$id("wwa-audio-wrapper").appendChild(audioElement);
        this._audioJSInstances[idx] = audiojs.create(audioElement);
        if (idx < wwa_data.SystemSound.BGM_LB) {
            var audioElementSub = new Audio(file);
            audioElementSub.preload = "auto";
            util.$id("wwa-audio-wrapper").appendChild(audioElementSub);
            this._audioJSInstancesSub[idx] = audiojs.create(audioElementSub);
        }
    }

    public loadSound(): void {
        this._audioJSInstances = new Array(Consts.SOUND_MAX + 1);
        this._audioJSInstancesSub = new Array(Consts.SOUND_MAX + 1);

        this.createAudioJSInstance(wwa_data.SystemSound.DECISION);
        this.createAudioJSInstance(wwa_data.SystemSound.ATTACK);

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
        this._keyStore.update();
        if (this._keyStore.getKeyState(wwa_input.KeyCode.KEY_SPACE) === wwa_input.KeyState.KEYDOWN) {
            this._soundLoadSkipFlag = true;
        }
        for (var i = 1; i <= Consts.SOUND_MAX; i++) {
            if (this._audioJSInstances[i] === void 0) {
                continue;
            }
            if (this._audioJSInstances[i].wrapper.classList.contains("error")) {
                continue;
            }
            total++;
            if (this._audioJSInstances[i].wrapper.classList.contains("loading")) {
                continue;
            }
            loadedNum++;
        }
        if (loadedNum < total && !this._soundLoadSkipFlag) {
            this._setProgressBar(getProgress(loadedNum, total, wwa_data.LoadStage.AUDIO));
            setTimeout(this.soundCheckCaller, Consts.DEFAULT_FRAME_INTERVAL, this);
            return;
        }

        this._setProgressBar(getProgress(Consts.SOUND_MAX, Consts.SOUND_MAX, wwa_data.LoadStage.AUDIO));
        this.openGameWindow();
    }


    public playSound(id: number): void {
        if (!this._isLoadedSound) {
            return;
        }


        if (id < 0 || id > Consts.SOUND_MAX) {
            throw new Error("サウンド番号が範囲外です。");
        }
        if (id >= wwa_data.SystemSound.BGM_LB && this._wwaData.bgm === id) {
            return;
        }

        if ((id === wwa_data.SystemSound.NO_SOUND || id >= wwa_data.SystemSound.BGM_LB) && this._wwaData.bgm !== 0) {
            if (!this._audioJSInstances[this._wwaData.bgm].wrapper.classList.contains("loading")) {
                this._audioJSInstances[this._wwaData.bgm].pause();
            }
            this._wwaData.bgm = 0;
        }

        if (id === 0 || id === wwa_data.SystemSound.NO_SOUND) {
            return;
        }
        if (this._audioJSInstances[id].wrapper.classList.contains("loading")) {
            if (id >= wwa_data.SystemSound.BGM_LB) {
                var loadi = ((id: number, self: WWA): void => {
                    var timer = setInterval((): void => {
                        if (self._wwaData.bgm === id) {
                            if (!self._audioJSInstances[id].wrapper.classList.contains("loading")) {
                                this._audioJSInstances[id].skipTo(0);
                                this._audioJSInstances[id].play();
                                this._wwaData.bgm = id;
                                clearInterval(timer);
                            }
                        } else {
                            clearInterval(timer);
                            if (self._wwaData.bgm !== wwa_data.SystemSound.NO_SOUND) {
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

        if (id !== 0 && !this._audioJSInstances[id].wrapper.classList.contains("error")) {
            if (id >= wwa_data.SystemSound.BGM_LB) {
                this._audioJSInstances[id].skipTo(0);
                this._audioJSInstances[id].play();
                this._wwaData.bgm = id;
            } else if (this._nextSoundIsSub) {
                this._audioJSInstancesSub[id].skipTo(0);
                this._audioJSInstancesSub[id].play();
                this._nextSoundIsSub = false;
            } else {
                this._audioJSInstances[id].skipTo(0);
                this._audioJSInstances[id].play();
                this._nextSoundIsSub = true;
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
       setTimeout で関数を呼んだ時, this が window になることを防ぐため!
    */
    public mainCaller(self: WWA): void {
        self._main();
    }
    public soundCheckCaller(self: WWA): void {
        self.checkAllSoundLoaded();
    }

    public onselectitem(itemPos: number): void {
        if (this._player.canUseItem(itemPos)) {
            var bg = <HTMLDivElement>(wwa_util.$id("item" + (itemPos - 1)));
            bg.classList.add("onpress");
            this.playSound(wwa_data.SystemSound.DECISION);
            if (this._wwaData.message[wwa_data.SystemMessage1.USE_ITEM] === "BLANK") {
                this._player.readyToUseItem(itemPos);
                var itemID = this._player.useItem();
                var mesID = this.getObjectAttributeById(itemID, Consts.ATR_STRING);
                this.setMessageQueue(
                    this.getMessageById(mesID),
                    false, false, itemID, wwa_data.PartsType.OBJECT,
                    this._player.getPosition().getPartsCoord());
            } else {
                this.setMessageQueue(
                    this._wwaData.message[wwa_data.SystemMessage1.USE_ITEM] === "" ?
                        "このアイテムを使用します。\nよろしいですか?" :
                        this._wwaData.message[wwa_data.SystemMessage1.USE_ITEM], true, true);
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_ITEM_USE;
                this._yesNoUseItemPos = itemPos;
            }
        }
    }

    public onselectbutton(button: wwa_data.SidebarButton, forcePassword: boolean = false): void {
        var bg = <HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[button]));
        this.playSound(wwa_data.SystemSound.DECISION);
        bg.classList.add("onpress");
        if (button === wwa_data.SidebarButton.QUICK_LOAD) {
            if (this._quickSaveData !== void 0 && !forcePassword) {
                this.setMessageQueue("データを読み込みますか？\n→Ｎｏでデータ復帰用パスワードの\n　入力選択ができます。", true, true);
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD;
            } else {
                this.onpasswordloadcalled();
            }
        } else if (button === wwa_data.SidebarButton.QUICK_SAVE) {
            if (!this._wwaData.disableSaveFlag) {
                this.setMessageQueue("データの一時保存をします。\nよろしいですか？\n→Ｎｏでデータ復帰用パスワードの\n　表示選択ができます。", true, true);
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE;
            } else {
                this.setMessageQueue("ここではセーブ機能は\n使用できません。", false, true);
            }
        } else if (button === wwa_data.SidebarButton.RESTART_GAME) {
            this.setMessageQueue("初めからスタートしなおしますか？", true, true);
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_RESTART_GAME;
        } else if (button === wwa_data.SidebarButton.GOTO_WWA) {
            this.setMessageQueue("ＷＷＡの公式サイトを開きますか？", true, true);
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA;
        }
    }
    public onpasswordloadcalled() {
        var bg = <HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD]));
        bg.classList.add("onpress");
        this.setMessageQueue("データ復帰用のパスワードを入力しますか？", true, true);
        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
    }

    public onpasswordsavecalled() {
        var bg = <HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE]));
        bg.classList.add("onpress");
        if (!this._wwaData.disableSaveFlag && !this._wwaData.disablePassSaveFlag) {
            this.setMessageQueue("データ復帰用のパスワードを表示しますか？", true, true);
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_SAVE;
        } else {
            this.setMessageQueue("ここではセーブ機能は\n使用できません。", false, true);
        }
    }

    public onchangespeed(type: wwa_data.SpeedChange) {
        if (this._wwaData.permitGameSpeed) {
            var speedIndex: number;
            if (type === wwa_data.SpeedChange.UP) {
                this._wwaData.gameSpeed = this._player.speedUp();
            } else {
                this._wwaData.gameSpeed = this._player.speedDown();
            }
            this.setMessageQueue(
                "移動速度を【" + wwa_data.speedNameList[this._wwaData.gameSpeed] + "】に切り替えました。\n" +
                (this._wwaData.gameSpeed === Consts.MAX_SPEED_INDEX ? "戦闘も速くなります。\n" : "") +
                "(" + (Consts.MAX_SPEED_INDEX + 1) + "段階中" + (this._wwaData.gameSpeed + 1) + "） 速度を落とすにはIキー, 速度を上げるにはPキーを押してください。", false, true);
        }
        else {
            this.setMessageQueue("現在速度変更は出来ません。", false, true);
        }
    }


    private _main(): void {
        this._temporaryInputDisable = false;
        this._waitTimeInCurrentFrame = Consts.DEFAULT_FRAME_INTERVAL;
        this._stopUpdateByLoadFlag = false;

        // キー情報のアップデート
        this._keyStore.update();
        this._mouseStore.update();

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
        // this.debug = this._keyStore.checkHitKey(KeyCode.KEY_SHIFT);
        //////////////////////////////////////////////////////////
        var prevPosition = this._player.getPosition();

        var pdir = this._player.getDir();


        if (this._player.isControllable()) {

            if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_LEFT) === wwa_input.KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.LEFT) === wwa_input.MouseState.MOUSEDOWN) {
                this._player.controll(wwa_data.Direction.LEFT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_UP) === wwa_input.KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.UP) === wwa_input.MouseState.MOUSEDOWN) {
                this._player.controll(wwa_data.Direction.UP);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_RIGHT) === wwa_input.KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.RIGHT) === wwa_input.MouseState.MOUSEDOWN) {
                this._player.controll(wwa_data.Direction.RIGHT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_DOWN) === wwa_input.KeyState.KEYDOWN ||
                this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.DOWN) === wwa_input.MouseState.MOUSEDOWN) {
                this._player.controll(wwa_data.Direction.DOWN);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(wwa_data.dirToKey[pdir])) {
                this._player.controll(pdir);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.LEFT)) {
                this._player.controll(wwa_data.Direction.LEFT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.UP)) {
                this._player.controll(wwa_data.Direction.UP);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.RIGHT)) {
                this._player.controll(wwa_data.Direction.RIGHT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.DOWN)) {
                this._player.controll(wwa_data.Direction.DOWN);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.LEFT)) {
                this._player.controll(wwa_data.Direction.LEFT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.UP)) {
                this._player.controll(wwa_data.Direction.UP);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.RIGHT)) {
                this._player.controll(wwa_data.Direction.RIGHT);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                this._mouseStore.checkClickMouse(wwa_data.Direction.DOWN)) {
                this._player.controll(wwa_data.Direction.DOWN);
                this._objectMovingDataManager.update();
            } else if (this._keyStore.getKeyState(KeyCode.KEY_1) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(1);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_2) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(2);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_3) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(3);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_Q) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(4);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_W) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(5);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_E) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(6);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_A) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(7);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_S) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(8);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_D) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(9);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_Z) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(10);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_X) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(11);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_C) === wwa_input.KeyState.KEYDOWN) {
                this.onselectitem(12);
            } else if (this._keyStore.getKeyState(KeyCode.KEY_I)) {
                this.onchangespeed(wwa_data.SpeedChange.DOWN);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_P)) {
                this.onchangespeed(wwa_data.SpeedChange.UP);
            } else if (
                this._keyStore.getKeyState(KeyCode.KEY_F1) === wwa_input.KeyState.KEYDOWN ||
                this._keyStore.getKeyState(KeyCode.KEY_M) === wwa_input.KeyState.KEYDOWN) {
                // 戦闘結果予測
                if (this.launchBattleEstimateWindow()) {
                }
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F3)) {
                this.playSound(wwa_data.SystemSound.DECISION);
                this.onselectbutton(wwa_data.SidebarButton.QUICK_LOAD, true);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F4)) {
                this.playSound(wwa_data.SystemSound.DECISION);
                this.onpasswordsavecalled()
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F5)) {
                this.onselectbutton(wwa_data.SidebarButton.QUICK_LOAD);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F6)) {
                this.onselectbutton(wwa_data.SidebarButton.QUICK_SAVE);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F7)) {
                this.onselectbutton(wwa_data.SidebarButton.RESTART_GAME);
            } else if (this._keyStore.checkHitKey(KeyCode.KEY_F8)) {
                this.onselectbutton(wwa_data.SidebarButton.GOTO_WWA);
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

            if (!this._messageWindow.isYesNoChoice()) {
                var enter = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_ENTER);
                var space = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_SPACE);
                var esc = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_ESC);
                if (enter === KeyState.KEYDOWN || enter === KeyState.KEYPRESS_MESSAGECHANGE ||
                    space === KeyState.KEYDOWN || space === KeyState.KEYPRESS_MESSAGECHANGE ||
                    esc === KeyState.KEYDOWN || esc === KeyState.KEYPRESS_MESSAGECHANGE ||
                    this._mouseStore.getMouseState() === MouseState.MOUSEDOWN) {
                    for (var i = 0; i < wwa_data.sidebarButtonCellElementID.length; i++) {
                        var elm = <HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[i]));
                        if (elm.classList.contains("onpress")) {
                            elm.classList.remove("onpress");
                        }
                    }
                    this._setNextMessage();

                }
            } else {
                if (!this._messageWindow.isInputDisable()) {
                    if (this._yesNoJudge === wwa_data.YesNoState.UNSELECTED) {
                        if (
                            this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                            this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN
                        ) {
                            this._yesNoJudge = wwa_data.YesNoState.YES
                        } else if (
                            this._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                            this._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN
                        ) {
                            this._yesNoJudge = wwa_data.YesNoState.NO
                        }
                    }
                    if (this._yesNoJudge === wwa_data.YesNoState.YES) {
                        this.playSound(wwa_data.SystemSound.DECISION);
                        this._yesNoDispCounter = Consts.YESNO_PRESS_DISP_FRAME_NUM;
                        this._messageWindow.setInputDisable();
                        this._messageWindow.update();
                    } else if (this._yesNoJudge === wwa_data.YesNoState.NO) {
                        this.playSound(wwa_data.SystemSound.DECISION);
                        this._yesNoDispCounter = Consts.YESNO_PRESS_DISP_FRAME_NUM;
                        this._messageWindow.setInputDisable();
                        this._messageWindow.update();
                    }
                }
            }
        } else if (this._player.isWatingEstimateWindow()) {
            if (this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                this._keyStore.getKeyState(KeyCode.KEY_SPACE) === KeyState.KEYDOWN) {
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
                this._yesNoJudge !== wwa_data.YesNoState.UNSELECTED &&
                !this._player.isWaitingMoveMacro() &&
                !this._player.isFighting()) {
                this._execChoiceWindowRunningEvent();
            }
        }

        if (this._passwordLoadExecInNextFrame) {
            this._stopUpdateByLoadFlag = true;
            this._loadType = wwa_data.LoadType.PASSWORD;
            this._player.clearPasswordWindowWaiting();
            this._passwordLoadExecInNextFrame = false;
        }

        // draw

        this._drawAll();

        this._mainCallCounter++;
        this._mainCallCounter %= 1000000000; // オーバーフローで指数になるやつ対策
        this._animationCounter = (this._animationCounter + 1) % (Consts.ANIMATION_REP_HALF_FRAME * 2);
        if (this._camera.isResetting()) {
            this._camera.advanceTransitionStepNum();
        }

        if (!this._player.isWaitingMessage()) {
            this._player.decrementLookingAroundTimer();
            if (this._statusPressCounter.energy > 0 && --this._statusPressCounter.energy === 0) {
                wwa_util.$id("disp-energy").classList.remove("onpress");
            }
            if (this._statusPressCounter.strength > 0 && --this._statusPressCounter.strength === 0) {
                wwa_util.$id("disp-strength").classList.remove("onpress");
            }
            if (this._statusPressCounter.defence > 0 && --this._statusPressCounter.defence === 0) {
                wwa_util.$id("disp-defence").classList.remove("onpress");
            }
            if (this._statusPressCounter.gold > 0 && --this._statusPressCounter.gold === 0) {
                wwa_util.$id("disp-gold").classList.remove("onpress");
            }
        }
        if (this._player.isWaitingMoveMacro()) {
            this._player.decrementMoveObjectAutoExecTimer();
        }
        if (!this._stopUpdateByLoadFlag) {
            setTimeout(this.mainCaller, this._waitTimeInCurrentFrame, this);
        } else {
            this._fadeout((): void => {
                if (this._loadType === wwa_data.LoadType.QUICK_LOAD) {
                    this._quickLoad();
                } else if (this._loadType === wwa_data.LoadType.RESTART_GAME) {
                    this._restartGame();
                } else if (this._loadType === wwa_data.LoadType.PASSWORD) {
                    this._applyQuickLoad(this._passwordSaveExtractData);
                    this._passwordSaveExtractData = void 0;
                }
                setTimeout(this.mainCaller, this._waitTimeInCurrentFrame, this)
            });
        }
        if (this._dumpElement !== null) {
            for (var i = 0; i < Consts.USER_VAR_NUM; i++) {
                this._dumpElement.querySelector(".var" + i.toString(10)).textContent = this._wwaData.userVar[i] + "";
            }
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
                    var elm = wwa_util.$id("wwa-fader");
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

        for (var x: number = xLeft; x <= xRight; x++) {
            for (var y: number = yTop; y <= yBottom; y++) {
                var partsID: number = this._wwaData.map[y][x];
                var ppx = this._wwaData.mapAttribute[partsID][Consts.ATR_X] / Consts.CHIP_SIZE;
                var ppy = this._wwaData.mapAttribute[partsID][Consts.ATR_Y] / Consts.CHIP_SIZE;
                var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) - cpOffset.x;
                var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) - cpOffset.y;
                if (isPrevCamera) {
                    this._cgManager.drawCanvasWithLowerYLimit(ppx, ppy, canvasX, canvasY, yLimit);
                } else {
                    this._cgManager.drawCanvasWithUpperYLimit(ppx, ppy, canvasX, canvasY, yLimit);
                }
            }
        }
    }

    // プレイヤー描画
    private _drawPlayer(cpParts: Coord, cpOffset: Coord, yLimit: number, isPrevCamera: boolean = false): void {
        if (cpParts === void 0 || this._wwaData.delPlayerFlag) {
            return;
        }
        var pos: Coord = this._player.getPosition().getPartsCoord();
        var poso: Coord = this._player.getPosition().getOffsetCoord();
        var relpcrop: number = wwa_data.dirToPos[this._player.getDir()];
        var canvasX = (pos.x - cpParts.x) * Consts.CHIP_SIZE + poso.x - cpOffset.x;
        var canvasY = (pos.y - cpParts.y) * Consts.CHIP_SIZE + poso.y - cpOffset.y;
        var dx = Math.abs(poso.x);
        var dy = Math.abs(poso.y);
        var dir = this._player.getDir();
        var crop: number;
        var dirChanger = [2, 3, 4, 5, 0, 1, 6, 7];

        if (this._player.isLookingAround() && !this._player.isWaitingMessage()) {
            crop = this._wwaData.playerImgPosX + dirChanger[Math.floor(this._mainCallCounter % 64 / 8)];
            // 基準マスから半マス以上踏み出している場合は右の画像パーツで描画
        } else if (
            (dir === wwa_data.Direction.LEFT || dir === wwa_data.Direction.RIGHT) &&
            Math.abs(poso.x) > Math.floor(Consts.CHIP_SIZE / 2) ||
            (dir === wwa_data.Direction.UP || dir === wwa_data.Direction.DOWN) &&
            Math.abs(poso.y) > Math.floor(Consts.CHIP_SIZE / 2)
        ) {
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
                    new wwa_data.Coord(x, y).equals(this._monster.position)) {
                    continue;
                }
                var partsIDObj: number = this._wwaData.mapObject[y][x];
                offset = new Coord(0, 0);
                if (this._wwaData.objectAttribute[partsIDObj][Consts.ATR_MOVE] !== wwa_data.MoveType.STATIC) {
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
        if (this._wwaData.effectCoords.length === 0) {
            return;
        }
        var i = Math.floor(this._mainCallCounter % (this._wwaData.effectCoords.length * this._wwaData.effectWaits) / this._wwaData.effectWaits);
        for (var y = 0; y < Consts.V_PARTS_NUM_IN_WINDOW; y++) {
            for (var x = 0; x < Consts.H_PARTS_NUM_IN_WINDOW; x++) {
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
        // 左上端
        this._cgManager.drawCanvas(this._frameCoord.x, this._frameCoord.y, 0, 0, false);
        // 右上端
        this._cgManager.drawCanvas(this._frameCoord.x + 2, this._frameCoord.y, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, 0, false);
        // 左下端
        this._cgManager.drawCanvas(this._frameCoord.x, this._frameCoord.y + 2, 0, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE, false);
        // 右下端
        this._cgManager.drawCanvas(this._frameCoord.x + 2, this._frameCoord.y + 2, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE, false);

        for (var i = 1; i < Consts.H_PARTS_NUM_IN_WINDOW - 1; i++) {
            // 上
            this._cgManager.drawCanvas(this._frameCoord.x + 1, this._frameCoord.y, Consts.CHIP_SIZE * i, 0, false);
            // 下
            this._cgManager.drawCanvas(this._frameCoord.x + 1, this._frameCoord.y + 2, Consts.CHIP_SIZE * i, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE, false);
        }
        for (var i = 1; i < Consts.V_PARTS_NUM_IN_WINDOW - 1; i++) {
            // 左
            this._cgManager.drawCanvas(this._frameCoord.x, this._frameCoord.y + 1, 0, Consts.CHIP_SIZE * i, false);
            // 右
            this._cgManager.drawCanvas(this._frameCoord.x + 2, this._frameCoord.y + 1, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, Consts.CHIP_SIZE * i, false);
        }

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
            if (this._player.getLastExecPartsIDOnSamePosition(wwa_data.PartsType.MAP) === partsID) {
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
            this._player.setLastExecInfoOnSamePosition(wwa_data.PartsType.MAP, partsID);
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
            if (this._player.getLastExecPartsIDOnSamePosition(wwa_data.PartsType.OBJECT) === partsID) {
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
            this._player.setLastExecInfoOnSamePosition(wwa_data.PartsType.OBJECT, partsID);
        }

    }

    private _execMapStreetEvent(pos: Coord, partsID: number, mapAttr: number): boolean {
        var itemID = this._wwaData.mapAttribute[partsID][Consts.ATR_ITEM];
        if (itemID !== 0 && !this._player.hasItem(itemID)) {
            return false;
        }

        this.appearParts(pos, wwa_data.AppearanceTriggerType.MAP);
        var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        // 待ち時間
        this._waitTimeInCurrentFrame += this._wwaData.mapAttribute[partsID][Consts.ATR_NUMBER] * 100;
        this._temporaryInputDisable = true;
        var messageDisplayed = this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.MAP, pos.clone());
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

            this.appearParts(pos, wwa_data.AppearanceTriggerType.MAP);
            var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
            var message = this._wwaData.message[messageID];

            this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.MAP, pos.clone());
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
        this.appearParts(pos, wwa_data.AppearanceTriggerType.MAP);
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
        if (this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "BLANK") {
            location.href = wwa_util.$escapedURI(this._wwaData.message[messageID].split(/\s/g)[0])
            return;
        }
        this.setMessageQueue(
            this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "" ?
                "他のページにリンクします。\nよろしいですか？" :
                this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK], true, true);
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_MAP_PARTS;
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
            this._wwaData.mapObject[pos.y][pos.x] = 0;
        }
        // 試験的に踏み潰し判定と処理の順序を入れ替えています。不具合があるようなら戻します。 150415
        this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.OBJECT, pos);
        // 待ち時間
        this._waitTimeInCurrentFrame += this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER] * 100;
        this._temporaryInputDisable = true;
        this.appearParts(pos, wwa_data.AppearanceTriggerType.OBJECT, partsID);

        this.playSound(soundID);
    }

    private _execObjectStatusEvent(pos: Coord, partsID: number, objAttr: number): void {
        var status = new wwa_data.Status(
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

            this._wwaData.mapObject[pos.y][pos.x] = 0;

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

        this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());


        this._wwaData.mapObject[pos.y][pos.x] = 0;
        this.appearParts(pos, wwa_data.AppearanceTriggerType.OBJECT, partsID);
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectMonsterEvent(pos: Coord, partsID: number, objAttr: number): void {
        var monsterImgCoord = new wwa_data.Coord(
            this._wwaData.objectAttribute[partsID][Consts.ATR_X],
            this._wwaData.objectAttribute[partsID][Consts.ATR_Y]);

        var monsterStatus = new wwa_data.Status(
            this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY],
            this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH],
            this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE],
            this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]);

        var monsterMessage = this._wwaData.message[
            this._wwaData.objectAttribute[partsID][Consts.ATR_STRING]];

        var monsterItemID = this._wwaData.objectAttribute[partsID][Consts.ATR_ITEM];

        this._monster = new wwa_monster.Monster(
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
            this._wwaData.mapObject[pos.y][pos.x] = 0;
        }
        // 試験的に(ry
        this.setMessageQueue(message, true, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectSellEvent(pos: Coord, partsID, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var playerPos = this._player.getPosition().getPartsCoord();

        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            this._wwaData.mapObject[pos.y][pos.x] = 0;
        }
        // 試験的に(ry
        this.setMessageQueue(message, true, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectItemEvent(pos: Coord, partsID: number, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        try {
            this._player.addItem(partsID, this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER]);
            this._wwaData.mapObject[pos.y][pos.x] = 0;
            if (this._wwaData.objectAttribute[partsID][Consts.ATR_MODE] !== 0) {
                // 使用型アイテム の場合は、処理は使用時です。
            } else {
                this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());
                this.appearParts(pos, wwa_data.AppearanceTriggerType.OBJECT, partsID);
            }
        } catch (e) {
            // これ以上、アイテムを持てません
            if (this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM] !== "BLANK") {
                this.setMessageQueue(
                    this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM] === "" ?
                        "これ以上、アイテムを持てません。" :
                        this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM], false, true);
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
            this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());
            this._wwaData.mapObject[pos.y][pos.x] = 0;
            this.appearParts(pos, wwa_data.AppearanceTriggerType.OBJECT, partsID);
            this._paintSkipByDoorOpen = true;
        }

    }

    private _execObjectYesNoChoiceEvent(pos: Coord, partsID: number, objAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var message = this._wwaData.message[messageID];
        var playerPos = this._player.getPosition().getPartsCoord();

        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            this._wwaData.mapObject[pos.y][pos.x] = 0;
        }
        // 試験(ry
        this.setMessageQueue(message, true, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS;

        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
    }

    private _execObjectLocalGateEvent(pos: Coord, partsID: number, mapAttr: number): void {
        var playerPos = this._player.getPosition().getPartsCoord();
        // プレイヤー座標と同一なら削除（踏み潰し判定）
        if (pos.x === playerPos.x && pos.y === playerPos.y && !this._wwaData.objectNoCollapseDefaultFlag) {
            this._wwaData.mapObject[pos.y][pos.x] = 0;
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
        this.appearParts(pos, wwa_data.AppearanceTriggerType.OBJECT, partsID);
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
        if (this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "BLANK") {
            location.href = wwa_util.$escapedURI(this._wwaData.message[messageID].split(/\s/g)[0]);
            return;
        }
        this.setMessageQueue(
            this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "" ?
                "他のページにリンクします。\nよろしいですか？" :
                this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK], true, true);
        this._yesNoChoicePartsCoord = pos;
        this._yesNoChoicePartsID = partsID;
        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
        this._yesNoURL = this._wwaData.message[messageID].split(/\s/g)[0];
    }

    private _execObjectScoreEvent(pos: Coord, partsID: number, mapAttr: number): void {
        var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
        var playerPos = this._player.getPosition().getPartsCoord();
        var playerStatus = this._player.getStatus();
        var score = 0;
        score += this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY] * playerStatus.energy;
        score += this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH] * playerStatus.strength;
        score += this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE] * playerStatus.defence;
        score += this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD] * playerStatus.gold;
        this._scoreWindow.update(score);
        this._scoreWindow.show();
        this.setMessageQueue(messageID === 0 ? "スコアを表示します。" : this._wwaData.message[messageID], false, false);
        this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);

    }

    private _execChoiceWindowRunningEvent() {
        var partsType: number;
        var gold: number;
        if (--this._yesNoDispCounter === 0) {
            if (this._yesNoJudge === wwa_data.YesNoState.YES) {
                if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_MAP_PARTS) {
                    partsType = this._wwaData.mapAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.MAP_URLGATE) {
                        location.href = wwa_util.$escapedURI(this._yesNoURL);
                    }
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS) {
                    partsType = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.OBJECT_BUY) {
                        if (this._player.hasItem(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM])) {
                            this._player.removeItemByPartsID(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM]);
                            gold = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD];
                            this._player.earnGold(gold);
                            this.setStatusChangedEffect(new wwa_data.Status(0, 0, 0, gold));
                            this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                        } else {
                            // アイテムを持っていない
                            if (this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM] !== "BLANK") {
                                this._messageQueue.push(new wwa_message.MessageInfo(
                                    this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM] === "" ?
                                        "アイテムをもっていない。" : this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM],
                                    true)
                                );
                            };
                        }
                    } else if (partsType === Consts.OBJECT_SELL) {
                        if (this._player.hasGold(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD])) {
                            if (this._player.canHaveMoreItems() || this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM] === 0) {
                                if (this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM] !== 0) {
                                    this._player.addItem(
                                        this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM]);
                                }
                                var status = new wwa_data.Status(
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
                                this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                            } else {
                                // アイテムをボックスがいっぱい
                                if (this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM] !== "BLANK") {
                                    this._messageQueue.push(
                                        new wwa_message.MessageInfo(
                                            this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM] === "" ?
                                                "これ以上、アイテムを持てません。" : this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM],
                                            true
                                        )
                                    );
                                }
                            }
                        } else {
                            // 所持金が足りない
                            if (this._wwaData.message[wwa_data.SystemMessage1.NO_MONEY] !== "BLANK") {
                                this._messageQueue.push(
                                    new wwa_message.MessageInfo(
                                        this._wwaData.message[wwa_data.SystemMessage1.NO_MONEY] === "" ?
                                            "所持金が足りない。" : this._wwaData.message[wwa_data.SystemMessage1.NO_MONEY],
                                        true
                                    )
                                );
                            }
                        }

                    } else if (partsType === Consts.OBJECT_SELECT) {
                        this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.CHOICE_YES, this._yesNoChoicePartsID);
                    } else if (partsType === Consts.OBJECT_URLGATE) {
                        location.href = wwa_util.$escapedURI(this._yesNoURL);
                    }
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_ITEM_USE) {
                    this._player.readyToUseItem(this._yesNoUseItemPos);
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    this._stopUpdateByLoadFlag = true;
                    this._loadType = wwa_data.LoadType.QUICK_LOAD;
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._quickSave();
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_RESTART_GAME) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.RESTART_GAME]))).classList.remove("onpress");
                    this._stopUpdateByLoadFlag = true;
                    this._loadType = wwa_data.LoadType.RESTART_GAME;
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA) {
                    location.href = wwa_util.$escapedURI(Consts.WWA_HOME);
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_LOAD) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    this._player.setPasswordWindowWating();
                    this._passwordWindow.show(wwa_password_window.Mode.LOAD);
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_SAVE) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._player.setPasswordWindowWating();
                    this._passwordWindow.password = this._quickSave(true);
                    this._passwordWindow.show(wwa_password_window.Mode.SAVE);
                }
                this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                this._setNextMessage();

                this._yesNoChoicePartsCoord = void 0;
                this._yesNoChoicePartsID = void 0;
                this._yesNoUseItemPos = void 0;
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.NONE;
                this._messageWindow.setYesNoChoice(false);

            } else if (this._yesNoJudge === wwa_data.YesNoState.NO) {

                if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_MAP_PARTS) {
                    partsType = this._wwaData.mapAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.MAP_URLGATE) {

                    }
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS) {
                    partsType = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                    if (partsType === Consts.OBJECT_BUY) {

                    } else if (partsType === Consts.OBJECT_SELL) {

                    } else if (partsType === Consts.OBJECT_SELECT) {
                        this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.CHOICE_NO, this._yesNoChoicePartsID);
                    } else if (partsType === Consts.OBJECT_URLGATE) {

                    }
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_ITEM_USE) {
                    var bg = <HTMLDivElement>(wwa_util.$id("item" + (this._yesNoUseItemPos - 1)));
                    bg.classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD) {
                    //                        (<HTMLDivElement> (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                    this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                    this.onpasswordloadcalled();
                    return;
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                    //                        (<HTMLDivElement> (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                    this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                    this.onpasswordsavecalled();
                    return;
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_RESTART_GAME) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.RESTART_GAME]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_LOAD) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD]))).classList.remove("onpress");
                } else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_SAVE) {
                    (<HTMLDivElement>(wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE]))).classList.remove("onpress");
                }

                this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                this._setNextMessage();
                this._yesNoChoicePartsCoord = void 0;
                this._yesNoChoicePartsID = void 0;
                this._yesNoUseItemPos = void 0;
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.NONE;
                this._messageWindow.setYesNoChoice(false);
            }
        }
    }

    public setMessageQueue(
        message: string,
        showChoice: boolean,
        isSystemMessage: boolean,
        partsID: number = 0,
        partsType: wwa_data.PartsType = wwa_data.PartsType.OBJECT,
        partsPosition: wwa_data.Coord = new Coord(0, 0),
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
    /*
            // 廃止
            public enqueueMessage(
                message: string,
                partsID: number = 0,
                partsType: wwa_data.PartsType = wwa_data.PartsType.OBJECT,
                partsPosition: wwa_data.Coord = new Coord(0, 0)
                ): void {
                var messageMain = message.split(/\<c\>/i)[0].replace(/\<p\>\n/ig, "<P>");
                var messages = messageMain.split(/\<p\>/ig).filter((s) => { return s !== ""; })
                this._messageQueue = this._messageQueue.concat(
                    wwa_message.strArrayToMessageInfoArray( messages ) );
            }
        */


    public getMessageQueueByRawMessage(
        message: string,
        partsID: number,
        partsType: wwa_data.PartsType,
        partsPosition: wwa_data.Coord,
        isSystemMessage: boolean = false): wwa_message.MessageInfo[] {

        // コメント削除
        var messageMain = message
            .split(/\n\<c\>/i)[0]
            .split(/\<c\>/i)[0]
            .replace(/\n\<p\>\n/ig, "<P>")
            .replace(/\n\<p\>/ig, "<P>")
            .replace(/\<p\>\n/ig, "<P>")
            .replace(/\<p\>/ig, "<P>");

        var messageQueue: wwa_message.MessageInfo[] = [];
        if (messageMain !== "") {
            var rawQueue = messageMain.split(/\<p\>/ig);
            for (var j = 0; j < rawQueue.length; j++) {
                var lines = rawQueue[j].split("\n");
                var linesWithoutMacro: string[] = [];
                var macroQueue: wwa_message.Macro[] = [];
                for (var i = 0; i < lines.length; i++) {
                    var matchInfo = lines[i].match(/(\$(?:[a-zA-Z_][a-zA-Z0-9_]*)\=(?:.*))/);
                    if (matchInfo !== null && matchInfo.length >= 2) {
                        var macro = wwa_message.parseMacro(this, partsID, partsType, partsPosition, matchInfo[1]);
                        // マクロのエンキュー (最も左のものを対象とする。)
                        // それ以外のメッセージ、マクロは一切エンキューしない。(原作どおり)
                        // なので、「あああ$map=1,1,1」の「あああ」は表示されず、map文だけが処理される。
                        macroQueue.push(macro);

                        // 行頭コメントはpushしない
                    } else if (!lines[i].match(/^\$/)) {
                        linesWithoutMacro.push(lines[i]);
                    }
                }
                messageQueue.push(new wwa_message.MessageInfo(linesWithoutMacro.join("\n"), isSystemMessage, j === rawQueue.length - 1, macroQueue));
            }
        }
        return messageQueue;
    }

    public appearParts(pos: Coord, triggerType: wwa_data.AppearanceTriggerType, triggerPartsID: number = 0): void {
        var triggerPartsType: wwa_data.PartsType;
        var rangeMin: number = (triggerType === wwa_data.AppearanceTriggerType.CHOICE_NO) ?
            Consts.APPERANCE_PARTS_MIN_INDEX_NO : Consts.APPERANCE_PARTS_MIN_INDEX;
        var rangeMax: number = (triggerType === wwa_data.AppearanceTriggerType.CHOICE_YES) ?
            Consts.APPERANCE_PARTS_MAX_INDEX_YES : Consts.APPERANCE_PARTS_MAX_INDEX;
        var targetPartsID: number;
        var targetPartsType: wwa_data.PartsType;
        var targetX: number;
        var targetY: number;
        var targetPos: Position;
        var i: number;

        if (triggerType === wwa_data.AppearanceTriggerType.MAP) {
            triggerPartsID = (triggerPartsID === 0) ? this._wwaData.map[pos.y][pos.x] : triggerPartsID;
            triggerPartsType = wwa_data.PartsType.MAP;
        } else {
            triggerPartsID = (triggerPartsID === 0) ? this._wwaData.mapObject[pos.y][pos.x] : triggerPartsID;
            triggerPartsType = wwa_data.PartsType.OBJECT;
        }

        for (i = rangeMin; i <= rangeMax; i++) {
            var base = Consts.ATR_APPERANCE_BASE + i * Consts.REL_ATR_APPERANCE_UNIT_LENGTH;
            var idxID = base + Consts.REL_ATR_APPERANCE_ID;
            var idxX = base + Consts.REL_ATR_APPERANCE_X;
            var idxY = base + Consts.REL_ATR_APPERANCE_Y;
            var idxType = base + Consts.REL_ATR_APPERANCE_TYPE;

            targetPartsID = (triggerPartsType === wwa_data.PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxID] :
                this._wwaData.objectAttribute[triggerPartsID][idxID];
            targetPartsType = (triggerPartsType === wwa_data.PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxType] :
                this._wwaData.objectAttribute[triggerPartsID][idxType];
            targetX = (triggerPartsType === wwa_data.PartsType.MAP) ?
                this._wwaData.mapAttribute[triggerPartsID][idxX] :
                this._wwaData.objectAttribute[triggerPartsID][idxX];
            targetY = (triggerPartsType === wwa_data.PartsType.MAP) ?
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
                targetPos = new wwa_data.Position(this, targetX, targetY, 0, 0);
                if (targetPartsType === wwa_data.PartsType.MAP) {
                    if (targetPartsID >= this._wwaData.mapPartsMax) {
                        throw new Error("背景パーツの範囲外IDが指定されました");
                    }
                    this._wwaData.map[targetY][targetX] = targetPartsID;
                } else {
                    if (targetPartsID >= this._wwaData.objPartsMax) {
                        throw new Error("物体パーツの範囲外IDが指定されました");
                    }
                    this._wwaData.mapObject[targetY][targetX] = targetPartsID;
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
        targetPartsType: wwa_data.PartsType
    ): void {
        var ppos = this._player.getPosition().getPartsCoord();
        var pdir = this._player.getDir();
        var signX = wwa_data.vx[pdir];
        var signY = wwa_data.vy[pdir];

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
        targetPartsType: wwa_data.PartsType
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
            var targetPos = new wwa_data.Position(this, targetX, targetY, 0, 0); // 範囲外は止める用
            if (targetPartsType === wwa_data.PartsType.MAP) {
                if (targetPartsID >= this._wwaData.mapPartsMax) {
                    throw new Error("背景パーツの範囲外IDが指定されました");
                }
                this._wwaData.map[targetY][targetX] = targetPartsID;
            } else {
                if (targetPartsID >= this._wwaData.objPartsMax) {
                    throw new Error("物体パーツの範囲外IDが指定されました");
                }
                this._wwaData.mapObject[targetY][targetX] = targetPartsID;
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
        this._wwaData.mapObject[pos.y][pos.x] = newId;
    }

    private _replaceRandomObjectsInScreen(): void {
        var camPos = this._camera.getPosition().getPartsCoord();
        var xLeft = Math.max(0, camPos.x - 1);
        var xRight = Math.min(this._wwaData.mapWidth - 1, camPos.x + Consts.H_PARTS_NUM_IN_WINDOW);
        var yTop = Math.max(0, camPos.y - 1);
        var yBottom = Math.min(this._wwaData.mapWidth - 1, camPos.y + Consts.V_PARTS_NUM_IN_WINDOW);
        for (var x = xLeft; x <= xRight; x++) {
            for (var y = yTop; y <= yBottom; y++) {
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
            this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
            this._messageQueue = []; // force clear!!
            this._messageWindow.hide();
            this._yesNoChoicePartsCoord = void 0;
            this._yesNoChoicePartsID = void 0;
            this._yesNoUseItemPos = void 0;
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.NONE;
            this._messageWindow.setYesNoChoice(false);
        }

        this._waitTimeInCurrentFrame = Consts.GAMEOVER_FRAME_INTERVAL;
        this._temporaryInputDisable = true;
        this._player.jumpTo(new Position(this, jx, jy, 0, 0));
    }

    public setYesNoInput(yesNo: wwa_data.YesNoState): void {
        this._yesNoJudgeInNextFrame = yesNo;
    }

    public getYesNoState(): wwa_data.YesNoState {
        if (this._yesNoJudgeInNextFrame !== void 0) {
            return this._yesNoJudgeInNextFrame;
        }
        return this._yesNoJudge;
    }

    public setStatusChangedEffect(additionalStatus: wwa_data.EquipmentStatus) {


        if (additionalStatus.strength !== 0) {
            wwa_util.$id("disp-strength").classList.add("onpress");
            this._statusPressCounter.strength = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
        }
        if (additionalStatus.defence !== 0) {
            wwa_util.$id("disp-defence").classList.add("onpress");
            this._statusPressCounter.defence = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
        }

        if (additionalStatus instanceof wwa_data.Status) {
            if ((<wwa_data.Status>additionalStatus).energy !== 0) {
                wwa_util.$id("disp-energy").classList.add("onpress");
                this._statusPressCounter.energy = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
            }
            if ((<wwa_data.Status>additionalStatus).gold !== 0) {
                wwa_util.$id("disp-gold").classList.add("onpress");
                this._statusPressCounter.gold = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
            }
        }
    }

    public setPartsOnPosition(partsType: wwa_data.PartsType, id: number, pos: wwa_data.Coord) {
        if (partsType === wwa_data.PartsType.MAP) {
            if (id >= this._wwaData.mapPartsMax) {
                this._wwaData.map[pos.y][pos.x] = 0;
            }
            this._wwaData.map[pos.y][pos.x] = id;
        } else {
            if (id >= this._wwaData.objPartsMax) {
                this._wwaData.mapObject[pos.y][pos.x] = 0;
            }
            this._wwaData.mapObject[pos.y][pos.x] = id;
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

    private _generateMapDataHash(data: wwa_data.WWAData): string {
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

    private _generateSaveDataHash(data: wwa_data.WWAData): string {
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
            text += wwa_util.arr2str4save(data[keyArray[i]]);
        }

        return CryptoJS.MD5(text).toString();
    }

    private _quickSave(isPassword: boolean = false): string {
        var qd = <wwa_data.WWAData>JSON.parse(JSON.stringify(this._wwaData));
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

    private _decodePassword(pass: string): wwa_data.WWAData {
        var ori = this._generateMapDataHash(this._restartData);
        try {
            var json = CryptoJS.AES.decrypt(
                pass,
                "^ /" + (this._wwaData.worldPassNumber * 231 + 8310 + ori) + "P+>A[]"
            ).toString(CryptoJS.enc.Utf8);
        } catch (e) {
            throw new Error("データが破損しています。\n" + e.message)
        }
        var obj: wwa_data.WWAData;
        try {
            obj = JSON.parse(json);
        } catch (e) {
            throw new Error("マップデータ以外のものが暗号化されたか、マップデータに何かが不足しているようです。\nJSON PARSE FAILED");
        }
        return obj;
    }

    private _quickLoad(restart: boolean = false, password: string = null, apply: boolean = true): wwa_data.WWAData {
        if (!restart && this._quickSaveData === void 0 && password === null) {
            throw new Error("セーブデータがありません。");
        }
        var newData: wwa_data.WWAData;
        if (password !== null) {
            newData = this._decodePassword(password);
        } else {
            newData = <wwa_data.WWAData>JSON.parse(JSON.stringify(restart ? this._restartData : this._quickSaveData));
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
        /* WWAWingXE */
        this.setPlayerSpeed(newData.gameSpeed + 1);
        /* WWAWingXE */
        return newData;
    }

    private _applyQuickLoad(newData: wwa_data.WWAData): void {
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

        this._player.systemJumpTo(new wwa_data.Position(this, newData.playerX, newData.playerY, 0, 0));
        if (newData.bgm === 0) {
            this.playSound(wwa_data.SystemSound.NO_SOUND);
        } else {
            this.playSound(newData.bgm);
        }
        this.setImgClick(new Coord(newData.imgClickX, newData.imgClickY));
        if (this.getObjectIdByPosition(this._player.getPosition()) !== 0) {
            this._player.setPartsAppearedFlag();
        }
        this._wwaData = newData;
        this._replaceAllRandomObjects();
        this.updateCSSRule();
    }

    private _restartGame(): void {
        this._quickLoad(true);
    }

    private _fadeout(callback: () => void): void {
        var borderWidth = 0;
        var size = Consts.MAP_WINDOW_WIDTH;
        var v = Consts.FADEOUT_SPEED; // borderの一本が増える速さ
        var elm = wwa_util.$id("wwa-fader");
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

                //                    if (this._wwaData.objectAttribute[objID][Consts.ATR_MOVE] === wwa_data.MoveType.STATIC) {
                objectsInNextFrame[localY + 1][localX + 1] = this._wwaData.mapObject[posc.y][posc.x];
                this.hoge[localY + 1][localX + 1] = -this._wwaData.mapObject[posc.y][posc.x];
                //                    } else {
                //                        objectsInNextFrame[localY + 1][localX + 1] = 0;
                //                        this.hoge[localY + 1][localX + 1] = 0;
                //                    }
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
                    this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] === wwa_data.MoveType.STATIC ||
                    this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_LOCALGATE ||
                    this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_RANDOM
                ) {
                    continue;
                }
                var moveMode = this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE];
                if (moveMode !== wwa_data.MoveType.HANG_AROUND) {
                    var candCoord = this._getCandidateCoord(playerIsMoving, pos, moveMode);
                    var xCand = new Coord(candCoord.x, posc.y);
                    var yCand = new Coord(posc.x, candCoord.y);
                    var thirdCand: wwa_data.Coord = null;
                    var randomCand: wwa_data.Coord;
                    if (this._objectCanMoveTo(playerIsMoving, candCoord, objectsInNextFrame)) {
                        this._setObjectsInNextFrame(posc, candCoord, leftX, topY, objectsInNextFrame, partsID);
                    } else {
                        var mode = this._getSecondCandidateMoveMode(
                            playerIsMoving, posc, candCoord, xCand, yCand,
                            this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_MONSTER,
                            objectsInNextFrame);
                        if (mode === wwa_data.SecondCandidateMoveType.MODE_X) {
                            this._setObjectsInNextFrame(posc, xCand, leftX, topY, objectsInNextFrame, partsID);
                        } else if (mode === wwa_data.SecondCandidateMoveType.MODE_Y) {
                            this._setObjectsInNextFrame(posc, yCand, leftX, topY, objectsInNextFrame, partsID);
                        } else {
                            thirdCand = this._getThirdCandidate(playerIsMoving, pos, candCoord, moveMode, objectsInNextFrame);
                            if (thirdCand !== null) {
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

    private _getCandidateCoord(playerIsMoving: boolean, currentPos: wwa_data.Position, moveType: wwa_data.MoveType): wwa_data.Coord {
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


        if (moveType === wwa_data.MoveType.CHASE_PLAYER) {
            dx =
                currentCoord.x > playerNextCoord.x ? 1 :
                    currentCoord.x < playerNextCoord.x ? -1 : 0;
            dy =
                currentCoord.y > playerNextCoord.y ? 1 :
                    currentCoord.y < playerNextCoord.y ? -1 : 0;

        } else if (moveType === wwa_data.MoveType.RUN_OUT) {
            dx =
                currentCoord.x > playerNextCoord.x ? -1 :
                    currentCoord.x < playerNextCoord.x ? 1 : 0;
            dy =
                currentCoord.y > playerNextCoord.y ? -1 :
                    currentCoord.y < playerNextCoord.y ? 1 : 0;
        }
        candidateCoord.x -= dx;
        candidateCoord.y -= dy;

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
    ): wwa_data.SecondCandidateMoveType {
        if (
            playerIsMoving && (
                (this._player.getDir() === wwa_data.Direction.UP || this._player.getDir() === wwa_data.Direction.DOWN) && isMonster ||
                (this._player.getDir() === wwa_data.Direction.LEFT || this._player.getDir() === wwa_data.Direction.RIGHT) && !isMonster
            )
        ) {
            // 移動Yモード
            if (this._objectCanMoveTo(playerIsMoving, yCand, objectsInNextFrame)) {
                return wwa_data.SecondCandidateMoveType.MODE_Y;
            }
            if (this._objectCanMoveTo(playerIsMoving, xCand, objectsInNextFrame)) {
                return wwa_data.SecondCandidateMoveType.MODE_X;
            }
            return wwa_data.SecondCandidateMoveType.UNDECIDED;
        }

        // 移動Xモード
        if (this._objectCanMoveTo(playerIsMoving, xCand, objectsInNextFrame)) {
            return wwa_data.SecondCandidateMoveType.MODE_X;
        }
        if (this._objectCanMoveTo(playerIsMoving, yCand, objectsInNextFrame)) {
            return wwa_data.SecondCandidateMoveType.MODE_Y;
        }
        return wwa_data.SecondCandidateMoveType.UNDECIDED;
    }

    private _getThirdCandidate(
        playerIsMoving: boolean,
        currentPos: wwa_data.Position,
        firstCandidate: wwa_data.Coord,
        mode: wwa_data.MoveType,
        objectsInNextFrame: number[][]): wwa_data.Coord {
        var dir =
            mode === wwa_data.MoveType.CHASE_PLAYER ? 1 :
                mode === wwa_data.MoveType.RUN_OUT ? -1 : 0;

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

    private _getRandomMoveCoord(playerIsMoving: boolean, currentPos: wwa_data.Position, objectsInNextFrame: number[][]): wwa_data.Coord {
        var currentCoord = currentPos.getPartsCoord();
        var resultCoord: wwa_data.Coord = currentCoord.clone();
        for (var i = 0; i < Consts.RANDOM_MOVE_ITERATION_NUM; i++) {
            var rand = Math.floor(Math.random() * 8);
            resultCoord.x = currentCoord.x + wwa_data.vx[rand];
            resultCoord.y = currentCoord.y + wwa_data.vy[rand];
            if (this._objectCanMoveTo(playerIsMoving, resultCoord, objectsInNextFrame)) {
                return resultCoord;
            }
        }
        return currentCoord;

    }

    public isPrevFrameEventExecuted(): boolean {
        return this._prevFrameEventExected;
    }



    private _objectCanMoveTo(playerIsMoving: boolean, candCoord: wwa_data.Coord, objectsInNextFrame: number[][]): boolean {
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

    private _setObjectsInNextFrame(currentCoord: wwa_data.Coord, candCoord: wwa_data.Coord, leftX: number, topY: number, objectsInNextFrame: number[][], partsID: number): void {
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
        var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW) - 1;
        var monsterList: number[] = [];
        this.playSound(wwa_data.SystemSound.DECISION);
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
        if (monsterList.length === 0) {
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
    }

    public hidePasswordWindow(isCancel: boolean = false): void {
        this._passwordWindow.hide();
        if (isCancel || this._passwordWindow.mode === wwa_password_window.Mode.SAVE) {
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
        if (this._player.isControllable()) {
            this.setNowPlayTime();
            this.setMessageQueue(
                "【ショートカットキーの一覧】\n" +
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
                "「Ｅｎｔｅｒ、Ｙ」はＹｅｓ,「Ｅｓｃ、Ｎ」はＮｏに対応。\n" +
                " I : 移動速度を落とす／Ｐ: 移動速度を上げる\n" +
                "現在の移動回数：" + this._player.getMoveCount() + "\n" +
                "WWA Wing XE バージョン:" + Consts.VERSION_WWAJS + "\n" +
                "現在のプレイ時間：" + Math.floor(this._wwaData.playTime / 1000) + "秒",
                false, true
            );
        }
    }

    private _setNextMessage(displayCenter: boolean = false): void {
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
                false, false, itemID, wwa_data.PartsType.OBJECT,
                this._player.getPosition().getPartsCoord(), true);
        }

    }


    public replaceParts(
        srcID: number,
        destID: number,
        partsType: wwa_data.PartsType = wwa_data.PartsType.OBJECT,
        onlyThisSight: boolean = false
    ): void {

        var cpParts = this._camera.getPosition().getPartsCoord();
        var xLeft = onlyThisSight ? Math.max(0, cpParts.x) : 0;
        var xRight = onlyThisSight ? Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW - 1) : this._wwaData.mapWidth - 1;
        var yTop = onlyThisSight ? Math.max(0, cpParts.y) : 0;
        var yBottom = onlyThisSight ? Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW) - 1 : this._wwaData.mapWidth - 1;
        for (var x: number = xLeft; x <= xRight; x++) {
            for (var y: number = yTop; y <= yBottom; y++) {
                if (partsType === wwa_data.PartsType.OBJECT) {
                    var pid = this._wwaData.mapObject[y][x];
                    if (pid === srcID) {
                        this._wwaData.mapObject[y][x] = destID;
                    }
                } else {
                    var pid = this._wwaData.map[y][x];
                    if (pid === srcID) {
                        this._wwaData.map[y][x] = destID;
                    }

                }
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
    public disablePassSave(flag: boolean): boolean {
        return this._wwaData.disablePassSaveFlag = flag;
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

    public setPlayerStatus(type: wwa_data.MacroStatusIndex, value: number): void {
        if (type === wwa_data.MacroStatusIndex.ENERGY) {
            this._player.setEnergy(value);
        } else if (type === wwa_data.MacroStatusIndex.STRENGTH) {
            this._player.setStrength(value);
        } else if (type === wwa_data.MacroStatusIndex.DEFENCE) {
            this._player.setDefence(value);
        } else if (type === wwa_data.MacroStatusIndex.GOLD) {
            this._player.setGold(value);
        } else if (type === wwa_data.MacroStatusIndex.MOVES) {
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

    public setWaitTime(time: number): void {
        this._waitTimeInCurrentFrame += time;
        this._temporaryInputDisable = true;
    }


    public setEffect(waits: number, coords: wwa_data.Coord[]): void {
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
            Array.prototype.forEach.call(wwa_util.$qsAll(".item-cell>.item-click-border"), (node: HTMLElement) => {
                node.style.backgroundImage = "url('" + wwa_data.WWAConsts.ITEM_BORDER_IMG_DATA_URL + "')";
                node.style.backgroundPosition = "0 0"
            });
        } else {
            var escapedFilename: string = this._wwaData.mapCGName.replace("(", "\\(").replace(")", "\\)");
            Array.prototype.forEach.call(wwa_util.$qsAll(".item-cell>.item-click-border"), (node: HTMLElement) => {
                node.style.backgroundImage = "url('" + escapedFilename + "')";
                node.style.backgroundPosition = "-" + pos.x * Consts.CHIP_SIZE + "px -" + pos.y * Consts.CHIP_SIZE + "px";
            });

        }
    }

    public addFace(face: wwa_data.Face): void {
        this._faces.push(face);
    }

    public clearFaces(): void {
        this._faces = [];
    }


    private _stylePos: number[]; // w
    private _styleElm: HTMLStyleElement;
    private _sheet: CSSStyleSheet;
    public initCSSRule() {
        this._styleElm = <HTMLStyleElement>wwa_util.$id(Consts.WWA_STYLE_TAG_ID);
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
        if (this._sheet.addRule !== void 0) {
            this._stylePos[wwa_data.SelectorType.MESSAGE_WINDOW] = this._sheet.addRule(
                "div.wwa-message-window, div#wwa-battle-estimate, div#wwa-password-window",
                "background-color: rgba(" + this._wwaData.frameColorR + "," + this._wwaData.frameColorG + "," + this._wwaData.frameColorB + ",0.9);" +
                "border-color: rgba(" + this._wwaData.frameOutColorR + "," + this._wwaData.frameOutColorG + "," + this._wwaData.frameOutColorB + ",1);" +
                "color: rgba(" + this._wwaData.fontColorR + "," + this._wwaData.fontColorG + "," + this._wwaData.fontColorB + ",1);"
            );
            this._stylePos[wwa_data.SelectorType.SIDEBAR] = this._sheet.addRule(
                "div#wwa-sidebar",
                "color: rgba(" + this._wwaData.statusColorR + "," + this._wwaData.statusColorG + "," + this._wwaData.statusColorB + ",1);" +
                "font-weight: bold;"
            );
        } else {
            this._stylePos[wwa_data.SelectorType.MESSAGE_WINDOW] = this._sheet.insertRule(
                "div.wwa-message-window, div#wwa-battle-estimate, div#wwa-password-window {\n" +
                "background-color: rgba(" + this._wwaData.frameColorR + "," + this._wwaData.frameColorG + "," + this._wwaData.frameColorB + ",0.9);\n" +
                "border-color: rgba(" + this._wwaData.frameOutColorR + "," + this._wwaData.frameOutColorG + "," + this._wwaData.frameOutColorB + ",1);\n" +
                "color: rgba(" + this._wwaData.fontColorR + "," + this._wwaData.fontColorG + "," + this._wwaData.fontColorB + ",1);\n" +
                "}", 0);
            this._stylePos[wwa_data.SelectorType.SIDEBAR] = this._sheet.insertRule(
                "div#wwa-sidebar {\n" +
                "color: rgba(" + this._wwaData.statusColorR + "," + this._wwaData.statusColorG + "," + this._wwaData.statusColorB + ",1);\n" +
                "font-weight: bold;\n" +
                "}", 1);
        }
    }
    public changeStyleRule(type: wwa_data.ChangeStyleType, r: number, g: number, b: number) {
        if (type === wwa_data.ChangeStyleType.COLOR_FRAME) {
            this._wwaData.frameColorR = r;
            this._wwaData.frameColorG = g;
            this._wwaData.frameColorB = b;
        } else if (type === wwa_data.ChangeStyleType.COLOR_FRAMEOUT) {
            this._wwaData.frameOutColorR = r;
            this._wwaData.frameOutColorG = g;
            this._wwaData.frameOutColorB = b;
        } else if (type === wwa_data.ChangeStyleType.COLOR_STR) {
            this._wwaData.fontColorR = r;
            this._wwaData.fontColorG = g;
            this._wwaData.fontColorB = b;
        } else if (type === wwa_data.ChangeStyleType.COLOR_STATUS_STR) {
            this._wwaData.statusColorR = r;
            this._wwaData.statusColorG = g;
            this._wwaData.statusColorB = b;
        }
        this.updateCSSRule();
    }

    public showMonsterWindow(): void {
        this._monsterWindow.show();
    }

    public isConsoleOutputMode(): boolean {
        return this._useConsole;
    }
    // JumpGateマクロ実装ポイント
    public forcedJumpGate(jx: number, jy: number): void {
        this._player.jumpTo(new Position(this, jx, jy, 0, 0));
    }
    // User変数記憶
    public setUserVar(no: number, value: number): void {
        this._wwaData.userVar[no] = value;
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
        // console.log("X:"+this._wwaData.userVar[x]);
        // console.log("Y:"+this._wwaData.userVar[y]);
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
        this._wwaData.userVar[num] = this._player.getStatus().energy;
    }
    // ユーザ変数 <= HPMAX
    public setUserVarHPMAX(num: number): void {
        this._wwaData.userVar[num] = this._player.getEnergyMax();
    }
    // ユーザ変数 <= AT
    public setUserVarAT(num: number): void {
        this._wwaData.userVar[num] = this._player.getStatus().strength;
    }
    // ユーザ変数 <= DF
    public setUserVarDF(num: number): void {
        this._wwaData.userVar[num] = this._player.getStatus().defence;
    }
    // ユーザ変数 <= MONEY
    public setUserVarMONEY(num: number): void {
        this._wwaData.userVar[num] = this._player.getStatus().gold;
    }
    // HP <- ユーザ変数
    public setHPUserVar(num: number): void {
        this._player.setEnergy(this._wwaData.userVar[num]);
        this._player.updateStatusValueBox();
    }
    // HPMAX <- ユーザ変数
    public setHPMAXUserVar(num: number): void {
        this._player.setEnergyMax(this._wwaData.userVar[num]);
        this._player.updateStatusValueBox();
    }
    // AT <- ユーザ変数
    public setATUserVar(num: number): void {
        this._player.setStrength(this._wwaData.userVar[num]);
        this._player.updateStatusValueBox();
    }
    // DF <- ユーザ変数
    public setDFUserVar(num: number): void {
        this._player.setDefence(this._wwaData.userVar[num]);
        this._player.updateStatusValueBox();
    }
    // MONEY <- ユーザ変数
    public setMONEYUserVar(num: number): void {
        this._player.setGold(this._wwaData.userVar[num]);
        this._player.updateStatusValueBox();
    }
    // ユーザ変数 <- 歩数
    public setUserVarStep(num: number): void {
        this._wwaData.userVar[num] = this._player.getMoveCount();
    }
    // ユーザ変数 <- 定数
    public setUserVarVal(x: number, num: number): void {
        this._wwaData.userVar[x] = Math.floor(num);
    }
    // ユーザ変数X <- ユーザ変数Y
    public setUserValOtherUserVal(x: number, y: number): void {
        this._wwaData.userVar[x] = this._wwaData.userVar[y];
    }
    // ユーザ変数X <- ユーザ変数X + ユーザ変数Y
    public setUserValAdd(x: number, y: number): void {
        this._wwaData.userVar[x] += this._wwaData.userVar[y];
    }
    // ユーザ変数X <- ユーザ変数X - ユーザ変数Y
    public setUserValSub(x: number, y: number): void {
        this._wwaData.userVar[x] -= this._wwaData.userVar[y];
    }
    // ユーザ変数X <- ユーザ変数X * ユーザ変数Y
    public setUserValMul(x: number, y: number): void {
        this._wwaData.userVar[x] = Math.floor(this._wwaData.userVar[x] * this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- ユーザ変数X / ユーザ変数Y
    public setUserValDiv(x: number, y: number): void {
        this._wwaData.userVar[x] = Math.floor(this._wwaData.userVar[x] / this._wwaData.userVar[y]);
    }
    // ユーザ変数X <- rand
    public setUserValRandNum(x: number, num: number): void {
        this._wwaData.userVar[x] = Math.floor(Math.random() * (num + 1));
    }
    // ユーザ変数付きの文字列を出力する。
    public showUserValString(macroArgs: string[]) {
        // 最終的に出力する文字列
        var out_str: string;
        out_str = "";
        for (var i = 0; i < macroArgs.length; i++) {
            if (isNaN(parseInt(macroArgs[i]))) {
                out_str += macroArgs[i];
            }
            else {
                out_str += this._wwaData.userVar[parseInt(macroArgs[i])].toString();
            }
        }
        // 出力
        // 何故か \n が反映されない？
        this.setMessageQueue(out_str.replace(/\\n/g, "\n"), false, true);
    }
    // 速度変更禁止
    public speedChangeJudge(speedChangeFlag: boolean): void {
        this._wwaData.permitGameSpeed = speedChangeFlag;
    }
    // 自動セーブ
    public autoSave(): void {
        this._quickSave();
    }
    // ユーザ変数 IFElse
    public userVarUserIf(_triggerPartsPosition: wwa_data.Coord, str: string[]): void {
        // 決定スイッチ
        var judge_if: boolean;
        if (str[5] === void 0) {
            throw new Error("$if の引数不足 str=" + str);
        }
        else {
            switch (str[1]) {
                case "==":
                    judge_if = (this._wwaData.userVar[Number(str[0])] == this._wwaData.userVar[Number(str[2])]);
                    break;
                case "!=":
                    judge_if = (this._wwaData.userVar[Number(str[0])] != this._wwaData.userVar[Number(str[2])]);
                    break;
                case ">=":
                    judge_if = (this._wwaData.userVar[Number(str[0])] >= this._wwaData.userVar[Number(str[2])]);
                    break;
                case ">":
                    judge_if = (this._wwaData.userVar[Number(str[0])] > this._wwaData.userVar[Number(str[2])]);
                    break;
                case "<=":
                    judge_if = (this._wwaData.userVar[Number(str[0])] <= this._wwaData.userVar[Number(str[2])]);
                    break;
                case "<":
                    judge_if = (this._wwaData.userVar[Number(str[0])] < this._wwaData.userVar[Number(str[2])]);
                    break;

            }
            if (judge_if) {
                this.appearPartsEval(_triggerPartsPosition, str[4], str[5], Number(str[3]), Number(str[6]));
            }
            // undefined 判定
            else if (str[9] !== void 0) {
                this.appearPartsEval(_triggerPartsPosition, str[8], str[9], Number(str[7]), Number(str[10]));
            }
        }
    }
    // プレイヤー速度設定
    public setPlayerSpeed(num: number): void {
        var speedIndex: number;
        if (num > 6 && num < 1) {
            throw new Error("#set_speed の引数が異常です:" + num);
        }
        for (var i = 0; i < 6; i++) {
            this._wwaData.gameSpeed = this._player.speedDown();
        }
        for (var i = 1; i < num; i++) {
            this._wwaData.gameSpeed = this._player.speedUp();
        }
        /*
        this.setMessageQueue(
            "移動速度を【" + wwa_data.speedNameList[speedIndex] + "】に切り替えました。\n" +
            (speedIndex === Consts.MAX_SPEED_INDEX ? "戦闘も速くなります。\n":"") +
            "(" +( Consts.MAX_SPEED_INDEX + 1 ) + "段階中" + ( speedIndex + 1 ) + "） 速度を落とすにはIキー, 速度を上げるにはPキーを押してください。", false, true);
        */
    }
    // ユーザ変数にプレイ時間を代入
    public setUserVarPlayTime(num: number): void {
        this.setNowPlayTime();
        this._wwaData.userVar[num] = this._wwaData.playTime;
    }
    // 現在時刻セット
    private setNowPlayTime(): void {
        var _nowTime: any;
        _nowTime = new Date();
        this._wwaData.playTime += (_nowTime.getTime() - this._startTime);
        this._startTime = _nowTime.getTime();
    }
    // 各種ステータスを非表示にする
    public hideStatus(no: number, isHide: boolean): void {
        if (no < 0 || no > 4) {
            throw new Error("隠すパラメータは０から３の間で指定してください。");
        }
        this._player.setHideStatus(no, isHide);
        this._player.updateStatusValueBox();
    }
    // 指定位置にパーツを出現を変数で行う
    public varMap(
        triggerPartsPos: Coord,
        xstr: string,
        ystr: string,
        partsID: number,
        targetPartsType: wwa_data.PartsType
    ): void {
        if (partsID > Consts.USER_VAR_NUM) {
            throw new Error("入力変数が不正です");
        }
        var targetPartsID = this._wwaData.userVar[partsID];
        if (targetPartsID < 0) {
            throw new Error("パーツ番号が不正です");
        }
        if (targetPartsType === wwa_data.PartsType.OBJECT) {
            if (targetPartsID >= this.getObjectPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        } else {
            if (targetPartsID >= this.getMapPartsNum()) {
                throw new Error("パーツ番号が不正です");
            }
        }
        this.appearPartsEval(triggerPartsPos, xstr, ystr, targetPartsID, targetPartsType);
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
    wwa_inject_html.inject(<HTMLDivElement>util.$id("wwa-wrapper"), titleImgName === null ? "cover.gif" : titleImgName);
    var mapFileName = util.$id("wwa-wrapper").getAttribute("data-wwa-mapdata");
    var loaderFileName = util.$id("wwa-wrapper").getAttribute("data-wwa-loader");
    var audioDirectory = util.$id("wwa-wrapper").getAttribute("data-wwa-audio-dir");
    var dumpElmQuery = util.$id("wwa-wrapper").getAttribute("data-wwa-var-dump-elm");
    var dumpElm = null;
    if (util.$id("wwa-wrapper").hasAttribute("data-wwa-var-dump-elm")) {
        dumpElm = util.$qs(dumpElmQuery);
        var tableElm = document.createElement("table");
        var headerTrElm = document.createElement("tr");
        var headerThElm = document.createElement("th");
        var hideButton = document.createElement("button");
        hideButton.textContent = "隠す";
        headerThElm.textContent = "変数一覧";
        headerThElm.setAttribute("colspan", "10");
        headerThElm.classList.add("varlist-header");
        headerThElm.appendChild(hideButton);
        headerTrElm.appendChild(headerThElm);
        tableElm.appendChild(headerTrElm);
        var trNumElm: HTMLElement = null;
        var trValElm: HTMLElement = null;
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
            var thNumElm = document.createElement("th");
            var tdValElm = document.createElement("td");
            thNumElm.textContent = i + "";
            tdValElm.classList.add("var" + i);
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
                Array.prototype.forEach.call(
                    tableElm.querySelectorAll("tr.var-number"), function (etr) {
                        etr.style.display = "table-row";
                    });
                Array.prototype.forEach.call(
                    tableElm.querySelectorAll("tr.var-val"), function (etr) {
                        etr.style.display = "table-row";
                    });
                varDispStatus = true;
            }
        });
    }
    var urlgateEnabled = true;
    if (util.$id("wwa-wrapper").getAttribute("data-wwa-urlgate-enable").match(/^false$/i)) {
        urlgateEnabled = false;
    }
    wwa = new WWA(mapFileName, loaderFileName, urlgateEnabled, audioDirectory, dumpElm);
}


if (document.readyState === "complete") {
    start();
} else {
    window.addEventListener("load", start);
}

