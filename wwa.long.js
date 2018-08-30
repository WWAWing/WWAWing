var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var wwa_input;
(function (wwa_input) {
    var KeyState;
    (function (KeyState) {
        KeyState[KeyState["NONE"] = 0] = "NONE";
        KeyState[KeyState["KEYDOWN"] = 1] = "KEYDOWN";
        KeyState[KeyState["KEYPRESS"] = 2] = "KEYPRESS";
        KeyState[KeyState["KEYUP"] = 3] = "KEYUP";
        KeyState[KeyState["KEYPRESS_MESSAGECHANGE"] = 4] = "KEYPRESS_MESSAGECHANGE";
    })(KeyState = wwa_input.KeyState || (wwa_input.KeyState = {}));
    var KeyCode;
    (function (KeyCode) {
        KeyCode[KeyCode["KEY_ENTER"] = 13] = "KEY_ENTER";
        KeyCode[KeyCode["KEY_SHIFT"] = 16] = "KEY_SHIFT";
        KeyCode[KeyCode["KEY_ESC"] = 27] = "KEY_ESC";
        KeyCode[KeyCode["KEY_SPACE"] = 32] = "KEY_SPACE";
        KeyCode[KeyCode["KEY_LEFT"] = 37] = "KEY_LEFT";
        KeyCode[KeyCode["KEY_UP"] = 38] = "KEY_UP";
        KeyCode[KeyCode["KEY_RIGHT"] = 39] = "KEY_RIGHT";
        KeyCode[KeyCode["KEY_DOWN"] = 40] = "KEY_DOWN";
        KeyCode[KeyCode["KEY_1"] = 49] = "KEY_1";
        KeyCode[KeyCode["KEY_2"] = 50] = "KEY_2";
        KeyCode[KeyCode["KEY_3"] = 51] = "KEY_3";
        KeyCode[KeyCode["KEY_A"] = 65] = "KEY_A";
        KeyCode[KeyCode["KEY_C"] = 67] = "KEY_C";
        KeyCode[KeyCode["KEY_D"] = 68] = "KEY_D";
        KeyCode[KeyCode["KEY_E"] = 69] = "KEY_E";
        KeyCode[KeyCode["KEY_I"] = 73] = "KEY_I";
        KeyCode[KeyCode["KEY_M"] = 77] = "KEY_M";
        KeyCode[KeyCode["KEY_N"] = 78] = "KEY_N";
        KeyCode[KeyCode["KEY_P"] = 80] = "KEY_P";
        KeyCode[KeyCode["KEY_Q"] = 81] = "KEY_Q";
        KeyCode[KeyCode["KEY_S"] = 83] = "KEY_S";
        KeyCode[KeyCode["KEY_W"] = 87] = "KEY_W";
        KeyCode[KeyCode["KEY_X"] = 88] = "KEY_X";
        KeyCode[KeyCode["KEY_Y"] = 89] = "KEY_Y";
        KeyCode[KeyCode["KEY_Z"] = 90] = "KEY_Z";
        KeyCode[KeyCode["KEY_F1"] = 112] = "KEY_F1";
        KeyCode[KeyCode["KEY_F2"] = 113] = "KEY_F2";
        KeyCode[KeyCode["KEY_F3"] = 114] = "KEY_F3";
        KeyCode[KeyCode["KEY_F4"] = 115] = "KEY_F4";
        KeyCode[KeyCode["KEY_F5"] = 116] = "KEY_F5";
        KeyCode[KeyCode["KEY_F6"] = 117] = "KEY_F6";
        KeyCode[KeyCode["KEY_F7"] = 118] = "KEY_F7";
        KeyCode[KeyCode["KEY_F8"] = 119] = "KEY_F8";
        KeyCode[KeyCode["KEY_F9"] = 120] = "KEY_F9";
        KeyCode[KeyCode["KEY_F12"] = 123] = "KEY_F12";
    })(KeyCode = wwa_input.KeyCode || (wwa_input.KeyCode = {}));
    var KeyStore = /** @class */ (function () {
        function KeyStore() {
            var i;
            this._nextKeyState = new Array(KeyStore.KEY_BUFFER_MAX);
            this._keyState = new Array(KeyStore.KEY_BUFFER_MAX);
            this._prevKeyState = new Array(KeyStore.KEY_BUFFER_MAX);
            this._prevKeyStateOnControllable = new Array(KeyStore.KEY_BUFFER_MAX);
            this._keyInputContinueFrameNum = new Array(KeyStore.KEY_BUFFER_MAX);
            for (i = 0; i < KeyStore.KEY_BUFFER_MAX; i++) {
                this._nextKeyState[i] = false;
                this._keyState[i] = false;
                this._prevKeyState[i] = false;
                this._prevKeyStateOnControllable[i] = false;
                this._keyInputContinueFrameNum[i] = 0;
            }
        }
        KeyStore.prototype.checkHitKey = function (keyCode) {
            var s = this.getKeyState(keyCode);
            return (s === KeyState.KEYDOWN || s === KeyState.KEYPRESS);
        };
        KeyStore.prototype.getKeyState = function (keyCode) {
            if (this._prevKeyState[keyCode]) {
                if (this._keyState[keyCode]) {
                    return KeyState.KEYPRESS;
                }
                return KeyState.KEYUP;
            }
            else {
                if (this._keyState[keyCode]) {
                    return KeyState.KEYDOWN;
                }
                return KeyState.NONE;
            }
        };
        KeyStore.prototype.getKeyStateForControllPlayer = function (keyCode) {
            if (this._prevKeyStateOnControllable[keyCode]) {
                if (this._keyState[keyCode]) {
                    return KeyState.KEYPRESS;
                }
                return KeyState.KEYUP;
            }
            else {
                if (this._keyState[keyCode]) {
                    return KeyState.KEYDOWN;
                }
                return KeyState.NONE;
            }
        };
        KeyStore.prototype.getKeyStateForMessageCheck = function (keyCode) {
            if (this._prevKeyState[keyCode]) {
                if (this._keyState[keyCode]) {
                    return (this._keyInputContinueFrameNum[keyCode] >=
                        wwa_data.WWAConsts.KEYPRESS_MESSAGE_CHANGE_FRAME_NUM ?
                        KeyState.KEYPRESS_MESSAGECHANGE : KeyState.KEYPRESS);
                }
                return KeyState.KEYUP;
            }
            else {
                if (this._keyState[keyCode]) {
                    return KeyState.KEYDOWN;
                }
                return KeyState.NONE;
            }
        };
        KeyStore.prototype.setPressInfo = function (keyCode) {
            this._nextKeyState[keyCode] = true;
            this._keyInputContinueFrameNum[keyCode] = -1;
        };
        KeyStore.prototype.setReleaseInfo = function (keyCode) {
            this._nextKeyState[keyCode] = false;
            this._keyInputContinueFrameNum[keyCode] = -1;
        };
        KeyStore.prototype.update = function () {
            var i;
            this._prevKeyState = this._keyState.slice();
            this._keyState = this._nextKeyState.slice();
            for (i = 0; i < KeyStore.KEY_BUFFER_MAX; i++) {
                if (this._keyState[i]) {
                    this._keyInputContinueFrameNum[i]++;
                }
            }
        };
        KeyStore.prototype.memorizeKeyStateOnControllableFrame = function () {
            this._prevKeyStateOnControllable = this._keyState.slice();
        };
        KeyStore.prototype.allClear = function () {
            var i;
            this._nextKeyState = new Array(KeyStore.KEY_BUFFER_MAX);
            for (i = 0; i < KeyStore.KEY_BUFFER_MAX; i++) {
                this._nextKeyState[i] = false;
            }
        };
        KeyStore.KEY_BUFFER_MAX = 256;
        return KeyStore;
    }());
    wwa_input.KeyStore = KeyStore;
    var MouseState;
    (function (MouseState) {
        MouseState[MouseState["NONE"] = 0] = "NONE";
        MouseState[MouseState["MOUSEDOWN"] = 1] = "MOUSEDOWN";
        MouseState[MouseState["MOUSEPRESS"] = 2] = "MOUSEPRESS";
        MouseState[MouseState["MOUSEUP"] = 3] = "MOUSEUP";
    })(MouseState = wwa_input.MouseState || (wwa_input.MouseState = {}));
    var MouseStore = /** @class */ (function () {
        function MouseStore() {
            this._prevMouseState = false;
            this._mouseState = false;
            this._nextMouseState = false;
        }
        MouseStore.prototype.checkClickMouse = function (dir) {
            var s;
            if (dir !== void 0) {
                s = this.getMouseState(dir);
            }
            else {
                s = this.getMouseState();
            }
            return (s === MouseState.MOUSEDOWN || s === MouseState.MOUSEPRESS);
        };
        MouseStore.prototype.getMouseState = function (dir) {
            if (dir !== void 0) {
                if (this._inputDir !== dir) {
                    return MouseState.NONE;
                }
            }
            if (this._prevMouseState) {
                if (this._mouseState) {
                    return MouseState.MOUSEPRESS;
                }
                return MouseState.MOUSEUP;
            }
            else {
                if (this._mouseState) {
                    return MouseState.MOUSEDOWN;
                }
                return MouseState.NONE;
            }
        };
        MouseStore.prototype.getMouseStateForControllPlayer = function (dir) {
            if (dir !== void 0) {
                if (this._inputDir !== dir) {
                    return MouseState.NONE;
                }
            }
            if (this._prevMouseStateOnControllable) {
                if (this._mouseState) {
                    return MouseState.MOUSEPRESS;
                }
                return MouseState.MOUSEUP;
            }
            else {
                if (this._mouseState) {
                    return MouseState.MOUSEDOWN;
                }
                return MouseState.NONE;
            }
        };
        MouseStore.prototype.setPressInfo = function (dir, touchID) {
            this._nextMouseState = true;
            this._inputDir = dir;
            this._touchID = touchID;
        };
        MouseStore.prototype.setReleaseInfo = function () {
            this._touchID = void 0;
            this._nextMouseState = false;
        };
        MouseStore.prototype.memorizeMouseStateOnControllableFrame = function () {
            this._prevMouseStateOnControllable = this._mouseState;
        };
        MouseStore.prototype.update = function () {
            this._prevMouseState = this._mouseState;
            this._mouseState = this._nextMouseState;
        };
        MouseStore.prototype.clear = function () {
            this._nextMouseState = false;
        };
        MouseStore.prototype.getTouchID = function () {
            return this._touchID;
        };
        return MouseStore;
    }());
    wwa_input.MouseStore = MouseStore;
    var GamePadState;
    (function (GamePadState) {
        GamePadState[GamePadState["BUTTON_INDEX_B"] = 0] = "BUTTON_INDEX_B";
        GamePadState[GamePadState["BUTTON_INDEX_A"] = 1] = "BUTTON_INDEX_A";
        GamePadState[GamePadState["BUTTON_INDEX_Y"] = 2] = "BUTTON_INDEX_Y";
        GamePadState[GamePadState["BUTTON_INDEX_X"] = 3] = "BUTTON_INDEX_X";
        GamePadState[GamePadState["BUTTON_INDEX_L"] = 4] = "BUTTON_INDEX_L";
        GamePadState[GamePadState["BUTTON_INDEX_R"] = 5] = "BUTTON_INDEX_R";
        GamePadState[GamePadState["BUTTON_INDEX_ZL"] = 6] = "BUTTON_INDEX_ZL";
        GamePadState[GamePadState["BUTTON_INDEX_ZR"] = 7] = "BUTTON_INDEX_ZR";
        GamePadState[GamePadState["BUTTON_INDEX_MINUS"] = 8] = "BUTTON_INDEX_MINUS";
        GamePadState[GamePadState["BUTTON_INDEX_PLUS"] = 9] = "BUTTON_INDEX_PLUS";
        GamePadState[GamePadState["BUTTON_CROSS_KEY_UP"] = 12] = "BUTTON_CROSS_KEY_UP";
        GamePadState[GamePadState["BUTTON_CROSS_KEY_DOWN"] = 13] = "BUTTON_CROSS_KEY_DOWN";
        GamePadState[GamePadState["BUTTON_CROSS_KEY_LEFT"] = 14] = "BUTTON_CROSS_KEY_LEFT";
        GamePadState[GamePadState["BUTTON_CROSS_KEY_RIGHT"] = 15] = "BUTTON_CROSS_KEY_RIGHT";
        GamePadState[GamePadState["AXES_L_HORIZONTAL_INDEX"] = 0] = "AXES_L_HORIZONTAL_INDEX";
        GamePadState[GamePadState["AXES_L_VERTICAL_INDEX"] = 1] = "AXES_L_VERTICAL_INDEX";
        GamePadState[GamePadState["AXES_R_HORIZONTAL_INDEX"] = 2] = "AXES_R_HORIZONTAL_INDEX";
        GamePadState[GamePadState["AXES_R_VERTICAL_INDEX"] = 3] = "AXES_R_VERTICAL_INDEX";
        GamePadState[GamePadState["AXES_CROSS_KEY"] = 9] = "AXES_CROSS_KEY";
    })(GamePadState = wwa_input.GamePadState || (wwa_input.GamePadState = {}));
    var GamePadStore = /** @class */ (function () {
        function GamePadStore() {
            this.gamepad = null;
            this.triggers = [];
            var i;
            for (i = 0; i < 16; i++) {
                this.triggers[i] = false;
            }
        }
        GamePadStore.prototype.update = function () {
            this.gamepad = null;
            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
            if (gamepads && gamepads.length > 0 && gamepads[0]) {
                var gamepad = gamepads[0];
                this.gamepad = gamepad;
            }
        };
        GamePadStore.prototype.buttonTrigger = function () {
            var codes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                codes[_i] = arguments[_i];
            }
            if (!this.gamepad) {
                return false;
            }
            var i, len, code, buttonFlag, triggerLog;
            len = codes.length;
            for (i = 0; i < len; i++) {
                code = codes[i];
                var buttonData = this.gamepad.buttons[code];
                if (!buttonData) {
                    return false;
                }
                if (typeof (buttonData) === "object") {
                    buttonFlag = buttonData.pressed === true;
                }
                else if (buttonData === 1) {
                    buttonFlag = true;
                }
                else {
                    buttonFlag = false;
                }
                triggerLog = this.triggers[code];
                this.triggers[code] = buttonFlag;
                if (buttonFlag) {
                    if (!triggerLog) {
                        return true;
                    }
                }
            }
            return false;
        };
        GamePadStore.prototype.buttonPressed = function () {
            var codes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                codes[_i] = arguments[_i];
            }
            if (!this.gamepad) {
                return false;
            }
            var i, len, code, buttonFlag;
            len = codes.length;
            for (i = 0; i < len; i++) {
                code = codes[i];
                var buttonData = this.gamepad.buttons[code];
                if (!buttonData) {
                    return false;
                }
                if (typeof (buttonData) === "object") {
                    buttonFlag = buttonData.pressed === true;
                }
                else if (buttonData === 1) {
                    buttonFlag = true;
                }
                else {
                    buttonFlag = false;
                }
                if (buttonFlag) {
                    return true;
                }
            }
            return false;
        };
        GamePadStore.prototype.crossPressed = function () {
            var codes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                codes[_i] = arguments[_i];
            }
            if (!this.gamepad) {
                return false;
            }
            var i, len, code;
            len = codes.length;
            for (i = 0; i < len; i++) {
                code = codes[i];
                switch (code) {
                    case GamePadState.BUTTON_CROSS_KEY_UP:
                        if (this.gamepad.axes[GamePadState.AXES_L_VERTICAL_INDEX] <= -0.6 ||
                            this.gamepad.axes[GamePadState.AXES_R_VERTICAL_INDEX] <= -0.6 ||
                            this.stickFloor(GamePadState.AXES_CROSS_KEY) === -1 ||
                            this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_UP)) {
                            return true;
                        }
                        break;
                    case GamePadState.BUTTON_CROSS_KEY_DOWN:
                        if (this.gamepad.axes[GamePadState.AXES_L_VERTICAL_INDEX] >= 0.7 ||
                            this.gamepad.axes[GamePadState.AXES_R_VERTICAL_INDEX] >= 0.7 ||
                            this.stickFloor(GamePadState.AXES_CROSS_KEY) === 0.1 ||
                            this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                            return true;
                        }
                        break;
                    case GamePadState.BUTTON_CROSS_KEY_LEFT:
                        if (this.gamepad.axes[GamePadState.AXES_L_HORIZONTAL_INDEX] <= -0.7 ||
                            this.gamepad.axes[GamePadState.AXES_R_HORIZONTAL_INDEX] <= -0.7 ||
                            this.stickFloor(GamePadState.AXES_CROSS_KEY) === 0.7 ||
                            this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                            return true;
                        }
                        break;
                    case GamePadState.BUTTON_CROSS_KEY_RIGHT:
                        if (this.gamepad.axes[GamePadState.AXES_L_HORIZONTAL_INDEX] > 0.6 ||
                            this.gamepad.axes[GamePadState.AXES_R_HORIZONTAL_INDEX] > 0.6 ||
                            this.stickFloor(GamePadState.AXES_CROSS_KEY) === -0.5 ||
                            this.buttonPressed(GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                            return true;
                        }
                        break;
                }
            }
            return false;
        };
        GamePadStore.prototype.stickFloor = function () {
            var codes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                codes[_i] = arguments[_i];
            }
            if (!this.gamepad) {
                return 0;
            }
            var i, len, code, buttonFlag;
            len = codes.length;
            for (i = 0; i < len; i++) {
                code = codes[i];
                var value = this.gamepad.axes[code];
                if (typeof value !== "number") {
                    return 0;
                }
                return Math.floor(value * 10) / 10;
            }
            return 0;
        };
        return GamePadStore;
    }());
    wwa_input.GamePadStore = GamePadStore;
})(wwa_input || (wwa_input = {}));
/// <reference path="./wwa_main.ts" />
var wwa_data;
(function (wwa_data) {
    var EquipmentStatus = /** @class */ (function () {
        function EquipmentStatus(s, d) {
            this.strength = s;
            this.defence = d;
        }
        EquipmentStatus.prototype.add = function (s) {
            this.strength += s.strength;
            this.defence += s.defence;
            return this;
        };
        EquipmentStatus.prototype.plus = function (s) {
            return new EquipmentStatus(this.strength + s.strength, this.defence + s.defence);
        };
        EquipmentStatus.prototype.minus = function (s) {
            return new EquipmentStatus(this.strength - s.strength, this.defence - s.defence);
        };
        EquipmentStatus.prototype.equals = function (e) {
            return this.strength === e.strength && this.defence === e.defence;
        };
        return EquipmentStatus;
    }());
    wwa_data.EquipmentStatus = EquipmentStatus;
    var Status = /** @class */ (function (_super) {
        __extends(Status, _super);
        function Status(e, s, d, g) {
            var _this = _super.call(this, s, d) || this;
            _this.energy = e;
            _this.gold = g;
            return _this;
        }
        Status.prototype.add = function (s) {
            if (s instanceof Status) {
                this.energy += s.energy;
                this.gold += s.gold;
            }
            this.strength += s.strength;
            this.defence += s.defence;
            return this;
        };
        Status.prototype.plus = function (s) {
            if (s instanceof Status) {
                return new Status(this.energy + s.energy, this.strength + s.strength, this.defence + s.defence, this.gold + s.gold);
            }
            return new Status(this.energy, this.strength + s.strength, this.defence + s.defence, this.gold);
        };
        Status.prototype.minus = function (s) {
            if (s instanceof Status) {
                return new Status(this.energy - s.energy, this.strength - s.strength, this.defence - s.defence, this.gold - s.gold);
            }
            return new Status(this.energy, this.strength - s.strength, this.defence - s.defence, this.gold);
        };
        Status.prototype.equals = function (e) {
            return this.energy === e.energy && this.strength === e.strength && this.defence === e.defence && this.gold === e.gold;
        };
        return Status;
    }(EquipmentStatus));
    wwa_data.Status = Status;
    /**
        Coordは座標(coordinate)を示す変数２つ組です。
        パーツ座標や、画面座標を用いるのに使用します。
    */
    var Coord = /** @class */ (function () {
        function Coord(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = x;
            this.y = y;
        }
        Coord.prototype.equals = function (coord) {
            return this.x === coord.x && this.y === coord.y;
        };
        Coord.prototype.substract = function (c) {
            return new Coord(this.x - c.x, this.y - c.y);
        };
        Coord.prototype.clone = function () {
            return new Coord(this.x, this.y);
        };
        Coord.prototype.convertIntoPosition = function (wwa) {
            return new Position(wwa, this.x, this.y, 0, 0);
        };
        Coord.prototype.getDirectionTo = function (dest) {
            if (this.x < dest.x) {
                if (this.y > dest.y) {
                    return Direction.RIGHT_UP;
                }
                if (this.y === dest.y) {
                    return Direction.RIGHT;
                }
                return Direction.RIGHT_DOWN;
            }
            if (this.x === dest.x) {
                if (this.y > dest.y) {
                    return Direction.UP;
                }
                if (this.y === dest.y) {
                    return Direction.NO_DIRECTION;
                }
                return Direction.DOWN;
            }
            if (this.y > dest.y) {
                return Direction.LEFT_UP;
            }
            if (this.y === dest.y) {
                return Direction.LEFT;
            }
            return Direction.LEFT_DOWN;
        };
        Coord.prototype.toString = function () {
            return "(" + this.x + ", " + this.y + ")";
        };
        return Coord;
    }());
    wwa_data.Coord = Coord;
    var Position = /** @class */ (function () {
        function Position(wwa, x, y, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            this._wwa = wwa;
            if (this._wwa === void 0) {
                throw new Error("WWAのインスタンスが存在しません. ");
            }
            var w = this._wwa.getMapWidth();
            if (x < 0 || x >= w || x >= w - 1 && offsetX > 0 || y < 0 || y >= w || y >= w - 1 && offsetY > 0) {
                throw new Error("範囲外の座標です!! parts:(" + x + ", " + y + "), offset:(" + offsetX + ", " + offsetY + "), mapWidth = " + w);
            }
            this._partsCoord = new Coord(x, y);
            this._offsetCoord = new Coord(offsetX, offsetY);
        }
        Position.prototype.getPartsCoord = function () {
            return this._partsCoord;
        };
        Position.prototype.getOffsetCoord = function () {
            return this._offsetCoord;
        };
        Position.prototype.getScreenTopPosition = function () {
            var newX = Math.floor(this._partsCoord.x / (WWAConsts.H_PARTS_NUM_IN_WINDOW - 1)) * (WWAConsts.H_PARTS_NUM_IN_WINDOW - 1);
            var newY = Math.floor(this._partsCoord.y / (WWAConsts.V_PARTS_NUM_IN_WINDOW - 1)) * (WWAConsts.V_PARTS_NUM_IN_WINDOW - 1);
            return new Position(this._wwa, newX, newY, 0, 0);
        };
        Position.prototype.getDefaultCameraPosition = function () {
            var pos = this.getScreenTopPosition();
            var coord = pos.getPartsCoord();
            var width = this._wwa.getMapWidth();
            var newCoord = pos.getPartsCoord().clone();
            if (coord.x === width - 1) {
                newCoord.x--;
            }
            if (coord.y === width - 1) {
                newCoord.y--;
            }
            return newCoord.convertIntoPosition(this._wwa).getScreenTopPosition();
        };
        Position.prototype.getNextJustPosition = function (dir) {
            // 方向指定時は、その方向の次のPartsCoordを返す
            if (dir !== void 0) {
                var p = this._partsCoord;
                return new Position(this._wwa, p.x + wwa_data.vx[dir], p.y + wwa_data.vy[dir], 0, 0);
            }
            // 方向未指定時は、offsetの方向の次のPartsCoordを返す。
            var x = this._partsCoord.x, y = this._partsCoord.y;
            if (this._offsetCoord.x < 0) {
                x--;
            }
            else if (this._offsetCoord.x > 0) {
                x++;
            }
            if (this._offsetCoord.y < 0) {
                y--;
            }
            else if (this._offsetCoord.y > 0) {
                y++;
            }
            return new Position(this._wwa, x, y, 0, 0);
        };
        Position.prototype.getNextFramePosition = function (dir, speedX, speedY) {
            var nx = this._partsCoord.x;
            var ny = this._partsCoord.y;
            var nox = this._offsetCoord.x + (wwa_data.vx[dir] * speedX);
            var noy = this._offsetCoord.y + (wwa_data.vy[dir] * speedY);
            if (nox < 0) {
                var dx = Math.floor(Math.abs(nox) / WWAConsts.CHIP_SIZE);
                nx -= dx;
                nox = (nox + dx * WWAConsts.CHIP_SIZE) % WWAConsts.CHIP_SIZE;
            }
            if (noy < 0) {
                var dy = Math.floor(Math.abs(noy) / WWAConsts.CHIP_SIZE);
                ny -= dy;
                noy = (noy + dy * WWAConsts.CHIP_SIZE) % WWAConsts.CHIP_SIZE;
            }
            if (nox >= WWAConsts.CHIP_SIZE) {
                nx += Math.floor(nox / WWAConsts.CHIP_SIZE);
                nox = (nox + WWAConsts.CHIP_SIZE) % WWAConsts.CHIP_SIZE;
            }
            if (noy >= WWAConsts.CHIP_SIZE) {
                ny += Math.floor(noy / WWAConsts.CHIP_SIZE);
                noy = (noy + WWAConsts.CHIP_SIZE) % WWAConsts.CHIP_SIZE;
            }
            return new Position(this._wwa, nx, ny, nox, noy);
        };
        Position.prototype.isJustPosition = function () {
            return this._offsetCoord.x == 0 && this._offsetCoord.y == 0;
        };
        Position.prototype.isScreenTopPosition = function () {
            var stp = this.getScreenTopPosition();
            return this.equals(stp);
        };
        Position.prototype.equals = function (pos) {
            return (this._partsCoord.equals(pos.getPartsCoord()) &&
                this._offsetCoord.equals(pos.getOffsetCoord()));
        };
        Position.prototype.isInCameraRange = function (camera, exceptRightBottomEdge) {
            if (exceptRightBottomEdge === void 0) { exceptRightBottomEdge = false; }
            var camPos = camera.getPosition()._partsCoord;
            var x = this._partsCoord.x;
            var y = this._partsCoord.y;
            var m = exceptRightBottomEdge ? 1 : 0;
            return (camPos.x <= x && x < camPos.x + WWAConsts.H_PARTS_NUM_IN_WINDOW - m &&
                camPos.y <= y && y < camPos.y + WWAConsts.V_PARTS_NUM_IN_WINDOW - m);
        };
        Position.prototype.hasLocalGate = function () {
            return (this._wwa.getMapTypeByPosition(this) === WWAConsts.MAP_LOCALGATE ||
                this._wwa.getObjectTypeByPosition(this) === WWAConsts.OBJECT_LOCALGATE);
        };
        Position.prototype.clone = function () {
            return new Position(this._wwa, this._partsCoord.x, this._partsCoord.y, this._offsetCoord.x, this._offsetCoord.y);
        };
        return Position;
    }());
    wwa_data.Position = Position;
    var Face = /** @class */ (function () {
        function Face(destPos, srcPos, srcSize) {
            this.destPos = destPos.clone();
            this.srcPos = srcPos.clone();
            this.srcSize = srcSize.clone();
        }
        return Face;
    }());
    wwa_data.Face = Face;
    var Direction;
    (function (Direction) {
        Direction[Direction["LEFT"] = 0] = "LEFT";
        Direction[Direction["RIGHT"] = 1] = "RIGHT";
        Direction[Direction["DOWN"] = 2] = "DOWN";
        Direction[Direction["UP"] = 3] = "UP";
        // ここから下はプレイヤー使用不可
        Direction[Direction["LEFT_DOWN"] = 4] = "LEFT_DOWN";
        Direction[Direction["LEFT_UP"] = 5] = "LEFT_UP";
        Direction[Direction["RIGHT_DOWN"] = 6] = "RIGHT_DOWN";
        Direction[Direction["RIGHT_UP"] = 7] = "RIGHT_UP";
        // 向きなしは、マクロ$movesで「プレイヤーの動きなしに物体を動かす」時に使う
        Direction[Direction["NO_DIRECTION"] = 8] = "NO_DIRECTION";
    })(Direction = wwa_data.Direction || (wwa_data.Direction = {}));
    ;
    wwa_data.vx = [-1, 1, 0, 0, -1, -1, 1, 1, 0];
    wwa_data.vy = [0, 0, 1, -1, 1, -1, 1, -1, 0];
    wwa_data.dirToPos = [4, 6, 2, 0]; // 仮
    wwa_data.dirToKey = [wwa_input.KeyCode.KEY_LEFT, wwa_input.KeyCode.KEY_RIGHT, wwa_input.KeyCode.KEY_DOWN, wwa_input.KeyCode.KEY_UP];
    var YesNoState;
    (function (YesNoState) {
        YesNoState[YesNoState["YES"] = 0] = "YES";
        YesNoState[YesNoState["NO"] = 1] = "NO";
        YesNoState[YesNoState["UNSELECTED"] = 2] = "UNSELECTED";
    })(YesNoState = wwa_data.YesNoState || (wwa_data.YesNoState = {}));
    var AppearanceTriggerType;
    (function (AppearanceTriggerType) {
        AppearanceTriggerType[AppearanceTriggerType["MAP"] = 0] = "MAP";
        AppearanceTriggerType[AppearanceTriggerType["OBJECT"] = 1] = "OBJECT";
        //        USE_ITEM,
        AppearanceTriggerType[AppearanceTriggerType["CHOICE_YES"] = 2] = "CHOICE_YES";
        AppearanceTriggerType[AppearanceTriggerType["CHOICE_NO"] = 3] = "CHOICE_NO";
    })(AppearanceTriggerType = wwa_data.AppearanceTriggerType || (wwa_data.AppearanceTriggerType = {}));
    var ItemMode;
    (function (ItemMode) {
        ItemMode[ItemMode["NORMAL"] = 0] = "NORMAL";
        ItemMode[ItemMode["CAN_USE"] = 1] = "CAN_USE";
        ItemMode[ItemMode["NOT_DISAPPEAR"] = 2] = "NOT_DISAPPEAR";
    })(ItemMode = wwa_data.ItemMode || (wwa_data.ItemMode = {}));
    var PartsType;
    (function (PartsType) {
        PartsType[PartsType["MAP"] = 1] = "MAP";
        PartsType[PartsType["OBJECT"] = 0] = "OBJECT";
    })(PartsType = wwa_data.PartsType || (wwa_data.PartsType = {}));
    var ChoiceCallInfo;
    (function (ChoiceCallInfo) {
        ChoiceCallInfo[ChoiceCallInfo["NONE"] = 0] = "NONE";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_MAP_PARTS"] = 1] = "CALL_BY_MAP_PARTS";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_OBJECT_PARTS"] = 2] = "CALL_BY_OBJECT_PARTS";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_ITEM_USE"] = 3] = "CALL_BY_ITEM_USE";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_QUICK_SAVE"] = 4] = "CALL_BY_QUICK_SAVE";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_QUICK_LOAD"] = 5] = "CALL_BY_QUICK_LOAD";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_RESTART_GAME"] = 6] = "CALL_BY_RESTART_GAME";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_GOTO_WWA"] = 7] = "CALL_BY_GOTO_WWA";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_PASSWORD_SAVE"] = 8] = "CALL_BY_PASSWORD_SAVE";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_PASSWORD_LOAD"] = 9] = "CALL_BY_PASSWORD_LOAD";
        ChoiceCallInfo[ChoiceCallInfo["CALL_BY_END_GAME"] = 10] = "CALL_BY_END_GAME";
    })(ChoiceCallInfo = wwa_data.ChoiceCallInfo || (wwa_data.ChoiceCallInfo = {}));
    var SidebarButton;
    (function (SidebarButton) {
        SidebarButton[SidebarButton["QUICK_LOAD"] = 0] = "QUICK_LOAD";
        SidebarButton[SidebarButton["QUICK_SAVE"] = 1] = "QUICK_SAVE";
        SidebarButton[SidebarButton["RESTART_GAME"] = 2] = "RESTART_GAME";
        SidebarButton[SidebarButton["GOTO_WWA"] = 3] = "GOTO_WWA";
    })(SidebarButton = wwa_data.SidebarButton || (wwa_data.SidebarButton = {}));
    var SpeedChange;
    (function (SpeedChange) {
        SpeedChange[SpeedChange["UP"] = 0] = "UP";
        SpeedChange[SpeedChange["DOWN"] = 1] = "DOWN";
    })(SpeedChange = wwa_data.SpeedChange || (wwa_data.SpeedChange = {}));
    var LoadType;
    (function (LoadType) {
        LoadType[LoadType["QUICK_LOAD"] = 0] = "QUICK_LOAD";
        LoadType[LoadType["RESTART_GAME"] = 1] = "RESTART_GAME";
        LoadType[LoadType["PASSWORD"] = 2] = "PASSWORD";
    })(LoadType = wwa_data.LoadType || (wwa_data.LoadType = {}));
    var MoveType;
    (function (MoveType) {
        MoveType[MoveType["STATIC"] = 0] = "STATIC";
        MoveType[MoveType["CHASE_PLAYER"] = 1] = "CHASE_PLAYER";
        MoveType[MoveType["RUN_OUT"] = 2] = "RUN_OUT";
        MoveType[MoveType["HANG_AROUND"] = 3] = "HANG_AROUND";
    })(MoveType = wwa_data.MoveType || (wwa_data.MoveType = {}));
    var SecondCandidateMoveType;
    (function (SecondCandidateMoveType) {
        SecondCandidateMoveType[SecondCandidateMoveType["MODE_X"] = 0] = "MODE_X";
        SecondCandidateMoveType[SecondCandidateMoveType["MODE_Y"] = 1] = "MODE_Y";
        SecondCandidateMoveType[SecondCandidateMoveType["UNDECIDED"] = 2] = "UNDECIDED";
    })(SecondCandidateMoveType = wwa_data.SecondCandidateMoveType || (wwa_data.SecondCandidateMoveType = {}));
    wwa_data.sidebarButtonCellElementID = ["cell-load", "cell-save", "cell-restart", "cell-gotowwa"];
    var SystemMessage1;
    (function (SystemMessage1) {
        SystemMessage1[SystemMessage1["ASK_LINK"] = 5] = "ASK_LINK";
        SystemMessage1[SystemMessage1["NO_MONEY"] = 6] = "NO_MONEY";
        SystemMessage1[SystemMessage1["NO_ITEM"] = 7] = "NO_ITEM";
        SystemMessage1[SystemMessage1["USE_ITEM"] = 8] = "USE_ITEM";
    })(SystemMessage1 = wwa_data.SystemMessage1 || (wwa_data.SystemMessage1 = {}));
    var SystemMessage2;
    (function (SystemMessage2) {
        SystemMessage2[SystemMessage2["CLICKABLE_ITEM"] = 0] = "CLICKABLE_ITEM";
        SystemMessage2[SystemMessage2["FULL_ITEM"] = 1] = "FULL_ITEM";
        SystemMessage2[SystemMessage2["LOAD_SE"] = 2] = "LOAD_SE";
    })(SystemMessage2 = wwa_data.SystemMessage2 || (wwa_data.SystemMessage2 = {}));
    var MacroType;
    (function (MacroType) {
        MacroType[MacroType["UNDEFINED"] = 0] = "UNDEFINED";
        MacroType[MacroType["IMGPLAYER"] = 1] = "IMGPLAYER";
        MacroType[MacroType["IMGYESNO"] = 2] = "IMGYESNO";
        MacroType[MacroType["HPMAX"] = 3] = "HPMAX";
        MacroType[MacroType["SAVE"] = 4] = "SAVE";
        MacroType[MacroType["ITEM"] = 5] = "ITEM";
        MacroType[MacroType["DEFAULT"] = 6] = "DEFAULT";
        MacroType[MacroType["OLDMAP"] = 7] = "OLDMAP";
        MacroType[MacroType["PARTS"] = 8] = "PARTS";
        MacroType[MacroType["MOVE"] = 9] = "MOVE";
        MacroType[MacroType["MAP"] = 10] = "MAP";
        MacroType[MacroType["DIRMAP"] = 11] = "DIRMAP";
        MacroType[MacroType["IMGFRAME"] = 12] = "IMGFRAME";
        MacroType[MacroType["IMGBOM"] = 13] = "IMGBOM";
        MacroType[MacroType["DELPLAYER"] = 14] = "DELPLAYER";
        MacroType[MacroType["FACE"] = 15] = "FACE";
        MacroType[MacroType["EFFECT"] = 16] = "EFFECT";
        MacroType[MacroType["GAMEOVER"] = 17] = "GAMEOVER";
        MacroType[MacroType["IMGCLICK"] = 18] = "IMGCLICK";
        MacroType[MacroType["STATUS"] = 19] = "STATUS";
        MacroType[MacroType["EFFITEM"] = 20] = "EFFITEM";
        MacroType[MacroType["COLOR"] = 21] = "COLOR";
        MacroType[MacroType["WAIT"] = 22] = "WAIT";
        MacroType[MacroType["SOUND"] = 23] = "SOUND";
    })(MacroType = wwa_data.MacroType || (wwa_data.MacroType = {}));
    wwa_data.macrotable = {
        "": 0,
        "$imgplayer": 1,
        "$imgyesno": 2,
        "$hpmax": 3,
        "$save": 4,
        "$item": 5,
        "$default": 6,
        "$oldmap": 7,
        "$parts": 8,
        "$move": 9,
        "$map": 10,
        "$dirmap": 11,
        "$imgframe": 12,
        "$imgbom": 13,
        "$delplayer": 14,
        "$face": 15,
        "$effect": 16,
        "$gameover": 17,
        "$imgclick": 18,
        "$status": 19,
        "$effitem": 20,
        "$color": 21,
        "$wait": 22,
        "$sound": 23
    };
    var MacroStatusIndex;
    (function (MacroStatusIndex) {
        MacroStatusIndex[MacroStatusIndex["ENERGY"] = 0] = "ENERGY";
        MacroStatusIndex[MacroStatusIndex["STRENGTH"] = 1] = "STRENGTH";
        MacroStatusIndex[MacroStatusIndex["DEFENCE"] = 2] = "DEFENCE";
        MacroStatusIndex[MacroStatusIndex["GOLD"] = 3] = "GOLD";
        MacroStatusIndex[MacroStatusIndex["MOVES"] = 4] = "MOVES";
    })(MacroStatusIndex = wwa_data.MacroStatusIndex || (wwa_data.MacroStatusIndex = {}));
    var MacroImgFrameIndex;
    (function (MacroImgFrameIndex) {
        MacroImgFrameIndex[MacroImgFrameIndex["ENERGY"] = 0] = "ENERGY";
        MacroImgFrameIndex[MacroImgFrameIndex["STRENGTH"] = 1] = "STRENGTH";
        MacroImgFrameIndex[MacroImgFrameIndex["DEFENCE"] = 2] = "DEFENCE";
        MacroImgFrameIndex[MacroImgFrameIndex["GOLD"] = 3] = "GOLD";
        MacroImgFrameIndex[MacroImgFrameIndex["WIDE_CELL_ROW"] = 4] = "WIDE_CELL_ROW";
        MacroImgFrameIndex[MacroImgFrameIndex["ITEM_BG"] = 5] = "ITEM_BG";
        MacroImgFrameIndex[MacroImgFrameIndex["MAIN_FRAME"] = 6] = "MAIN_FRAME";
    })(MacroImgFrameIndex = wwa_data.MacroImgFrameIndex || (wwa_data.MacroImgFrameIndex = {}));
    var SystemSound;
    (function (SystemSound) {
        SystemSound[SystemSound["DECISION"] = 1] = "DECISION";
        SystemSound[SystemSound["ATTACK"] = 3] = "ATTACK";
        SystemSound[SystemSound["BGM_LB"] = 70] = "BGM_LB";
        SystemSound[SystemSound["NO_SOUND"] = 99] = "NO_SOUND";
    })(SystemSound = wwa_data.SystemSound || (wwa_data.SystemSound = {}));
    wwa_data.speedList = [2, 5, 8, 10];
    wwa_data.speedNameList = ["低速", "準低速", "中速", "高速"];
    var WWAConsts = /** @class */ (function () {
        function WWAConsts() {
        }
        WWAConsts.VERSION_WWAJS = "W3.15c+";
        WWAConsts.WWA_HOME = "http://wwajp.com";
        WWAConsts.ITEMBOX_SIZE = 12;
        WWAConsts.MAP_ATR_MAX = 60;
        WWAConsts.OBJ_ATR_MAX = 60;
        WWAConsts.OLD_MAP_ATR_MAX = 40;
        WWAConsts.OLD_OBJ_ATR_MAX = 40;
        /*
        static ATR_CROP1: number = 1;
        static ATR_CROP2: number = 2;
        */
        WWAConsts.ATR_TYPE = 3;
        WWAConsts.ATR_MODE = 4;
        WWAConsts.ATR_STRING = 5;
        WWAConsts.ATR_X = 6;
        WWAConsts.ATR_Y = 7;
        WWAConsts.ATR_X2 = 8;
        WWAConsts.ATR_Y2 = 9;
        WWAConsts.ATR_ENERGY = 10;
        WWAConsts.ATR_STRENGTH = 11;
        WWAConsts.ATR_DEFENCE = 12;
        WWAConsts.ATR_GOLD = 13;
        WWAConsts.ATR_ITEM = 14;
        WWAConsts.ATR_NUMBER = 15;
        WWAConsts.ATR_JUMP_X = 16;
        WWAConsts.ATR_MOVE = 16;
        WWAConsts.ATR_JUMP_Y = 17;
        WWAConsts.ATR_SOUND = 19;
        WWAConsts.ATR_APPERANCE_BASE = 20;
        WWAConsts.REL_ATR_APPERANCE_ID = 0;
        WWAConsts.REL_ATR_APPERANCE_X = 1;
        WWAConsts.REL_ATR_APPERANCE_Y = 2;
        WWAConsts.REL_ATR_APPERANCE_TYPE = 3;
        WWAConsts.REL_ATR_APPERANCE_UNIT_LENGTH = 4;
        WWAConsts.ATR_RANDOM_BASE = 10;
        WWAConsts.RANDOM_ATR_NUM = 10;
        WWAConsts.RANDOM_ITERATION_MAX = 10;
        WWAConsts.MAP_STREET = 0;
        WWAConsts.MAP_WALL = 1;
        WWAConsts.MAP_LOCALGATE = 2;
        WWAConsts.MAP_URLGATE = 4;
        WWAConsts.OBJECT_NORMAL = 0;
        WWAConsts.OBJECT_MESSAGE = 1;
        WWAConsts.OBJECT_URLGATE = 2;
        WWAConsts.OBJECT_STATUS = 3;
        WWAConsts.OBJECT_ITEM = 4;
        WWAConsts.OBJECT_DOOR = 5;
        WWAConsts.OBJECT_MONSTER = 6;
        WWAConsts.OBJECT_SCORE = 11;
        WWAConsts.OBJECT_SELL = 14;
        WWAConsts.OBJECT_BUY = 15;
        WWAConsts.OBJECT_RANDOM = 16;
        WWAConsts.OBJECT_SELECT = 17;
        WWAConsts.OBJECT_LOCALGATE = 18;
        WWAConsts.SYSTEM_MESSAGE_NUM = 20;
        WWAConsts.IMGPOS_DEFAULT_YESNO_X = 3;
        WWAConsts.IMGPOS_DEFAULT_YESNO_Y = 1;
        WWAConsts.IMGRELPOS_YESNO_YES_X = 0;
        WWAConsts.IMGRELPOS_YESNO_NO_X = 1;
        WWAConsts.IMGRELPOS_YESNO_YESP_X = 2;
        WWAConsts.IMGRELPOS_YESNO_NOP_X = 3;
        WWAConsts.IMGPOS_DEFAULT_PLAYER_X = 2;
        WWAConsts.IMGPOS_DEFAULT_PLAYER_Y = 0;
        WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_X = 0;
        WWAConsts.IMGPOS_DEFAULT_CLICKABLE_ITEM_SIGN_Y = 0;
        WWAConsts.IMGPOS_DEFAULT_FRAME_X = 0;
        WWAConsts.IMGPOS_DEFAULT_FRAME_Y = 1;
        WWAConsts.IMGPOS_DEFAULT_BATTLE_EFFECT_X = 3;
        WWAConsts.IMGPOS_DEFAULT_BATTLE_EFFECT_Y = 3;
        WWAConsts.DEFAULT_DISABLE_SAVE = false;
        WWAConsts.DEFAULT_OLDMAP = false;
        WWAConsts.DEFAULT_OBJECT_NO_COLLAPSE = false;
        WWAConsts.SPLASH_SCREEN_DISP_MILLS = 100; // ms
        WWAConsts.DEFAULT_FRAME_INTERVAL = 20; // ms
        WWAConsts.GAMEOVER_FRAME_INTERVAL = 50; // ms
        WWAConsts.YESNO_PRESS_DISP_FRAME_NUM = 20; // f
        WWAConsts.CHIP_SIZE = 40;
        WWAConsts.MAP_WINDOW_WIDTH = 440;
        WWAConsts.MAP_WINDOW_HEIGHT = 440;
        WWAConsts.H_PARTS_NUM_IN_WINDOW = WWAConsts.MAP_WINDOW_WIDTH / WWAConsts.CHIP_SIZE;
        WWAConsts.V_PARTS_NUM_IN_WINDOW = WWAConsts.MAP_WINDOW_HEIGHT / WWAConsts.CHIP_SIZE;
        WWAConsts.DEFAULT_SPEED_INDEX = 2;
        WWAConsts.MIN_SPEED_INDEX = 0;
        WWAConsts.MAX_SPEED_INDEX = wwa_data.speedList.length - 1;
        WWAConsts.ANIMATION_REP_HALF_FRAME = 22;
        WWAConsts.PLAYER_LOOKING_AROUND_START_FRAME = WWAConsts.ANIMATION_REP_HALF_FRAME * 4;
        WWAConsts.RELATIVE_COORD_BIAS = 10000;
        WWAConsts.RELATIVE_COORD_LOWER = WWAConsts.RELATIVE_COORD_BIAS - 1000;
        WWAConsts.PLAYER_COORD = WWAConsts.RELATIVE_COORD_BIAS - 1000;
        WWAConsts.LOCALGATE_PLAYER_WAIT_FRAME = 5;
        WWAConsts.STATUS_CHANGED_EFFECT_FRAME_NUM = 20;
        WWAConsts.PASSABLE_OBJECT = 1;
        WWAConsts.APPERANCE_PARTS_MIN_INDEX = 0;
        WWAConsts.APPERANCE_PARTS_MAX_INDEX = 9;
        WWAConsts.APPERANCE_PARTS_MIN_INDEX_NO = 5;
        WWAConsts.APPERANCE_PARTS_MAX_INDEX_YES = 4;
        WWAConsts.FADEOUT_SPEED = 8;
        WWAConsts.STATUS_MINUS_BORDER = 30000;
        WWAConsts.ITEMBOX_IS_FULL = -1;
        WWAConsts.BATTLE_INTERVAL_FRAME_NUM = 10; // f [200/20]
        WWAConsts.BATTLE_SPEED_CHANGE_TURN_NUM = 40; // モンスターターンを含む, バトルを早送りにするまでのターン数
        WWAConsts.RANDOM_MOVE_ITERATION_NUM = 50;
        WWAConsts.RANDOM_MOVE_ITERATION_NUM_BEFORE_V31 = 8;
        WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX = 8;
        WWAConsts.SOUND_MAX = 100;
        WWAConsts.ITEM_BORDER_IMG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAArklEQVRYR" +
            "+2Y0QqAIAxFt///aENJHwxxuJUSxzeh3S7HXaNpEkly4FIRzba0GEyHeVTN7jqDWvb7V4Y1NLibZIY0" +
            "NbiL5G3MZLCe / 1fn3XJgJYjB7mgg6O1VCEKwXo79JeklY62nB62kRs9BEIKkeNIDhISQEBJC4k0BB" +
            "CF4D7D4cV9shf99ixdB + MrM0y3fa3zV05D45GOqhwPMGPkYlccIOEY2VKUN0UNVXxC7ADj7mDi9aF" +
            "ZZAAAAAElFTkSuQmCC";
        WWAConsts.LOAD_STAGE_MAX_EXCEPT_AUDIO = 7;
        WWAConsts.WWA_STYLE_TAG_ID = "wwa-additional-style";
        WWAConsts.DEFAULT_FRAME_COLOR_R = 0xff;
        WWAConsts.DEFAULT_FRAME_COLOR_G = 0xff;
        WWAConsts.DEFAULT_FRAME_COLOR_B = 0xff;
        WWAConsts.DEFAULT_FRAMEOUT_COLOR_R = 0x60;
        WWAConsts.DEFAULT_FRAMEOUT_COLOR_G = 0x60;
        WWAConsts.DEFAULT_FRAMEOUT_COLOR_B = 0x60;
        WWAConsts.DEFAULT_STRBACK_COLOR_R = 0x0;
        WWAConsts.DEFAULT_STRBACK_COLOR_G = 0x0;
        WWAConsts.DEFAULT_STRBACK_COLOR_B = 0x0;
        WWAConsts.DEFAULT_STATUS_COLOR_R = 0x0;
        WWAConsts.DEFAULT_STATUS_COLOR_G = 0x0;
        WWAConsts.DEFAULT_STATUS_COLOR_B = 0x0;
        WWAConsts.KEYPRESS_MESSAGE_CHANGE_FRAME_NUM = 20;
        WWAConsts.WWAP_SERVER_OLD = "http://wwawing.com/wwap";
        WWAConsts.WWAP_SERVER = "https://wwaphoenix.github.io";
        WWAConsts.WWAP_SERVER_AUDIO_DIR = "audio";
        WWAConsts.WWAP_SERVER_TITLE_IMG = "cover_p.gif";
        WWAConsts.WWAP_SERVER_LOADER_NO_WORKER = "wwaload.noworker.js";
        WWAConsts.SCREEN_WIDTH = 560;
        WWAConsts.SCREEN_HEIGHT = 440;
        WWAConsts.LOADING_FONT = "Times New Roman";
        WWAConsts.MSG_STR_WIDTH = 16;
        return WWAConsts;
    }());
    wwa_data.WWAConsts = WWAConsts;
    var LoaderResponse = /** @class */ (function () {
        function LoaderResponse() {
        }
        return LoaderResponse;
    }());
    wwa_data.LoaderResponse = LoaderResponse;
    var LoaderError = /** @class */ (function () {
        function LoaderError() {
        }
        return LoaderError;
    }());
    wwa_data.LoaderError = LoaderError;
    var LoaderProgress = /** @class */ (function () {
        function LoaderProgress() {
        }
        return LoaderProgress;
    }());
    wwa_data.LoaderProgress = LoaderProgress;
    var LoadStage;
    (function (LoadStage) {
        LoadStage[LoadStage["INIT"] = 0] = "INIT";
        LoadStage[LoadStage["MAP_LOAD"] = 1] = "MAP_LOAD";
        LoadStage[LoadStage["OBJ_LOAD"] = 2] = "OBJ_LOAD";
        LoadStage[LoadStage["MAP_ATTR"] = 3] = "MAP_ATTR";
        LoadStage[LoadStage["OBJ_ATTR"] = 4] = "OBJ_ATTR";
        LoadStage[LoadStage["RAND_PARTS"] = 5] = "RAND_PARTS";
        LoadStage[LoadStage["MESSAGE"] = 6] = "MESSAGE";
        LoadStage[LoadStage["GAME_INIT"] = 7] = "GAME_INIT";
        LoadStage[LoadStage["AUDIO"] = 8] = "AUDIO";
        LoadStage[LoadStage["FINISH"] = 9] = "FINISH";
    })(LoadStage = wwa_data.LoadStage || (wwa_data.LoadStage = {}));
    wwa_data.loadMessages = [
        "ロードの準備をしています。",
        "背景パーツを読み込んでいます。",
        "物体パーツを読み込んでます。",
        "背景パーツの属性を読み込んでます。",
        "物体パーツの属性を読み込んでます。",
        "ランダムパーツを置換しています。",
        "メッセージを読み込んでます。",
        "Welcome to WWA Wing!"
    ]; // Welcome は実際には表示されません。詰め物程度に。
    wwa_data.loadMessagesClassic = [
        "Welcome to WWA Wing!",
        "Now Map Data Loading .....",
        "Now CG Data Loading .....",
        "Now Making chara CG ....."
    ];
    var LoadingMessagePosition;
    (function (LoadingMessagePosition) {
        LoadingMessagePosition[LoadingMessagePosition["LINE"] = 30] = "LINE";
        LoadingMessagePosition[LoadingMessagePosition["TITLE_X"] = 100] = "TITLE_X";
        LoadingMessagePosition[LoadingMessagePosition["TITLE_Y"] = 70] = "TITLE_Y";
        LoadingMessagePosition[LoadingMessagePosition["LOADING_X"] = 50] = "LOADING_X";
        LoadingMessagePosition[LoadingMessagePosition["LOADING_Y"] = 140] = "LOADING_Y";
        LoadingMessagePosition[LoadingMessagePosition["ERROR_X"] = 10] = "ERROR_X";
        LoadingMessagePosition[LoadingMessagePosition["ERROR_Y"] = 180] = "ERROR_Y";
        LoadingMessagePosition[LoadingMessagePosition["FOOTER_X"] = 160] = "FOOTER_X";
        LoadingMessagePosition[LoadingMessagePosition["FOOTER_Y"] = 360] = "FOOTER_Y";
        LoadingMessagePosition[LoadingMessagePosition["WORLD_Y"] = 330] = "WORLD_Y";
        LoadingMessagePosition[LoadingMessagePosition["COPYRIGHT_Y"] = 390] = "COPYRIGHT_Y";
    })(LoadingMessagePosition = wwa_data.LoadingMessagePosition || (wwa_data.LoadingMessagePosition = {}));
    var LoadingMessageSize;
    (function (LoadingMessageSize) {
        LoadingMessageSize[LoadingMessageSize["TITLE"] = 32] = "TITLE";
        LoadingMessageSize[LoadingMessageSize["LOADING"] = 22] = "LOADING";
        LoadingMessageSize[LoadingMessageSize["FOOTER"] = 18] = "FOOTER";
        LoadingMessageSize[LoadingMessageSize["ERRROR"] = 16] = "ERRROR";
    })(LoadingMessageSize = wwa_data.LoadingMessageSize || (wwa_data.LoadingMessageSize = {}));
    var ChangeStyleType;
    (function (ChangeStyleType) {
        ChangeStyleType[ChangeStyleType["COLOR_FRAME"] = 0] = "COLOR_FRAME";
        ChangeStyleType[ChangeStyleType["COLOR_FRAMEOUT"] = 1] = "COLOR_FRAMEOUT";
        ChangeStyleType[ChangeStyleType["COLOR_STR"] = 2] = "COLOR_STR";
        //        COLOR_STRBACK = 3,
        ChangeStyleType[ChangeStyleType["COLOR_STATUS_STR"] = 4] = "COLOR_STATUS_STR";
        //        COLOR_STATUS_STRBACK = 5
    })(ChangeStyleType = wwa_data.ChangeStyleType || (wwa_data.ChangeStyleType = {}));
    ;
    var SelectorType;
    (function (SelectorType) {
        SelectorType[SelectorType["MESSAGE_WINDOW"] = 0] = "MESSAGE_WINDOW";
        SelectorType[SelectorType["SIDEBAR"] = 1] = "SIDEBAR";
    })(SelectorType = wwa_data.SelectorType || (wwa_data.SelectorType = {}));
    ;
    var WWAData = /** @class */ (function () {
        function WWAData() {
            this.version = void 0;
            this.gameoverX = void 0;
            this.gameoverY = void 0;
            this.playerX = void 0;
            this.playerY = void 0;
            this.mapPartsMax = void 0;
            this.objPartsMax = void 0;
            this.isOldMap = void 0;
            this.statusEnergyMax = void 0;
            this.statusEnergy = void 0;
            this.statusStrength = void 0;
            this.statusDefence = void 0;
            this.statusGold = void 0;
            this.itemBox = void 0;
            this.mapWidth = void 0;
            this.messageNum = void 0;
            this.map = void 0;
            this.mapObject = void 0;
            this.mapCompressed = void 0;
            this.mapObjectCompressed = void 0;
            this.mapAttribute = void 0;
            this.objectAttribute = void 0;
            this.worldPassword = void 0;
            this.message = void 0;
            this.worldName = void 0;
            this.worldPassNumber = void 0;
            this.charCGName = void 0;
            this.mapCGName = void 0;
            this.systemMessage = void 0;
            this.moves = void 0;
            this.yesnoImgPosX = void 0;
            this.yesnoImgPosY = void 0;
            this.playerImgPosX = void 0;
            this.playerImgPosY = void 0;
            this.clickableItemSignImgPosX = void 0; // 0の時, 標準枠  注) 面倒なことがわかったので未実装
            this.clickableItemSignImgPosY = void 0; // undefined時, 標準枠 注) 面倒なことがわかったので未実装
            this.disableSaveFlag = void 0;
            this.compatibleForOldMapFlag = void 0;
            this.objectNoCollapseDefaultFlag = void 0;
            this.delPlayerFlag = void 0;
            this.bgm = void 0;
            this.imgClickX = void 0;
            this.imgClickY = void 0;
            this.frameColorR = void 0;
            this.frameColorG = void 0;
            this.frameColorB = void 0;
            this.frameOutColorR = void 0;
            this.frameOutColorG = void 0;
            this.frameOutColorB = void 0;
            this.fontColorR = void 0;
            this.fontColorG = void 0;
            this.fontColorB = void 0;
            this.statusColorR = void 0;
            this.statusColorG = void 0;
            this.statusColorB = void 0;
            this.checkOriginalMapString = void 0;
            this.checkString = void 0;
        }
        return WWAData;
    }());
    wwa_data.WWAData = WWAData;
})(wwa_data || (wwa_data = {}));
/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_camera.ts" />
/// <reference path="./wwa_main.ts" />
var wwa_parts_player;
(function (wwa_parts_player) {
    var Direction = wwa_data.Direction;
    var Consts = wwa_data.WWAConsts;
    var Parts = /** @class */ (function () {
        function Parts(pos) {
            this._position = pos;
        }
        Parts.prototype.getPosition = function () {
            return this._position;
        };
        return Parts;
    }());
    var PartsObject = /** @class */ (function (_super) {
        __extends(PartsObject, _super);
        function PartsObject(pos) {
            return _super.call(this, pos) || this;
        }
        return PartsObject;
    }(Parts));
    wwa_parts_player.PartsObject = PartsObject;
    var PartsMap = /** @class */ (function (_super) {
        __extends(PartsMap, _super);
        function PartsMap(pos) {
            return _super.call(this, pos) || this;
        }
        return PartsMap;
    }(Parts));
    wwa_parts_player.PartsMap = PartsMap;
    var PlayerState;
    (function (PlayerState) {
        PlayerState[PlayerState["CONTROLLABLE"] = 0] = "CONTROLLABLE";
        PlayerState[PlayerState["MOVING"] = 1] = "MOVING";
        PlayerState[PlayerState["CAMERA_MOVING"] = 2] = "CAMERA_MOVING";
        PlayerState[PlayerState["MESSAGE_WAITING"] = 3] = "MESSAGE_WAITING";
        PlayerState[PlayerState["LOCALGATE_JUMPED"] = 4] = "LOCALGATE_JUMPED";
        PlayerState[PlayerState["BATTLE"] = 5] = "BATTLE";
        PlayerState[PlayerState["ESTIMATE_WINDOW_WAITING"] = 6] = "ESTIMATE_WINDOW_WAITING";
        PlayerState[PlayerState["PASSWORD_WINDOW_WAITING"] = 7] = "PASSWORD_WINDOW_WAITING";
    })(PlayerState || (PlayerState = {}));
    var Player = /** @class */ (function (_super) {
        __extends(Player, _super);
        function Player(wwa, pos, camera, status, em) {
            var _this = _super.call(this, pos) || this;
            _this._status = status;
            _this._equipStatus = new wwa_data.EquipmentStatus(0, 0);
            _this._itemBox = new Array(Consts.ITEMBOX_SIZE);
            _this._itemBoxElement = new Array(Consts.ITEMBOX_SIZE);
            _this._itemUsingEvent = new Array(Consts.ITEMBOX_SIZE);
            for (var i = 0; i < _this._itemBox.length; i++) {
                _this._itemBox[i] = 0;
                _this._itemBoxElement[i] = wwa_util.$qsh("#item" + i + ">.item-disp");
            }
            _this.updateItemBox();
            _this._energyMax = em;
            _this._dir = Direction.DOWN;
            _this._isMovingImage = false;
            _this._wwa = wwa;
            _this._state = PlayerState.CONTROLLABLE;
            _this._camera = camera;
            _this._isPartsEventExecuted = false;
            _this._energyValueElement = wwa_util.$qsh("#disp-energy>.status-value-box");
            _this._strengthValueElement = wwa_util.$qsh("#disp-strength>.status-value-box");
            _this._defenceValueElement = wwa_util.$qsh("#disp-defence>.status-value-box");
            _this._goldValueElement = wwa_util.$qsh("#disp-gold>.status-value-box");
            _this._isReadyToUseItem = false;
            _this._isClickableItemGot = false;
            _this._moves = 0;
            _this._moveMacroWaitingRemainMoves = 0;
            _this._moveObjectAutoExecTimer = 0;
            _this.updateStatusValueBox();
            _this._partsAppeared = false;
            _this._afterMoveMacroFlag = false;
            _this._isPreparedForLookingAround = true;
            _this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
            _this._speedIndex = Consts.DEFAULT_SPEED_INDEX;
            return _this;
        }
        Player.prototype.move = function () {
            if (this.isControllable()) {
                this.controll(this._dir);
                return;
            }
            if (this._state === PlayerState.CAMERA_MOVING) {
                try {
                    this._camera.move(this._dir);
                }
                catch (e) {
                    // この時点で範囲外になることはないとは思うが...
                }
                if (this._isOnCameraStopPosition()) {
                    this._state = PlayerState.CONTROLLABLE;
                }
            }
            else if (this._state === PlayerState.MOVING) {
                try {
                    var next = this._position.getNextFramePosition(this._dir, wwa_data.speedList[this._speedIndex], wwa_data.speedList[this._speedIndex]);
                }
                catch (e) {
                    // この時点で範囲外になることはないとは思うが...
                }
                if (next.isJustPosition()) {
                    this._state = PlayerState.CONTROLLABLE;
                    this.toggleMovingImage();
                    this._moves++;
                    this._isPartsEventExecuted = false;
                    this._samePosLastExecutedMapID = void 0;
                    this._samePosLastExecutedObjID = void 0;
                }
                this._position = next;
            }
        };
        Player.prototype.controll = function (moveDir) {
            var nextFramePos;
            var nextJustPos;
            if (this.isControllable()) {
                this._isPreparedForLookingAround = false;
                this._dir = moveDir;
                try {
                    nextFramePos = this._position.getNextFramePosition(this._dir, wwa_data.speedList[this._speedIndex], wwa_data.speedList[this._speedIndex]);
                    nextJustPos = this._position.getNextJustPosition(moveDir);
                }
                catch (e) {
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
                        }
                        catch (e) {
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
        };
        // 座標posに移動できるならtrue, 移動できないならfalse
        Player.prototype.canMoveTo = function (pos) {
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
        };
        // プレイヤーが動いているかどうか。カメラが動いている場合も動いているとする。
        Player.prototype.isMoving = function () {
            return this._state == PlayerState.MOVING || this._state == PlayerState.CAMERA_MOVING;
        };
        Player.prototype._isOnCameraMovingPosition = function () {
            var camPos = this._camera.getPosition().getPartsCoord();
            var pPos = this.getPosition().getPartsCoord();
            return ((pPos.x - camPos.x === Consts.H_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.RIGHT) ||
                (pPos.x === camPos.x && this._dir === Direction.LEFT) ||
                (pPos.y - camPos.y === Consts.V_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.DOWN) ||
                (pPos.y === camPos.y && this._dir === Direction.UP));
        };
        Player.prototype._isOnCameraStopPosition = function () {
            var camPos = this._camera.getPosition().getPartsCoord();
            var pPos = this.getPosition().getPartsCoord();
            return ((pPos.x - camPos.x === Consts.H_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.LEFT) ||
                (pPos.x === camPos.x && this._dir === Direction.RIGHT) ||
                (pPos.y - camPos.y === Consts.V_PARTS_NUM_IN_WINDOW - 1 && this._dir === Direction.UP) ||
                (pPos.y === camPos.y && this._dir === Direction.DOWN));
        };
        Player.prototype.isControllable = function () {
            var isAfterMoveMacro = this._afterMoveMacroFlag;
            this._afterMoveMacroFlag = false;
            return (this._state === PlayerState.CONTROLLABLE &&
                !this._partsAppeared &&
                ((this._wwa.getMapTypeByPosition(this._position) !== Consts.MAP_LOCALGATE &&
                    this._wwa.getMapTypeByPosition(this._position) !== Consts.MAP_URLGATE) ||
                    !this._wwa.isPrevFrameEventExecuted()) &&
                this._moveMacroWaitingRemainMoves === 0 && this._moveObjectAutoExecTimer === 0 &&
                !isAfterMoveMacro && this._wwa.canInput());
        };
        Player.prototype.getCopyOfItemBox = function () {
            return this._itemBox.slice();
        };
        Player.prototype.getDir = function () {
            return this._dir;
        };
        Player.prototype.isMovingImage = function () {
            return this._isMovingImage;
        };
        Player.prototype.toggleMovingImage = function () {
            if (this._isMovingImage) {
                this._isMovingImage = false;
            }
            else {
                this._isMovingImage = true;
            }
        };
        Player.prototype.getEnergyMax = function () {
            return this._energyMax;
        };
        Player.prototype.isJumped = function () {
            return this._state === PlayerState.LOCALGATE_JUMPED;
        };
        Player.prototype.setMessageWaiting = function () {
            this._state = PlayerState.MESSAGE_WAITING;
        };
        Player.prototype.isWaitingMessage = function () {
            return this._state === PlayerState.MESSAGE_WAITING;
        };
        Player.prototype.clearMessageWaiting = function () {
            if (this._state === PlayerState.MESSAGE_WAITING) {
                this._state = PlayerState.CONTROLLABLE;
                this._isPartsEventExecuted = true;
                if (this._isPreparedForLookingAround) {
                    this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
                }
            }
        };
        Player.prototype.setEstimateWindowWating = function () {
            this._state = PlayerState.ESTIMATE_WINDOW_WAITING;
        };
        Player.prototype.isWatingEstimateWindow = function () {
            return this._state === PlayerState.ESTIMATE_WINDOW_WAITING;
        };
        Player.prototype.clearEstimateWindowWaiting = function () {
            if (this._state === PlayerState.ESTIMATE_WINDOW_WAITING) {
                this._state = PlayerState.CONTROLLABLE;
            }
        };
        Player.prototype.setPasswordWindowWating = function () {
            this._state = PlayerState.PASSWORD_WINDOW_WAITING;
        };
        Player.prototype.isWaitingPasswordWindow = function () {
            return this._state === PlayerState.PASSWORD_WINDOW_WAITING;
        };
        Player.prototype.clearPasswordWindowWaiting = function () {
            if (this._state === PlayerState.PASSWORD_WINDOW_WAITING) {
                this._state = PlayerState.CONTROLLABLE;
            }
        };
        Player.prototype.isPartsEventExecuted = function () {
            return this._isPartsEventExecuted;
        };
        Player.prototype.resetEventExecutionInfo = function () {
            this._isPartsEventExecuted = false;
        };
        Player.prototype.getLastExecPartsIDOnSamePosition = function (type) {
            return type === wwa_data.PartsType.MAP ? this._samePosLastExecutedMapID : this._samePosLastExecutedObjID;
        };
        Player.prototype.setLastExecInfoOnSamePosition = function (type, id) {
            if (type === wwa_data.PartsType.MAP) {
                this._samePosLastExecutedMapID = id;
            }
            else {
                this._samePosLastExecutedObjID = id;
            }
        };
        Player.prototype.processAfterJump = function () {
            if (this._state !== PlayerState.LOCALGATE_JUMPED) {
                return;
            }
            if (--this._jumpWaitFramesRemain === 0) {
                this._state = PlayerState.CONTROLLABLE;
            }
        };
        Player.prototype.jumpTo = function (pos) {
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
            }
            else if (pos.getPartsCoord().y <= this._wwa.getMapWidth() - 2 && pos.getNextJustPosition(Direction.DOWN).hasLocalGate()) {
                this._dir = Direction.UP;
            }
            else if (pos.getPartsCoord().y >= 1 && pos.getNextJustPosition(Direction.UP).hasLocalGate()) {
                this._dir = Direction.DOWN;
            }
            else if (pos.getPartsCoord().x <= this._wwa.getMapWidth() - 2 && pos.getNextJustPosition(Direction.RIGHT).hasLocalGate()) {
                this._dir = Direction.LEFT;
            }
            else if (pos.getPartsCoord().x >= 1 && pos.getNextJustPosition(Direction.LEFT).hasLocalGate()) {
                this._dir = Direction.RIGHT;
            }
            else {
                this._dir = Direction.DOWN;
            }
            if (!this._camera.getPosition().equals(prevCameraPos)) {
                this._isPreparedForLookingAround = true;
                this._lookingAroundTimer = Consts.PLAYER_LOOKING_AROUND_START_FRAME;
            }
            return true;
        };
        // システムジャンプ (ロードなどによる強制移動)
        Player.prototype.systemJumpTo = function (pos) {
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
        };
        Player.prototype.addStatusAll = function (s) {
            this._status.add(s);
            if (this.isDead()) {
                this._status.energy = 0;
            }
            if (this._energyMax !== 0) {
                this._status.energy = Math.min(this._status.energy, this._energyMax);
            }
            this.updateStatusValueBox();
            return this._status;
        };
        Player.prototype.setEnergyMax = function (em) {
            this._energyMax = em;
            if (em !== 0) {
                this._status.energy = Math.min(this._status.energy, this._energyMax);
            }
            this.updateStatusValueBox();
            return em;
        };
        Player.prototype.setEnergy = function (e) {
            this._status.energy = e;
            if (this.isDead()) {
                this._status.energy = 0;
            }
            if (this._energyMax !== 0) {
                this._status.energy = Math.min(this._status.energy, this._energyMax);
            }
            this.updateStatusValueBox();
            return e;
        };
        Player.prototype.damage = function (amount) {
            this._status.energy = Math.max(0, this._status.energy - amount);
            if (this.isDead()) {
                this._status.energy = 0;
            }
            if (this._energyMax !== 0) {
                this._status.energy = Math.min(this._status.energy, this._energyMax);
            }
            this.updateStatusValueBox();
        };
        Player.prototype.setStrength = function (s) {
            this._status.strength = s;
            this.updateStatusValueBox();
            return s;
        };
        Player.prototype.setDefence = function (d) {
            this._status.defence = d;
            this.updateStatusValueBox();
            return d;
        };
        Player.prototype.setGold = function (g) {
            this._status.gold = g;
            this.updateStatusValueBox();
            return g;
        };
        Player.prototype.getStatus = function () {
            return this._status.plus(this._equipStatus);
        };
        Player.prototype.getStatusWithoutEquipments = function () {
            // クローンハック
            return this._status.plus(new wwa_data.EquipmentStatus(0, 0));
        };
        Player.prototype.updateStatusValueBox = function () {
            var totalStatus = this._status.plus(this._equipStatus);
            var e = totalStatus.energy;
            var s = totalStatus.strength;
            var d = totalStatus.defence;
            var g = totalStatus.gold;
            this._energyValueElement.textContent = e + "";
            this._strengthValueElement.textContent = s + "";
            this._defenceValueElement.textContent = d + "";
            this._goldValueElement.textContent = g + "";
        };
        Player.prototype.updateItemBox = function () {
            var cx, cy;
            for (var i = 0; i < this._itemBoxElement.length; i++) {
                if (this._itemBox[i] === 0) {
                    this._itemBoxElement[i].style.backgroundPosition = "-40px 0px";
                }
                else {
                    cx = this._wwa.getObjectCropXById(this._itemBox[i]);
                    cy = this._wwa.getObjectCropYById(this._itemBox[i]);
                    this._itemBoxElement[i].style.backgroundPosition = "-" + cx + "px -" + cy + "px";
                }
            }
        };
        Player.prototype.isDead = function () {
            return this._status.energy <= 0;
        };
        Player.prototype.addItem = function (objID, itemPos, isOverwrite) {
            if (itemPos === void 0) { itemPos = 0; }
            if (isOverwrite === void 0) { isOverwrite = false; }
            var insertPos;
            var oldInsertPos;
            var oldObjID;
            var itemType;
            var border;
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
            }
            else if (isOverwrite === false) {
                insertPos = itemPos;
                oldObjID = this._itemBox[insertPos - 1];
                if (this._wwa.getObjectAttributeById(oldObjID, Consts.ATR_NUMBER) !==
                    this._wwa.getObjectAttributeById(objID, Consts.ATR_NUMBER)) {
                    oldInsertPos = this._getBlankItemPos();
                    if (oldInsertPos !== Consts.ITEMBOX_IS_FULL) {
                        //                        this._itemBox[oldInsertPos - 1] = oldObjID;
                        this._forceSetItemBox(oldInsertPos, oldObjID);
                        this._forceSetItemBox(insertPos, objID);
                    }
                    else {
                        throw new Error("これ以上、アイテムを持てません。");
                    }
                }
                else {
                    this._forceSetItemBox(insertPos, objID);
                }
                // 特定位置挿入（上書きする）
            }
            else {
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
        };
        Player.prototype._forceSetItemBox = function (pos, id) {
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
                                "使用できるアイテムは色枠で囲まれます。" : mes, false, true);
                    }
                    this._isClickableItemGot = true;
                }
                border.style.display = "block";
                (function (pos) {
                    self._itemUsingEvent[pos - 1] = function () {
                        if (self.isControllable() || (self._wwa._messageWindow.isItemMenuChoice())) {
                            self._wwa._itemMenu.close();
                            self._wwa._setNextMessage();
                            self._wwa.onselectitem(pos);
                        }
                    };
                })(pos);
                border.addEventListener("click", this._itemUsingEvent[pos - 1]);
            }
        };
        Player.prototype._getBlankItemPos = function () {
            var insertPos;
            for (insertPos = 1; insertPos < this._itemBox.length + 1; insertPos++) {
                if (this._itemBox[insertPos - 1] === 0) {
                    return insertPos;
                }
            }
            return Consts.ITEMBOX_IS_FULL;
        };
        Player.prototype._updateEquipmentStatus = function () {
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
        };
        Player.prototype.hasItem = function (partsID) {
            for (var i = 0; i < Consts.ITEMBOX_SIZE; i++) {
                if (this._itemBox[i] === partsID) {
                    return true;
                }
            }
            return false;
        };
        Player.prototype.canUseItem = function (itemPos) {
            var partsID = this._itemBox[itemPos - 1];
            if (partsID === 0) {
                return false;
            }
            if (this._wwa.getObjectAttributeById(partsID, Consts.ATR_MODE) === wwa_data.ItemMode.NORMAL) {
                return false;
            }
            return true;
        };
        Player.prototype.useItem = function () {
            var itemID;
            var messageID;
            itemID = this._itemBox[this._readyToUseItemPos - 1];
            if (this._wwa.getObjectAttributeById(itemID, Consts.ATR_MODE) !== wwa_data.ItemMode.NOT_DISAPPEAR) {
                this.removeItemByItemPosition(this._readyToUseItemPos);
            }
            var bg = (wwa_util.$id("item" + (this._readyToUseItemPos - 1)));
            setTimeout(function () {
                if (bg.classList.contains("onpress")) {
                    bg.classList.remove("onpress");
                }
            }, Consts.DEFAULT_FRAME_INTERVAL);
            this._isReadyToUseItem = false;
            this._readyToUseItemPos = void 0;
            return itemID;
        };
        Player.prototype.canHaveMoreItems = function () {
            return this._getBlankItemPos() !== Consts.ITEMBOX_IS_FULL;
        };
        Player.prototype.removeItemByItemPosition = function (itemPos) {
            var border;
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
        };
        Player.prototype.removeItemByPartsID = function (partsID) {
            var border;
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
        };
        Player.prototype.clearItemBox = function () {
            for (var i = 1; i <= Consts.ITEMBOX_SIZE; i++) {
                this.removeItemByItemPosition(i);
            }
            this._updateEquipmentStatus();
            this.updateItemBox();
        };
        Player.prototype.hasGold = function (gold) {
            return this._status.gold >= gold;
        };
        Player.prototype.payGold = function (gold) {
            if (!this.hasGold(gold)) {
                throw new Error("お金が足りない");
            }
            this.setGold(this._status.gold - gold);
        };
        Player.prototype.earnGold = function (gold) {
            this.setGold(this._status.gold + gold);
        };
        Player.prototype.setPartsAppearedFlag = function () {
            this._partsAppeared = true;
        };
        Player.prototype.clearPartsAppearedFlag = function () {
            this._partsAppeared = false;
        };
        Player.prototype.isPartsAppearedTime = function () {
            return this._partsAppeared === true;
        };
        Player.prototype.startBattleWith = function (enemy) {
            this._isPlayerTurn = true;
            this._battleFrameCounter = Consts.BATTLE_INTERVAL_FRAME_NUM;
            this._battleTurnNum = 0;
            this._enemy = enemy;
            this._state = PlayerState.BATTLE;
        };
        Player.prototype.isFighting = function () {
            return this._state === PlayerState.BATTLE;
        };
        Player.prototype.isTurn = function () {
            return this._isPlayerTurn;
        };
        Player.prototype.getTurnNum = function () {
            return this._battleTurnNum;
        };
        Player.prototype.isBattleStartFrame = function () {
            return this._battleFrameCounter === Consts.BATTLE_INTERVAL_FRAME_NUM && this._battleTurnNum === 0;
        };
        Player.prototype.fight = function () {
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
            }
            else {
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
                    }
                    else {
                        this._wwa.playSound(this._wwa.getObjectAttributeById(this._enemy.partsID, Consts.ATR_SOUND));
                        //                        this._wwa.appearParts(this._enemy.position, wwa_data.AppearanceTriggerType.OBJECT, this._enemy.partsID);
                        this.earnGold(enemyStatus.gold);
                        this._wwa.setStatusChangedEffect(new wwa_data.Status(0, 0, 0, enemyStatus.gold));
                        if (this._enemy.item !== 0) {
                            this._wwa.setPartsOnPosition(wwa_data.PartsType.OBJECT, this._enemy.item, this._enemy.position);
                        }
                        else {
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
            }
            else {
                // モンスターターン
                if (enemyStatus.strength > playerStatus.defence) {
                    // プレイヤーがまだ生きてる
                    if (playerStatus.energy > enemyStatus.strength - playerStatus.defence) {
                        this.damage(enemyStatus.strength - playerStatus.defence);
                        // モンスター勝利
                    }
                    else {
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
        };
        Player.prototype.readyToUseItem = function (itemPos) {
            var itemID;
            var messageID;
            if (!this.canUseItem(itemPos)) {
                throw new Error("アイテムがないか、アイテムが使えません。");
            }
            itemID = this._itemBox[itemPos - 1];
            messageID = this._wwa.getObjectAttributeById(itemID, Consts.ATR_STRING);
            //            this._wwa.setMessageQueue(this._wwa.getMessageById(messageID), false, itemID, wwa_data.PartsType.OBJECT, this._position.getPartsCoord());
            this._wwa.appearParts(this._position.getPartsCoord(), wwa_data.AppearanceTriggerType.OBJECT, itemID);
            this._readyToUseItemPos = itemPos;
            this._isReadyToUseItem = true;
        };
        Player.prototype.isReadyToUseItem = function () {
            return this._isReadyToUseItem;
        };
        Player.prototype.getDrawingCenterPosition = function () {
            var pos = this._position.getPartsCoord();
            var poso = this._position.getOffsetCoord();
            var cameraPos = this._camera.getPosition();
            var cpParts = cameraPos.getPartsCoord();
            var cpOffset = cameraPos.getOffsetCoord();
            var targetX = (pos.x - cpParts.x) * Consts.CHIP_SIZE + poso.x - cpOffset.x + Consts.CHIP_SIZE / 2;
            var targetY = (pos.y - cpParts.y) * Consts.CHIP_SIZE + poso.y - cpOffset.y + Consts.CHIP_SIZE / 2;
            return new wwa_data.Coord(targetX, targetY);
        };
        Player.prototype.getMoveCount = function () {
            return this._moves;
        };
        Player.prototype.setMoveCount = function (count) {
            return this._moves = count;
        };
        Player.prototype.isMoveObjectAutoExecTime = function () {
            return this._moveObjectAutoExecTimer === 0;
        };
        Player.prototype.setMoveMacroWaiting = function (moveNum) {
            if (moveNum < 0) {
                return;
            }
            this._moveMacroWaitingRemainMoves = moveNum;
            this._moveObjectAutoExecTimer = 0;
        };
        Player.prototype.resetMoveObjectAutoExecTimer = function () {
            this._moveObjectAutoExecTimer = Consts.CHIP_SIZE / wwa_data.speedList[this._speedIndex];
            this._moveMacroWaitingRemainMoves--;
        };
        Player.prototype.decrementMoveObjectAutoExecTimer = function () {
            if (this._moveMacroWaitingRemainMoves >= 0 && this._moveObjectAutoExecTimer > 0) {
                this._moveObjectAutoExecTimer--;
                if (this._moveMacroWaitingRemainMoves === 0 && this._moveObjectAutoExecTimer === 0) {
                    this._afterMoveMacroFlag = true;
                }
            }
            return 0;
        };
        Player.prototype.isWaitingMoveMacro = function () {
            return this._moveMacroWaitingRemainMoves !== 0 || this._moveObjectAutoExecTimer !== 0;
        };
        Player.prototype.decrementLookingAroundTimer = function () {
            if (this._isPreparedForLookingAround && this._lookingAroundTimer > 0) {
                return --this._lookingAroundTimer;
            }
            return 0;
        };
        Player.prototype.isLookingAround = function () {
            return this._isPreparedForLookingAround && this._lookingAroundTimer === 0;
        };
        Player.prototype.getSpeedIndex = function () {
            return this._speedIndex;
        };
        Player.prototype.speedUp = function () {
            return this._speedIndex = Math.min(Consts.MAX_SPEED_INDEX, this._speedIndex + 1);
        };
        Player.prototype.speedDown = function () {
            return this._speedIndex = Math.max(Consts.MIN_SPEED_INDEX, this._speedIndex - 1);
        };
        return Player;
    }(PartsObject));
    wwa_parts_player.Player = Player;
})(wwa_parts_player || (wwa_parts_player = {}));
/// <reference path="./wwa_parts_player.ts" />
/// <reference path="./wwa_data.ts" />
var wwa_camera;
(function (wwa_camera) {
    var Consts = wwa_data.WWAConsts;
    var Camera = /** @class */ (function () {
        /**
          現在のプレイヤー座標が含まれるカメラ位置(表示画面左上)を含むカメラを作ります.
          @param position: wwa_data.Position 現在のプレイヤー座標
        */
        function Camera(position) {
            this._position = null;
            this.reset(position);
        }
        Camera.prototype.setPlayer = function (player) {
            this._player = player;
        };
        Camera.prototype.isResetting = function () {
            return this._isResetting;
        };
        Camera.prototype.getPosition = function () {
            return this._position;
        };
        Camera.prototype.getPreviousPosition = function () {
            return this._positionPrev;
        };
        Camera.prototype.resetPreviousPosition = function () {
            this._positionPrev = null;
        };
        // throws OutOfWWAMapRangeError;
        Camera.prototype.move = function (dir) {
            var speed = wwa_data.speedList[this._player.getSpeedIndex()];
            this._position = this._position.getNextFramePosition(dir, speed * (Consts.H_PARTS_NUM_IN_WINDOW - 1), speed * (Consts.V_PARTS_NUM_IN_WINDOW - 1));
        };
        Camera.prototype.getTransitionStepNum = function () {
            return this._transitionStep;
        };
        Camera.prototype.advanceTransitionStepNum = function () {
            ++this._transitionStep;
            if (this._transitionStep === wwa_data.WWAConsts.V_PARTS_NUM_IN_WINDOW) {
                this._isResetting = false;
                this._transitionStep = 0;
            }
            return this._transitionStep;
        };
        Camera.prototype.isFinalStep = function () {
            if (this._isResetting === false) {
                throw new Error("リセット中ではありません。");
            }
            return this._transitionStep === wwa_data.WWAConsts.V_PARTS_NUM_IN_WINDOW - 1;
        };
        Camera.prototype.reset = function (position) {
            this._positionPrev = this._position;
            //            this._position = position.getScreenTopPosition();
            this._position = position.getDefaultCameraPosition();
            this._transitionStep = 0;
            this._isResetting = true;
        };
        return Camera;
    }());
    wwa_camera.Camera = Camera;
})(wwa_camera || (wwa_camera = {}));
/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_input.ts" />
/// <reference path="./wwa_camera.ts" />
/// <reference path="./wwa_main.ts" />
var wwa_cgmanager;
(function (wwa_cgmanager) {
    var Consts = wwa_data.WWAConsts;
    var CacheCanvas = /** @class */ (function () {
        function CacheCanvas(width, height) {
            this.cvs = document.createElement("canvas");
            this.cvs.width = width;
            this.cvs.height = height;
            this.ctx = this.cvs.getContext("2d");
            //document.body.appendChild(this.cvs);
        }
        CacheCanvas.prototype.drawCanvas = function (_image, chipX, chipY, canvasX, canvasY, isSub) {
            if (isSub === void 0) { isSub = false; }
            this.ctx.drawImage(_image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY, Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY, Consts.CHIP_SIZE, Consts.CHIP_SIZE);
        };
        CacheCanvas.prototype.clear = function () {
            this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
        };
        return CacheCanvas;
    }());
    wwa_cgmanager.CacheCanvas = CacheCanvas;
    var CGManager = /** @class */ (function () {
        function CGManager(ctx, ctxSub, fileName, _frameCoord, loadCompleteCallBack) {
            this._isLoaded = false;
            this.mapCache = void 0;
            this.mapCacheYLimit = 0;
            this._ctx = ctx;
            this._ctxSub = ctxSub;
            this._fileName = fileName;
            this._loadCompleteCallBack = loadCompleteCallBack;
            this._load();
            this._frameCoord = _frameCoord.clone();
        }
        CGManager.prototype._load = function () {
            var _this = this;
            this._frameCoord;
            if (this._isLoaded) {
                return;
            }
            this.mapCache = [
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
            ];
            this._image = new Image();
            this._image.addEventListener("load", function () {
                _this.createFrame();
                _this._loadCompleteCallBack();
            });
            this._image.addEventListener("error", function () {
                throw new Error("Image Load Failed!!\nfile name:" + _this._fileName);
            });
            this._image.src = this._fileName;
            this._isLoaded = true;
        };
        CGManager.prototype.createFrame = function () {
            this._frameCanvas = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
            this._backCanvas = new CacheCanvas(Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
            // 左上端
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x, this._frameCoord.y, 0, 0, false);
            // 右上端
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 2, this._frameCoord.y, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, 0, false);
            // 左下端
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x, this._frameCoord.y + 2, 0, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE, false);
            // 右下端
            this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 2, this._frameCoord.y + 2, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE, false);
            for (var i = 1; i < Consts.H_PARTS_NUM_IN_WINDOW - 1; i++) {
                // 上
                this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 1, this._frameCoord.y, Consts.CHIP_SIZE * i, 0, false);
                // 下
                this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 1, this._frameCoord.y + 2, Consts.CHIP_SIZE * i, Consts.MAP_WINDOW_HEIGHT - Consts.CHIP_SIZE, false);
            }
            for (var i = 1; i < Consts.V_PARTS_NUM_IN_WINDOW - 1; i++) {
                // 左
                this._frameCanvas.drawCanvas(this._image, this._frameCoord.x, this._frameCoord.y + 1, 0, Consts.CHIP_SIZE * i, false);
                // 右
                this._frameCanvas.drawCanvas(this._image, this._frameCoord.x + 2, this._frameCoord.y + 1, Consts.MAP_WINDOW_WIDTH - Consts.CHIP_SIZE, Consts.CHIP_SIZE * i, false);
            }
        };
        CGManager.prototype.drawFrame = function () {
            // 全
            //this._ctx.drawImage(this._frameCanvas.cvs,
            //    0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW,
            //    0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
            // 上
            this._ctx.drawImage(this._frameCanvas.cvs, 0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE, 0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE);
            // 下
            this._ctx.drawImage(this._frameCanvas.cvs, 0, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE, 0, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE);
            // 左
            this._ctx.drawImage(this._frameCanvas.cvs, 0, Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2), 0, Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2));
            // 右
            this._ctx.drawImage(this._frameCanvas.cvs, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2), Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 1), Consts.CHIP_SIZE, Consts.CHIP_SIZE, Consts.CHIP_SIZE * (Consts.H_PARTS_NUM_IN_WINDOW - 2));
        };
        CGManager.prototype.drawCanvas = function (chipX, chipY, canvasX, canvasY, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY, Consts.CHIP_SIZE, Consts.CHIP_SIZE, canvasX, canvasY, Consts.CHIP_SIZE, Consts.CHIP_SIZE);
        };
        CGManager.prototype.drawCanvasWithSize = function (chipX, chipY, width, height, canvasX, canvasY, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY, Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height, canvasX, canvasY, Consts.CHIP_SIZE * width, Consts.CHIP_SIZE * height);
        };
        CGManager.prototype.drawCanvasWithUpperYLimit = function (chipX, chipY, canvasX, canvasY, yLimit, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, canvasY + Consts.CHIP_SIZE - yLimit);
            if (delLength >= Consts.CHIP_SIZE) {
                return;
            }
            ctx.drawImage(this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY, Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY, Consts.CHIP_SIZE, Consts.CHIP_SIZE);
        };
        CGManager.prototype.copyBackCanvasWithUpperYLimit = function (chipX, chipY, canvasX, canvasY, yLimit, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, canvasY + Consts.CHIP_SIZE - yLimit);
            if (delLength >= Consts.CHIP_SIZE) {
                return;
            }
            this._backCanvas.ctx.drawImage(this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength, Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength, Consts.CHIP_SIZE, Consts.CHIP_SIZE);
        };
        CGManager.prototype.drawBackCanvas = function (isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            ctx.drawImage(this._backCanvas.cvs, 0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW, 0, 0, Consts.CHIP_SIZE * Consts.V_PARTS_NUM_IN_WINDOW, Consts.CHIP_SIZE * Consts.H_PARTS_NUM_IN_WINDOW);
        };
        CGManager.prototype.clearBackCanvas = function () {
            this._backCanvas.clear();
        };
        CGManager.prototype.drawCanvasWithLowerYLimit = function (chipX, chipY, canvasX, canvasY, yLimit, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            if (!this._isLoaded) {
                throw new Error("No image was loaded.");
            }
            var delLength = Math.max(0, yLimit - canvasY);
            if (delLength >= Consts.CHIP_SIZE) {
                return;
            }
            ctx.drawImage(this._image, Consts.CHIP_SIZE * chipX, Consts.CHIP_SIZE * chipY + delLength, Consts.CHIP_SIZE, Consts.CHIP_SIZE - delLength, canvasX, canvasY + delLength, Consts.CHIP_SIZE, Consts.CHIP_SIZE);
        };
        CGManager.prototype.clearCanvas = function (x, y, w, h, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.clearRect(x, y, w, h);
        };
        CGManager.prototype.drawBase = function (x, y, w, h, isSub) {
            if (isSub === void 0) { isSub = false; }
            var ctx = isSub ? this._ctxSub : this._ctx;
            ctx.fillStyle = "#9E9E9E";
            ctx.fillRect(x, y, w, h);
        };
        return CGManager;
    }());
    wwa_cgmanager.CGManager = CGManager;
})(wwa_cgmanager || (wwa_cgmanager = {}));
/// <reference path="./wwa_main.ts" />
var wwa_util;
(function (wwa_util) {
    wwa_util.$id = function (id) {
        return document.getElementById(id);
    };
    wwa_util.$class = function (className) {
        return document.getElementsByClassName(className);
    };
    wwa_util.$tag = function (tagName) {
        return document.getElementsByTagName(tagName);
    };
    wwa_util.$qs = function (selector) {
        return document.querySelector(selector);
    };
    wwa_util.$qsh = function (selector) {
        return document.querySelector(selector);
    };
    wwa_util.$qsAll = function (selector) {
        return document.querySelectorAll(selector);
    };
    wwa_util.$localPos = function (mouseX, mouseY) {
        var cx, cy;
        var sx = window.pageXOffset ||
            document.body.scrollLeft ||
            document.documentElement.scrollLeft;
        var sy = window.pageYOffset ||
            document.body.scrollTop ||
            document.documentElement.scrollTop;
        cx = mouseX - wwa_util.$id("wwa-wrapper").offsetLeft + sx;
        cy = mouseY - wwa_util.$id("wwa-wrapper").offsetTop + sy;
        return new wwa_data.Coord(cx, cy);
    };
    // FIXME: この実装、大丈夫？
    wwa_util.$escapedURI = function (uri) {
        if (uri.match(/^https?:\/\//) || uri.match(/^\.\.\//)) {
            return uri;
        }
        else {
            return location.href = "./" + uri;
        }
    };
    wwa_util.arr2str4save = function (x) {
        var txt = "";
        if (x instanceof Array) {
            for (var i = 0; i < x.length; i++) {
                txt += (wwa_util.arr2str4save(x[i]) + "/");
            }
            return txt;
        }
        else {
            return x + "";
        }
    };
})(wwa_util || (wwa_util = {}));
/// <reference path="./wwa_data.ts" />
var wwa_message;
(function (wwa_message) {
    var MessageInfo = /** @class */ (function () {
        function MessageInfo(message, isSystemMessage, isEndOfPartsEvent, macro) {
            this.message = message;
            this.isSystemMessage = isSystemMessage;
            this.isEndOfPartsEvent = isEndOfPartsEvent;
            this.macro = macro;
            if (this.macro === void 0) {
                this.macro = [];
            }
        }
        return MessageInfo;
    }());
    wwa_message.MessageInfo = MessageInfo;
    function strArrayToMessageInfoArray(strArray, isSystemMessage) {
        var newq = [];
        strArray.forEach(function (s) {
            newq.push(new MessageInfo(s, isSystemMessage));
        });
        return newq;
    }
    wwa_message.strArrayToMessageInfoArray = strArrayToMessageInfoArray;
    var Macro = /** @class */ (function () {
        function Macro(_wwa, _triggerPartsID, _triggerPartsType, _triggerPartsPosition, macroType, macroArgs) {
            this._wwa = _wwa;
            this._triggerPartsID = _triggerPartsID;
            this._triggerPartsType = _triggerPartsType;
            this._triggerPartsPosition = _triggerPartsPosition;
            this.macroType = macroType;
            this.macroArgs = macroArgs;
        }
        Macro.prototype.execute = function () {
            try {
                if (this.macroType === wwa_data.MacroType.IMGPLAYER) {
                    this._executeImgPlayerMacro();
                }
                else if (this.macroType === wwa_data.MacroType.IMGYESNO) {
                    this._executeImgYesNoMacro();
                }
                else if (this.macroType === wwa_data.MacroType.HPMAX) {
                    this._executeHPMaxMacro();
                }
                else if (this.macroType === wwa_data.MacroType.SAVE) {
                    this._executeSaveMacro();
                }
                else if (this.macroType === wwa_data.MacroType.ITEM) {
                    this._executeItemMacro();
                }
                else if (this.macroType === wwa_data.MacroType.DEFAULT) {
                    this._executeDefaultMacro();
                }
                else if (this.macroType === wwa_data.MacroType.OLDMAP) {
                    this._executeOldMapMacro();
                }
                else if (this.macroType === wwa_data.MacroType.PARTS) {
                    this._executePartsMacro();
                }
                else if (this.macroType === wwa_data.MacroType.MOVE) {
                    this._executeMoveMacro();
                }
                else if (this.macroType === wwa_data.MacroType.MAP) {
                    this._executeMapMacro();
                }
                else if (this.macroType === wwa_data.MacroType.DIRMAP) {
                    this._executeDirMapMacro();
                }
                else if (this.macroType === wwa_data.MacroType.IMGFRAME) {
                    this._executeImgFrameMacro();
                }
                else if (this.macroType === wwa_data.MacroType.IMGBOM) {
                    this._executeImgBomMacro();
                }
                else if (this.macroType === wwa_data.MacroType.DELPLAYER) {
                    this._executeDelPlayerMacro();
                }
                else if (this.macroType === wwa_data.MacroType.FACE) {
                    this._executeFaceMacro();
                }
                else if (this.macroType === wwa_data.MacroType.EFFECT) {
                    this._executeEffectMacro();
                }
                else if (this.macroType === wwa_data.MacroType.GAMEOVER) {
                    this._executeGameOverMacro();
                }
                else if (this.macroType === wwa_data.MacroType.IMGCLICK) {
                    this._executeImgClickMacro();
                }
                else if (this.macroType === wwa_data.MacroType.STATUS) {
                    this._executeStatusMacro();
                }
                else if (this.macroType === wwa_data.MacroType.COLOR) {
                    this._executeColorMacro();
                }
                else if (this.macroType === wwa_data.MacroType.WAIT) {
                    this._executeWaitMacro();
                }
                else if (this.macroType === wwa_data.MacroType.SOUND) {
                    this._executeSoundMacro();
                }
            }
            catch (e) {
                // デベロッパーモードならエラーを吐くとかしたいね
            }
        };
        Macro.prototype._concatEmptyArgs = function (requiredLength) {
            if (this.macroArgs.length < requiredLength) {
                var ap = new Array(requiredLength - this.macroArgs.length);
                for (var i = 0; i < ap.length; i++) {
                    ap[i] = "";
                }
                this.macroArgs = this.macroArgs.concat(ap);
            }
        };
        Macro.prototype._parseInt = function (argIndex, fallback) {
            if (fallback === void 0) { fallback = 0; }
            var x = parseInt(this.macroArgs[argIndex]);
            if (isNaN(x)) {
                return fallback;
            }
            return x;
        };
        Macro.prototype._executeImgPlayerMacro = function () {
            this._concatEmptyArgs(2);
            var x = this._parseInt(0);
            var y = this._parseInt(1);
            this._wwa.setPlayerImgCoord(new wwa_data.Coord(x, y));
        };
        Macro.prototype._executeImgYesNoMacro = function () {
            this._concatEmptyArgs(2);
            var x = this._parseInt(0);
            var y = this._parseInt(1);
            this._wwa.setYesNoImgCoord(new wwa_data.Coord(x, y));
        };
        Macro.prototype._executeHPMaxMacro = function () {
            this._concatEmptyArgs(1);
            var hpmax = Math.max(0, this._parseInt(0));
            this._wwa.setPlayerEnergyMax(hpmax);
        };
        Macro.prototype._executeSaveMacro = function () {
            this._concatEmptyArgs(1);
            var disableSaveFlag = !!this._parseInt(0);
            this._wwa.disableSave(disableSaveFlag);
        };
        Macro.prototype._executeItemMacro = function () {
            this._concatEmptyArgs(2);
            var pos = this._parseInt(0);
            var id = this._parseInt(1);
            this._wwa.setPlayerGetItem(pos, id);
        };
        Macro.prototype._executeDefaultMacro = function () {
            this._concatEmptyArgs(1);
            var defaultFlag = !!this._parseInt(0);
            this._wwa.setObjectNotCollapseOnPartsOnPlayer(defaultFlag);
        };
        Macro.prototype._executeOldMapMacro = function () {
            this._concatEmptyArgs(1);
            var oldMapFlag = !!this._parseInt(0);
            this._wwa.setOldMap(oldMapFlag);
        };
        Macro.prototype._executePartsMacro = function () {
            this._concatEmptyArgs(4);
            var srcID = this._parseInt(0);
            var destID = this._parseInt(1);
            var partsType = this._parseInt(2, wwa_data.PartsType.OBJECT);
            var onlyThisSight = this._parseInt(3);
            if (partsType !== wwa_data.PartsType.OBJECT && partsType !== wwa_data.PartsType.MAP) {
                throw new Error("パーツ種別が不明です");
            }
            if (onlyThisSight !== 0 && onlyThisSight !== 1) {
                // fallback
                onlyThisSight = 1;
            }
            if (srcID < 0 || destID < 0) {
                throw new Error("パーツ番号が不正です");
            }
            if (partsType === wwa_data.PartsType.OBJECT) {
                if (srcID >= this._wwa.getObjectPartsNum() || destID >= this._wwa.getObjectPartsNum()) {
                    throw new Error("パーツ番号が不正です");
                }
            }
            else {
                if (srcID >= this._wwa.getMapPartsNum() || destID >= this._wwa.getMapPartsNum()) {
                    throw new Error("パーツ番号が不正です");
                }
            }
            this._wwa.replaceParts(srcID, destID, partsType, !!onlyThisSight);
        };
        Macro.prototype._executeMoveMacro = function () {
            this._concatEmptyArgs(1);
            var moveNum = this._parseInt(0);
            this._wwa.setMoveMacroWaitingToPlayer(moveNum);
        };
        Macro.prototype._executeMapMacro = function () {
            this._concatEmptyArgs(4);
            var partsID = this._parseInt(0);
            var xstr = this.macroArgs[1];
            var ystr = this.macroArgs[2];
            var partsType = this._parseInt(3, wwa_data.PartsType.OBJECT);
            if (partsID < 0) {
                throw new Error("パーツ番号が不正です");
            }
            if (partsType === wwa_data.PartsType.OBJECT) {
                if (partsID >= this._wwa.getObjectPartsNum()) {
                    throw new Error("パーツ番号が不正です");
                }
            }
            else {
                if (partsID >= this._wwa.getMapPartsNum()) {
                    throw new Error("パーツ番号が不正です");
                }
            }
            this._wwa.appearPartsEval(this._triggerPartsPosition, xstr, ystr, partsID, partsType);
        };
        Macro.prototype._executeDirMapMacro = function () {
            this._concatEmptyArgs(3);
            var partsID = this._parseInt(0);
            var dist = this._parseInt(1);
            var partsType = this._parseInt(2, wwa_data.PartsType.OBJECT);
            if (isNaN(partsID) || isNaN(dist) || isNaN(partsType)) {
                throw new Error("引数が整数ではありません");
            }
            if (partsID < 0) {
                throw new Error("パーツ番号が不正です");
            }
            if (partsType === wwa_data.PartsType.OBJECT) {
                if (partsID >= this._wwa.getObjectPartsNum()) {
                    throw new Error("パーツ番号が不正です");
                }
            }
            else {
                if (partsID >= this._wwa.getMapPartsNum()) {
                    throw new Error("パーツ番号が不正です");
                }
            }
            this._wwa.appearPartsByDirection(dist, partsID, partsType);
        };
        Macro.prototype._executeImgFrameMacro = function () {
            this._concatEmptyArgs(3);
            var type = this._parseInt(0);
            var posX = this._parseInt(1);
            var posY = this._parseInt(2);
            var x = posX * wwa_data.WWAConsts.CHIP_SIZE;
            var y = posY * wwa_data.WWAConsts.CHIP_SIZE;
            if (posX < 0 || posY < 0) {
                throw new Error("座標は正でなければなりません。");
            }
            if (type === wwa_data.MacroImgFrameIndex.ENERGY) {
                var iconNode_energy = wwa_util.$qsh("#disp-energy>.status-icon");
                iconNode_energy.style.backgroundPosition = "-" + x + "px -" + y + "px";
            }
            else if (type === wwa_data.MacroImgFrameIndex.STRENGTH) {
                var iconNode_strength = wwa_util.$qsh("#disp-strength>.status-icon");
                iconNode_strength.style.backgroundPosition = "-" + x + "px -" + y + "px";
            }
            else if (type === wwa_data.MacroImgFrameIndex.DEFENCE) {
                var iconNode_defence = wwa_util.$qsh("#disp-defence>.status-icon");
                iconNode_defence.style.backgroundPosition = "-" + x + "px -" + y + "px";
            }
            else if (type === wwa_data.MacroImgFrameIndex.GOLD) {
                var iconNode_gold = wwa_util.$qsh("#disp-gold>.status-icon");
                iconNode_gold.style.backgroundPosition = "-" + x + "px -" + y + "px";
            }
            else if (type === wwa_data.MacroImgFrameIndex.WIDE_CELL_ROW) {
                Array.prototype.forEach.call(wwa_util.$qsAll("div.wide-cell-row"), function (node) {
                    node.style.backgroundPosition = "-" + x + "px -" + y + "px";
                });
            }
            else if (type === wwa_data.MacroImgFrameIndex.ITEM_BG) {
                Array.prototype.forEach.call(wwa_util.$qsAll("div.item-cell"), function (node) {
                    node.style.backgroundPosition = "-" + x + "px -" + y + "px";
                });
            }
            else if (type === wwa_data.MacroImgFrameIndex.MAIN_FRAME) {
                this._wwa.setFrameCoord(new wwa_data.Coord(posX, posY));
            }
            else {
                throw new Error("種別が不正です。");
            }
        };
        Macro.prototype._executeImgBomMacro = function () {
            this._concatEmptyArgs(2);
            var posX = this._parseInt(0);
            var posY = this._parseInt(1);
            if (posX < 0 || posY < 0) {
                throw new Error("座標は正でなければなりません。");
            }
            this._wwa.setBattleEffectCoord(new wwa_data.Coord(posX, posY));
        };
        Macro.prototype._executeDelPlayerMacro = function () {
            this._concatEmptyArgs(1);
            var flag = parseInt(this.macroArgs[0]);
            this._wwa.setDelPlayer(!!flag);
        };
        Macro.prototype._executeFaceMacro = function () {
            this._concatEmptyArgs(6);
            var destPosX = this._parseInt(0);
            var destPosY = this._parseInt(1);
            var srcPosX = this._parseInt(2);
            var srcPosY = this._parseInt(3);
            var srcWidth = this._parseInt(4);
            var srcHeight = this._parseInt(5);
            var face;
            if (destPosX < 0 || destPosY < 0 ||
                srcPosX < 0 || srcPosY < 0 ||
                srcWidth < 0 || srcHeight < 0) {
                throw new Error("各引数は0以上の整数でなければなりません。");
            }
            face = new wwa_data.Face(new wwa_data.Coord(destPosX, destPosY), new wwa_data.Coord(srcPosX, srcPosY), new wwa_data.Coord(srcWidth, srcHeight));
            this._wwa.addFace(face);
        };
        Macro.prototype._executeEffectMacro = function () {
            this._concatEmptyArgs(1);
            var waitTime = this._parseInt(0);
            if (waitTime < 0) {
                throw new Error("待ち時間は0以上の整数でなければなりません。");
            }
            if (waitTime === 0) {
                this._wwa.stopEffect();
            }
            var coords = [];
            for (var i = 1; i < this.macroArgs.length; i += 2) {
                var cropX = this._parseInt(i);
                var cropY = 0;
                if (cropX < 0) {
                    throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
                }
                if (i + 1 === this.macroArgs.length) {
                    throw new Error("画像のパーツ座標指定で、Y座標が指定されていません。");
                }
                cropY = this._parseInt(i + 1);
                if (cropY < 0) {
                    throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
                }
                coords.push(new wwa_data.Coord(cropX, cropY));
            }
            this._wwa.setEffect(waitTime, coords);
        };
        Macro.prototype._executeGameOverMacro = function () {
            this._concatEmptyArgs(2);
            var x = this._parseInt(0);
            var y = this._parseInt(1);
            if (x < 0 || x >= this._wwa.getMapWidth() || y < 0 || y >= this._wwa.getMapWidth()) {
                throw new Error("マップの範囲外が指定されています!");
            }
            this._wwa.setGameOverPosition(new wwa_data.Coord(x, y));
        };
        Macro.prototype._executeImgClickMacro = function () {
            this._concatEmptyArgs(2);
            if (this.macroArgs.length < 1) {
                throw new Error("引数が少なすぎます");
            }
            var x = this._parseInt(0);
            var y = this._parseInt(1);
            if (x < 0 || y < 0) {
                throw new Error("引数が0以上の整数ではありません");
            }
            this._wwa.setImgClick(new wwa_data.Coord(x, y));
        };
        Macro.prototype._executeStatusMacro = function () {
            this._concatEmptyArgs(2);
            var type = this._parseInt(0);
            var value = this._parseInt(1);
            if (type < 0 || 4 < type) {
                throw new Error("ステータス種別が範囲外です。");
            }
            this._wwa.setPlayerStatus(type, value);
        };
        Macro.prototype._executeColorMacro = function () {
            this._concatEmptyArgs(4);
            var type = this._parseInt(0);
            var r = this._parseInt(1);
            var g = this._parseInt(2);
            var b = this._parseInt(3);
            if (type < 0 || type > 5) {
                throw new Error("種別は0から5までです");
            }
            if (r < 0 || r > 255 ||
                g < 0 || g > 255 ||
                b < 0 || b > 255) {
                throw new Error("色が範囲外です");
            }
            this._wwa.changeStyleRule(type, r, g, b);
        };
        Macro.prototype._executeWaitMacro = function () {
            // 動作が不安定なので、実装しないことになりました。
            throw new Error("Not implemented!");
            /*
            if (this.macroArgs.length < 1) {
                throw new Error("引数が少なすぎます");
            }
            var t = parseInt(this.macroArgs[0]);
            if (isNaN(t)) {
                throw new Error("引数が整数ではありません");
            }
            if (t < 0) {
                throw new Error("待ち時間が正ではありません");
            }
            this._wwa.setWaitTime( t );
            */
        };
        Macro.prototype._executeSoundMacro = function () {
            this._concatEmptyArgs(1);
            var id = parseInt(this.macroArgs[0]);
            this._wwa.playSound(id);
        };
        return Macro;
    }());
    wwa_message.Macro = Macro;
    function parseMacro(wwa, partsID, partsType, position, macroStr) {
        var matchInfo = macroStr.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\=(.*)$/);
        if (matchInfo === null || matchInfo.length !== 3) {
            throw new Error("マクロではありません");
        }
        var macroType = matchInfo[1];
        var macroIndex = wwa_data.macrotable["$" + macroType.toLowerCase()];
        if (macroIndex === void 0) {
            // undefined macro
            return new Macro(wwa, partsID, partsType, position, wwa_data.MacroType.UNDEFINED, matchInfo[2].split(","));
        }
        return new Macro(wwa, partsID, partsType, position, macroIndex, matchInfo[2].split(",").map(function (e) { return e.trim(); }));
    }
    wwa_message.parseMacro = parseMacro;
    var TextWindow = /** @class */ (function () {
        function TextWindow(_wwa, _coord, _width, _height, _isVisible, _parentElement, zIndex) {
            this._wwa = _wwa;
            this._coord = _coord;
            this._width = _width;
            this._height = _height;
            this._isVisible = _isVisible;
            this._parentElement = _parentElement;
            this._element = document.createElement("div");
            this._element.style.position = "absolute";
            this._element.style.borderWidth = "2px";
            this._element.style.borderStyle = "solid";
            if (_wwa.isClassicMode()) {
                this._element.style.borderRadius = "15px";
            }
            else {
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
        TextWindow.prototype.update = function (a) {
            /* サブクラスで実装してください。*/
        };
        TextWindow.prototype.show = function () {
            this._isVisible = true;
            this._element.style.display = "block";
            this.update();
        };
        TextWindow.prototype.hide = function () {
            this._isVisible = false;
            this._element.style.display = "none";
            this.update();
        };
        TextWindow.prototype.isVisible = function () {
            return this._isVisible;
        };
        return TextWindow;
    }());
    var MosterWindow = /** @class */ (function (_super) {
        __extends(MosterWindow, _super);
        function MosterWindow(wwa, coord, width, height, isVisible, parentElement, _cgFileName) {
            var _this = _super.call(this, wwa, new wwa_data.Coord(coord.x, coord.y), width, height, isVisible, parentElement, 201) || this;
            _this._cgFileName = _cgFileName;
            _this._monsterBox = document.createElement("div");
            _this._monsterBox.style.width = wwa_data.WWAConsts.CHIP_SIZE + "px";
            _this._monsterBox.style.height = wwa_data.WWAConsts.CHIP_SIZE + "px";
            _this._monsterBox.style.position = "absolute";
            _this._monsterBox.style.left = "10px";
            _this._monsterBox.style.top = "10px";
            _this._monsterBox.style.backgroundImage = "url(" + _this._cgFileName.replace("(", "\\(").replace(")", "\\)") + ")";
            _this._monsterBox.style.backgroundPosition = "0 0";
            _this._element.appendChild(_this._monsterBox);
            _this._energyBox = document.createElement("div");
            _this._energyBox.style.position = "absolute";
            _this._energyBox.style.left = "80px";
            _this._energyBox.style.top = "10px";
            _this._energyBox.textContent = "生命力 0";
            _this._element.appendChild(_this._energyBox);
            _this._strengthBox = document.createElement("div");
            _this._strengthBox.style.position = "absolute";
            _this._strengthBox.style.left = "80px";
            _this._strengthBox.style.top = "30px";
            _this._strengthBox.textContent = "攻撃力 0";
            _this._element.appendChild(_this._strengthBox);
            _this._defenceBox = document.createElement("div");
            _this._defenceBox.style.position = "absolute";
            _this._defenceBox.style.left = "180px";
            _this._defenceBox.style.top = "30px";
            _this._defenceBox.textContent = "防御力 0";
            _this._element.appendChild(_this._defenceBox);
            if (_this._isVisible) {
                _this._element.style.display = "block";
            }
            else {
                _this._element.style.display = "none";
            }
            return _this;
        }
        MosterWindow.prototype.update = function (monster) {
            if (monster !== void 0) {
                this._monsterBox.style.backgroundPosition =
                    "-" + monster.imgCoord.x + "px -" + monster.imgCoord.y + "px";
                this._energyBox.textContent = "生命力 " + monster.status.energy;
                this._strengthBox.textContent = "攻撃力 " + monster.status.strength;
                this._defenceBox.textContent = "防御力 " + monster.status.defence;
            }
        };
        return MosterWindow;
    }(TextWindow));
    wwa_message.MosterWindow = MosterWindow;
    var ScoreWindow = /** @class */ (function (_super) {
        __extends(ScoreWindow, _super);
        function ScoreWindow(wwa, coord, isVisible, parentElement) {
            var _this = this;
            if (wwa.isClassicMode()) {
                _this = _super.call(this, wwa, new wwa_data.Coord(wwa_data.WWAConsts.CHIP_SIZE * 2, 30), wwa_data.WWAConsts.CHIP_SIZE * 7, 40, isVisible, parentElement, 202) || this;
                _this._element.style.borderWidth = "0";
                _this._element.style.borderRadius = "4px";
                _this._element.style.fontSize = "20px";
                _this._element.style.lineHeight = "40px";
            }
            else {
                _this = _super.call(this, wwa, new wwa_data.Coord(coord.x, coord.y), 340, 30, isVisible, parentElement, 202) || this;
            }
            _this._element.style.textAlign = "center";
            if (_this._isVisible) {
                _this._element.style.display = "block";
            }
            else {
                _this._element.style.display = "none";
            }
            _this.update(0);
            return _this;
        }
        ScoreWindow.prototype.update = function (score) {
            if (score !== void 0) {
                this._element.textContent = "Score: " + score;
            }
        };
        return ScoreWindow;
    }(TextWindow));
    wwa_message.ScoreWindow = ScoreWindow;
    var Positioning;
    (function (Positioning) {
        Positioning[Positioning["TOP"] = 0] = "TOP";
        Positioning[Positioning["CENTER"] = 1] = "CENTER";
        Positioning[Positioning["BOTTOM"] = 2] = "BOTTOM";
        Positioning[Positioning["SCORE"] = 3] = "SCORE";
    })(Positioning = wwa_message.Positioning || (wwa_message.Positioning = {}));
    var MessageWindow /* implements TextWindow(予定)*/ = /** @class */ (function () {
        function MessageWindow(wwa, x, y, width, height, message, cgFileName, isVisible, isYesno, isItemMenu, parentElement) {
            var thisA = this;
            var escapedFilename = cgFileName.replace("(", "\\(").replace(")", "\\)");
            this._wwa = wwa;
            this._cgFileName = cgFileName;
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
            this._message = message;
            this._isVisible = isVisible;
            this._isYesno = isYesno;
            this._isItemMenu = isItemMenu;
            this._element = document.createElement("div");
            this._element.id = "wwa-text-message-window";
            this._element.style.position = "absolute";
            this._element.style.borderWidth = "2px";
            this._element.style.borderStyle = "solid";
            if (wwa.isClassicMode()) {
                this._element.style.borderRadius = "15px";
            }
            else {
                this._element.style.borderRadius = "10px";
            }
            this._element.classList.add("wwa-message-window");
            this._element.style.zIndex = "400";
            this._msgWrapperElement = document.createElement("div");
            this._msgWrapperElement.style.textAlign = "left";
            this._msgWrapperElement.style.wordWrap = "break-word";
            if (wwa.isClassicMode()) {
                this._msgWrapperElement.style.margin = "8px 0 8px 16px";
            }
            else {
                this._msgWrapperElement.style.margin = "0";
                this._msgWrapperElement.style.padding = "7px";
            }
            this._element.appendChild(this._msgWrapperElement);
            this._dummyElement = document.createElement("div");
            this._dummyElement.style.display = "none";
            this._dummyElement.style.padding = "0";
            this._dummyElement.style.margin = "0";
            this._dummyElement.style.height = "55px";
            this._element.appendChild(this._dummyElement);
            this._ynWrapperElement = document.createElement("div");
            this._ynWrapperElement.style.padding = "0";
            this._ynWrapperElement.style.margin = "0";
            this._ynWrapperElement.style.position = "absolute";
            this._ynWrapperElement.style.left = "246px";
            this._ynWrapperElement.style.bottom = "10px";
            this._ynWrapperElement.style.width = "80px";
            this._ynWrapperElement.style.height = "40px";
            this._ynWrapperElement.style.zIndex = "10";
            this._element.appendChild(this._ynWrapperElement);
            this._parentElement = parentElement;
            this._parentElement.appendChild(this._element);
            this._divYesElement = document.createElement("div");
            this._divYesElement.style.padding = "0";
            this._divYesElement.style.margin = "0";
            this._divYesElement.style.cssFloat = "left";
            this._divYesElement.style.width = "40px";
            this._divYesElement.style.height = "40px";
            this._divYesElement.style.background =
                "url(" + escapedFilename + ")";
            this._divYesElement.onclick = function () {
                if (!thisA._isInputDisable) {
                    wwa.setYesNoInput(wwa_data.YesNoState.YES);
                    thisA.update();
                }
            };
            this._divYesElement.style.cursor = "pointer";
            this._divNoElement = document.createElement("div");
            this._divNoElement.style.padding = "0";
            this._divNoElement.style.margin = "0";
            this._divNoElement.style.cssFloat = "left";
            this._divNoElement.style.width = "40px";
            this._divNoElement.style.height = "40px";
            this._divNoElement.style.background =
                "url(" + escapedFilename + ")";
            this._divNoElement.onclick = function () {
                if (!thisA._isInputDisable) {
                    wwa.setYesNoInput(wwa_data.YesNoState.NO);
                    thisA.update();
                }
            };
            this._divNoElement.style.cursor = "pointer";
            this._ynWrapperElement.appendChild(this._divYesElement);
            this._ynWrapperElement.appendChild(this._divNoElement);
            thisA._isInputDisable = false;
            this.update();
        }
        MessageWindow.prototype.setPosition = function (x, y, width, height) {
            this._x = x;
            this._y = y;
            this._width = width;
            this._height = height;
            this.update();
        };
        MessageWindow.prototype.setPositionByPlayerPosition = function (existsFaces, existsScoreWindow, displayCenter, playerPos, cameraPos) {
            var playerInScreenY = playerPos.getPartsCoord().substract(cameraPos.getPartsCoord()).y;
            var pos;
            if (existsFaces) {
                pos = wwa_message.Positioning.BOTTOM;
            }
            else if (existsScoreWindow) {
                pos = wwa_message.Positioning.SCORE;
            }
            else if (displayCenter) {
                pos = wwa_message.Positioning.CENTER;
            }
            else if (playerInScreenY >= Math.ceil(wwa_data.WWAConsts.V_PARTS_NUM_IN_WINDOW / 2)) {
                pos = wwa_message.Positioning.TOP;
            }
            else {
                pos = wwa_message.Positioning.BOTTOM;
            }
            this.setPositionEasy(pos);
        };
        MessageWindow.prototype.setPositionEasy = function (pos) {
            var centerPos = Math.floor(this._element.clientHeight / 2);
            if (pos === Positioning.CENTER) {
                this._y = wwa_data.WWAConsts.MAP_WINDOW_HEIGHT / 2 - centerPos;
                this.update();
                return;
            }
            if (pos === Positioning.TOP) {
                this._y = Math.max(20, wwa_data.WWAConsts.MAP_WINDOW_HEIGHT / 4 - centerPos) + 10;
                this.update();
                return;
            }
            if (pos === Positioning.BOTTOM) {
                this._y = Math.min(wwa_data.WWAConsts.MAP_WINDOW_HEIGHT - 20 - this._element.clientHeight, wwa_data.WWAConsts.MAP_WINDOW_HEIGHT * 3 / 4 - centerPos);
                this.update();
                return;
            }
            if (pos === Positioning.SCORE) {
                this._y = 80;
                this.update();
                return;
            }
        };
        MessageWindow.prototype.setMessage = function (message) {
            this._message = message;
            this.update();
        };
        MessageWindow.prototype.setYesNoChoice = function (isYesNo) {
            this._isInputDisable = false;
            this._isYesno = isYesNo;
            this.update();
            return this._isYesno;
        };
        MessageWindow.prototype.isYesNoChoice = function () {
            return this._isYesno;
        };
        MessageWindow.prototype.setItemMenuChoice = function (isItemMenu) {
            this._isInputDisable = false;
            this._isItemMenu = isItemMenu;
            this.update();
            return this._isItemMenu;
        };
        MessageWindow.prototype.isItemMenuChoice = function () {
            return this._isItemMenu;
        };
        MessageWindow.prototype.setInputDisable = function () {
            this._isInputDisable = true;
        };
        MessageWindow.prototype.isInputDisable = function () {
            return this._isInputDisable;
        };
        MessageWindow.prototype.show = function () {
            this._isVisible = true;
            this.update();
        };
        MessageWindow.prototype.hide = function () {
            this._isVisible = false;
            this.update();
        };
        MessageWindow.prototype.isVisible = function () {
            return this._isVisible;
        };
        MessageWindow.prototype.isWideChar = function (char) {
            return (char.match(/^[^\x01-\x7E\xA1-\xDF]+$/) !== null);
        };
        MessageWindow.prototype.update = function () {
            var _this = this;
            var base = this._wwa.getYesNoImgCoord();
            if (this._isYesno) {
                if (this._wwa.getYesNoState() === wwa_data.YesNoState.YES) {
                    this._divYesElement.style.backgroundPosition =
                        "-" + (base.x + wwa_data.WWAConsts.IMGRELPOS_YESNO_YESP_X) * wwa_data.WWAConsts.CHIP_SIZE + "px " +
                            "-" + (base.y * wwa_data.WWAConsts.CHIP_SIZE) + "px";
                    this._divNoElement.style.backgroundPosition =
                        "-" + (base.x + wwa_data.WWAConsts.IMGRELPOS_YESNO_NO_X) * wwa_data.WWAConsts.CHIP_SIZE + "px " +
                            "-" + (base.y * wwa_data.WWAConsts.CHIP_SIZE) + "px";
                }
                else if (this._wwa.getYesNoState() === wwa_data.YesNoState.NO) {
                    this._divYesElement.style.backgroundPosition =
                        "-" + (base.x + wwa_data.WWAConsts.IMGRELPOS_YESNO_YES_X) * wwa_data.WWAConsts.CHIP_SIZE + "px " +
                            "-" + (base.y * wwa_data.WWAConsts.CHIP_SIZE) + "px";
                    this._divNoElement.style.backgroundPosition =
                        "-" + (base.x + wwa_data.WWAConsts.IMGRELPOS_YESNO_NOP_X) * wwa_data.WWAConsts.CHIP_SIZE + "px " +
                            "-" + (base.y * wwa_data.WWAConsts.CHIP_SIZE) + "px";
                }
                else {
                    this._divYesElement.style.backgroundPosition =
                        "-" + (base.x + wwa_data.WWAConsts.IMGRELPOS_YESNO_YES_X) * wwa_data.WWAConsts.CHIP_SIZE + "px " +
                            "-" + (base.y * wwa_data.WWAConsts.CHIP_SIZE) + "px";
                    this._divNoElement.style.backgroundPosition =
                        "-" + (base.x + wwa_data.WWAConsts.IMGRELPOS_YESNO_NO_X) * wwa_data.WWAConsts.CHIP_SIZE + "px " +
                            "-" + (base.y * wwa_data.WWAConsts.CHIP_SIZE) + "px";
                }
                this._ynWrapperElement.style.display = "block";
            }
            else {
                this._ynWrapperElement.style.display = "none";
            }
            this._msgWrapperElement.textContent = "";
            var mesArray = this._message.split("\n");
            mesArray.forEach(function (line, i) {
                var lsp = document.createElement("span"); // Logical SPan
                if (_this._wwa.isClassicMode()) {
                    var count = 0, lineStr = "";
                    for (var j = 0; j < mesArray[i].length || count != 0; j++) {
                        if (_this.isWideChar(mesArray[i].charAt(j))) {
                            count += 2; // 全角の場合
                        }
                        else {
                            count += 1; // 半角の場合
                        }
                        lineStr += mesArray[i].charAt(j);
                        if (count + 1 > wwa_data.WWAConsts.MSG_STR_WIDTH * 2) {
                            if (mesArray[i].charAt(j + 1) === "。" || mesArray[i].charAt(j + 1) === "、") {
                                lineStr += mesArray[i].charAt(j + 1); // 句読点の場合は行末に入れる
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
                }
                else {
                    lsp.textContent = mesArray[i];
                }
                _this._msgWrapperElement.appendChild(lsp);
                _this._msgWrapperElement.appendChild(document.createElement("br"));
            });
            if (this._isVisible) {
                this._element.style.left = this._x + "px";
                this._element.style.top = this._y + "px";
            }
            else {
                // HACK: display: none;にしてもいいのだが、そうすると、
                // 裏方でclientHeight(プレイヤー座標から位置を決定する時に必要!!)が取得できなくなる。
                this._element.style.left = "-999999px";
                this._element.style.top = "-999999px";
            }
            this._element.style.width = this._width + "px";
            this._element.style.minHeight = this._height + "px"; // minなのでoverflowしても安心!!!
            this._dummyElement.style.display = this._isYesno ? "block" : "none";
            //            this._element.style.display = this._isVisible ? "block" : "none";
        };
        return MessageWindow;
    }());
    wwa_message.MessageWindow = MessageWindow;
})(wwa_message || (wwa_message = {}));
/// <reference path="./wwa_main.ts" />
var wwa_monster;
(function (wwa_monster) {
    var Monster = /** @class */ (function () {
        function Monster(_partsID, _position, _imgCoord, _status, _message, _item, _battleEndCallback) {
            this._partsID = _partsID;
            this._position = _position;
            this._imgCoord = _imgCoord;
            this._status = _status;
            this._message = _message;
            this._item = _item;
            this._battleEndCallback = _battleEndCallback;
        }
        Object.defineProperty(Monster.prototype, "partsID", {
            get: function () { return this._partsID; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Monster.prototype, "position", {
            get: function () { return this._position; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Monster.prototype, "imgCoord", {
            get: function () { return this._imgCoord; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Monster.prototype, "status", {
            get: function () { return this._status; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Monster.prototype, "message", {
            get: function () { return this._message; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Monster.prototype, "item", {
            get: function () { return this._item; },
            enumerable: true,
            configurable: true
        });
        Monster.prototype.damage = function (amount) {
            this._status.energy = Math.max(0, this._status.energy - amount);
        };
        Monster.prototype.battleEndProcess = function () {
            this._battleEndCallback();
        };
        return Monster;
    }());
    wwa_monster.Monster = Monster;
})(wwa_monster || (wwa_monster = {}));
/// <reference path="./wwa_data.ts" />
var wwa_motion;
(function (wwa_motion) {
    var ObjectMovingData = /** @class */ (function () {
        function ObjectMovingData(_player, _objectID, _srcPos, _destPos, _dir) {
            this._player = _player;
            this._objectID = _objectID;
            this._srcPos = _srcPos;
            this._destPos = _destPos;
            this._dir = _dir;
            this._currentPos = this._srcPos.clone();
        }
        ObjectMovingData.prototype.update = function () {
            var speedIndex = this._player.getSpeedIndex();
            this._currentPos = this._currentPos.getNextFramePosition(this._dir, wwa_data.speedList[speedIndex], wwa_data.speedList[speedIndex]);
            return this._currentPos;
        };
        Object.defineProperty(ObjectMovingData.prototype, "isAchievedDestination", {
            get: function () {
                return this._currentPos.equals(this._destPos);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectMovingData.prototype, "currentPosition", {
            get: function () {
                return this._currentPos;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectMovingData.prototype, "beforePosition", {
            get: function () {
                return this._srcPos;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectMovingData.prototype, "destination", {
            get: function () {
                return this._destPos;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectMovingData.prototype, "objID", {
            get: function () {
                return this._objectID;
            },
            enumerable: true,
            configurable: true
        });
        return ObjectMovingData;
    }());
    wwa_motion.ObjectMovingData = ObjectMovingData;
    var ObjectMovingDataManager = /** @class */ (function () {
        // TODO: シングルトンにする
        function ObjectMovingDataManager(_wwa, _player) {
            this._wwa = _wwa;
            this._player = _player;
            this.clear();
        }
        ObjectMovingDataManager.prototype.add = function (objectID, srcPos, destPos, dir) {
            this._queue.push(new ObjectMovingData(this._player, objectID, srcPos, destPos, dir));
        };
        //  動き終わったオブジェクトからなる配列を返します。
        ObjectMovingDataManager.prototype.update = function () {
            var endObjects = [];
            var continueObjects = [];
            for (var i = 0; i < this._queue.length; i++) {
                this._queue[i].update();
                if (this._queue[i].isAchievedDestination) {
                    endObjects.push(this._queue[i]);
                    this._wwa.setPartsOnPosition(wwa_data.PartsType.OBJECT, 0, this._queue[i].beforePosition.getPartsCoord());
                    this._wwa.setPartsOnPosition(wwa_data.PartsType.OBJECT, this._queue[i].objID, this._queue[i].destination.getPartsCoord());
                }
                else {
                    continueObjects.push(this._queue[i]);
                }
            }
            this._queue = continueObjects;
            return endObjects;
        };
        ObjectMovingDataManager.prototype.clear = function () {
            this._queue = [];
        };
        Object.defineProperty(ObjectMovingDataManager.prototype, "objectMovingData", {
            // crop座標と描画先座標の組の配列を返すメソッドを実装せよ
            get: function () {
                return this.objectMovingData;
            },
            enumerable: true,
            configurable: true
        });
        // 本当はnullを返したくはないんだけど、例外を投げると重くなるので
        ObjectMovingDataManager.prototype.getOffsetByBeforePartsCoord = function (coord) {
            var result = this._queue.filter(function (x) {
                return x.beforePosition.getPartsCoord().equals(coord);
            });
            if (result.length === 0) {
                return null;
            }
            return result[0].currentPosition.getOffsetCoord();
        };
        return ObjectMovingDataManager;
    }());
    wwa_motion.ObjectMovingDataManager = ObjectMovingDataManager;
})(wwa_motion || (wwa_motion = {}));
/// <reference path="./wwa_data.ts" />
var wwa_estimate_battle;
(function (wwa_estimate_battle) {
    var EstimateDisplayElements = /** @class */ (function () {
        function EstimateDisplayElements(id, imgFileName, parent) {
            this.id = id;
            this.imgFileName = imgFileName;
            this.parent = parent;
            this.elem = document.createElement("div");
            this.elem.classList.add("est");
            this.elem.setAttribute("id", "wwa-est-" + id);
            this.imgElem = document.createElement("div");
            this.imgElem.classList.add("est-img-wrapper");
            this.imgElem.style.backgroundImage = "url(" + this.imgFileName.replace("(", "\\(").replace(")", "\\)") + ")";
            this.statusElem = document.createElement("div");
            this.statusElem.classList.add("est-status-wrapper");
            this.energyElem = document.createElement("div");
            this.energyElem.classList.add("est-energy");
            this.energyDispElem = document.createElement("span");
            this.energyDispElem.classList.add("est-energy-disp");
            this.energyElem.appendChild(this.energyDispElem);
            this.statusElem.appendChild(this.energyElem);
            this.strengthElem = document.createElement("div");
            this.strengthElem.classList.add("est-strength");
            this.strengthDispElem = document.createElement("span");
            this.strengthDispElem.classList.add("est-strength-disp");
            this.strengthElem.appendChild(this.strengthDispElem);
            this.statusElem.appendChild(this.strengthElem);
            this.defenceElem = document.createElement("div");
            this.defenceElem.classList.add("est-defence");
            this.defenceDispElem = document.createElement("span");
            this.defenceDispElem.classList.add("est-defence-disp");
            this.defenceElem.appendChild(this.defenceDispElem);
            this.statusElem.appendChild(this.defenceElem);
            this.damageElem = document.createElement("div");
            this.damageElem.classList.add("est-damage");
            this.damageDispElem = document.createElement("span");
            this.damageDispElem.classList.add("est-damage-disp");
            this.damageElem.appendChild(this.damageDispElem);
            this.statusElem.appendChild(this.damageElem);
            this.elem.appendChild(this.imgElem);
            this.elem.appendChild(this.statusElem);
        }
        EstimateDisplayElements.prototype.hide = function () {
            this.elem.style.display = "none";
        };
        EstimateDisplayElements.prototype.show = function () {
            this.elem.style.display = "block";
        };
        EstimateDisplayElements.prototype.setResult = function (enemyImgPos, enemyStatus, result) {
            this.imgElem.style.backgroundPosition = "-" + enemyImgPos.x + "px -" + enemyImgPos.y + "px";
            this.energyDispElem.textContent = "生命力 " + enemyStatus.energy;
            this.strengthDispElem.textContent = "攻撃力 " + enemyStatus.strength;
            this.defenceDispElem.textContent = "防御力 " + enemyStatus.defence;
            if (result.isNoEffect) {
                this.damageDispElem.textContent = "攻撃無効";
            }
            else if (result.isOverMaxTurn) {
                this.damageDispElem.textContent = "長期戦が予想されます";
            }
            else {
                this.damageDispElem.textContent = "予測ダメージ " + result.damage;
            }
        };
        return EstimateDisplayElements;
    }());
    var BattleEstimateWindow = /** @class */ (function () {
        function BattleEstimateWindow(_wwa, _imgFileName, _parent) {
            var _this = this;
            this._wwa = _wwa;
            this._imgFileName = _imgFileName;
            this._parent = _parent;
            var ede;
            this._element = document.createElement("div");
            this._element.setAttribute("id", "wwa-battle-estimate");
            this._element.style.display = "none";
            this._edes = [];
            for (var i = 0; i < wwa_data.WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX; i++) {
                ede = new EstimateDisplayElements(i, this._imgFileName, this._element);
                this._edes.push(ede);
                this._element.appendChild(ede.elem);
            }
            this._element.addEventListener("click", function () {
                _this._wwa.hideBattleEstimateWindow();
            });
            this._parent.appendChild(this._element);
        }
        BattleEstimateWindow.prototype.update = function (playerStatus, monsters) {
            // モンスターの種類が8種類を超える場合は、先頭の8種類のみ処理
            for (var i = 0; i < wwa_data.WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX; i++) {
                if (i >= monsters.length) {
                    // 非表示処理
                    this._edes[i].hide();
                    continue;
                }
                var imgx = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_X);
                var imgy = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_Y);
                var imgPos = new wwa_data.Coord(imgx, imgy);
                var eng = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_ENERGY);
                var str = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_STRENGTH);
                var def = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_DEFENCE);
                var enemyStatus = new wwa_data.Status(eng, str, def, 0);
                var result = calc(playerStatus, enemyStatus);
                this._edes[i].setResult(imgPos, enemyStatus, result);
                this._edes[i].show();
            }
        };
        BattleEstimateWindow.prototype.show = function () {
            this._element.style.display = "block";
        };
        BattleEstimateWindow.prototype.hide = function () {
            this._element.style.display = "none";
        };
        return BattleEstimateWindow;
    }());
    wwa_estimate_battle.BattleEstimateWindow = BattleEstimateWindow;
    var EstimateResult = /** @class */ (function () {
        function EstimateResult(isNoEffect, isOverMaxTurn, damage) {
            this.isNoEffect = isNoEffect;
            this.isOverMaxTurn = isOverMaxTurn;
            this.damage = damage;
        }
        return EstimateResult;
    }());
    function calc(playerStatus, enemyStatus) {
        var energyE = enemyStatus.energy;
        var attackP = playerStatus.strength - enemyStatus.defence;
        var attackE = Math.max(0, enemyStatus.strength - playerStatus.defence);
        var turn = 0;
        var damage = 0;
        if (attackP > 0) {
            while (1) {
                turn++;
                energyE -= attackP;
                if (energyE <= 0) {
                    return new EstimateResult(false, false, damage);
                }
                damage += attackE;
                if (turn > 10000) {
                    return new EstimateResult(false, true, 0);
                }
            }
        }
        else {
            return new EstimateResult(true, false, 0);
        }
    }
})(wwa_estimate_battle || (wwa_estimate_battle = {}));
/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_util.ts" />
/// <reference path="./wwa_main.ts" />
// FIXME: innerHTML使う実装、あんまりよくないけど、許して。
// 入力値を扱う時はセキュリティに気をつける!!
var wwa_inject_html;
(function (wwa_inject_html) {
    var inject_html = "            <canvas id=\"wwa-map\" class=\"wwa-canvas\" width=\"440\" height=\"440\">                このブラウザは、Canvas要素をサポートしていません。            </canvas>            <canvas id=\"wwa-map-sub\" class=\"wwa-canvas\" width=\"440\" height=\"440\"></canvas>            <div id=\"wwa-sidebar\">                <div class=\"wide-cell-row\" id=\"disp-energy\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"wide-cell-row\" id=\"disp-strength\"><div class=\"status-icon\"></div><div class=\"status-value-box\"> 0 </div></div>                <div class=\"wide-cell-row\" id=\"disp-defence\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"wide-cell-row\" id=\"disp-gold\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"item-cell\" id=\"item0\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item1\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item2\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item3\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item4\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item5\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item6\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item7\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item8\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item9\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item10\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item11\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"wide-cell-row\" id=\"cell-load\">Password</div><div class=\"wide-button\" id=\"button-load\"></div>                <div class=\"wide-cell-row\" id=\"cell-save\">Quick Save</div><div class=\"wide-button\" id=\"button-save\"></div>                <div class=\"wide-cell-row\" id=\"cell-restart\">Restart Game</div><div class=\"wide-button\" id=\"button-restart\"></div>                <div class=\"wide-cell-row\" id=\"cell-gotowwa\">Goto WWA</div><div class=\"wide-button\" id=\"button-gotowwa\"></div>            </div>            <div id=\"wwa-controller\"></div>            <div id=\"wwa-fader\"></div>            <div id=\"wwa-cover\">                 <div id=\"version\"></div>                 <div id=\"progress-message-container\">開始しています...</div>                 <div id=\"progress-bar-bg\"></div>                 <div id=\"progress-bar\" class=\"progress-bar\"></div>                 <div id=\"progress-bar-audio\" class=\"progress-bar\"></div>                 <div id=\"progress-disp\">---</div>            </div>            <div id=\"wwa-audio-wrapper\"></div>    ";
    var inject_html_no_img = "            <canvas id=\"wwa-map\" class=\"wwa-canvas\" width=\"440\" height=\"440\">                このブラウザは、Canvas要素をサポートしていません。            </canvas>            <canvas id=\"wwa-map-sub\" class=\"wwa-canvas\" width=\"440\" height=\"440\"></canvas>            <div id=\"wwa-sidebar\">                <div class=\"wide-cell-row\" id=\"disp-energy\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"wide-cell-row\" id=\"disp-strength\"><div class=\"status-icon\"></div><div class=\"status-value-box\"> 0 </div></div>                <div class=\"wide-cell-row\" id=\"disp-defence\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"wide-cell-row\" id=\"disp-gold\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>                <div class=\"item-cell\" id=\"item0\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item1\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item2\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item3\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item4\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item5\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item6\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item7\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item8\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item9\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item10\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"item-cell\" id=\"item11\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>                <div class=\"wide-cell-row\" id=\"cell-load\">Password</div><div class=\"wide-button\" id=\"button-load\"></div>                <div class=\"wide-cell-row\" id=\"cell-save\">Quick Save</div><div class=\"wide-button\" id=\"button-save\"></div>                <div class=\"wide-cell-row\" id=\"cell-restart\">Restart Game</div><div class=\"wide-button\" id=\"button-restart\"></div>                <div class=\"wide-cell-row\" id=\"cell-gotowwa\">Goto WWA</div><div class=\"wide-button\" id=\"button-gotowwa\"></div>            </div>            <div id=\"wwa-controller\"></div>            <div id=\"wwa-fader\"></div>            <div id=\"wwa-cover\"></div>            <div id=\"wwa-audio-wrapper\"></div>    ";
    /*
    var inject_html = "\
            <canvas id=\"wwa-map\" class=\"wwa-canvas\" width=\"440\" height=\"440\">\
                このブラウザは、Canvas要素をサポートしていません。\
            </canvas>\
            <canvas id=\"wwa-map-sub\" class=\"wwa-canvas\" width=\"440\" height=\"440\"></canvas>\
            <div id=\"wwa-sidebar\">\
                <div class=\"wide-cell-row\" id=\"disp-energy\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>\
                <div class=\"wide-cell-row\" id=\"disp-strength\"><div class=\"status-icon\"></div><div class=\"status-value-box\"> 0 </div></div>\
                <div class=\"wide-cell-row\" id=\"disp-defence\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>\
                <div class=\"wide-cell-row\" id=\"disp-gold\"><div class=\"status-icon\"></div><div class=\"status-value-box\">0</div></div>\
                <div class=\"item-cell\" id=\"item0\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item1\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item2\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item3\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item4\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item5\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item6\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item7\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item8\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item9\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item10\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"item-cell\" id=\"item11\"><div class=\"item-click-border\"></div><div class=\"item-disp\"></div></div>\
                <div class=\"wide-cell-row\" id=\"cell-load\">Password</div><div class=\"wide-button\" id=\"button-load\"></div>\
                <div class=\"wide-cell-row\" id=\"cell-save\">Quick Save</div><div class=\"wide-button\" id=\"button-save\"></div>\
                <div class=\"wide-cell-row\" id=\"cell-restart\">Restart Game</div><div class=\"wide-button\" id=\"button-restart\"></div>\
                <div class=\"wide-cell-row\" id=\"cell-gotowwa\">Go to WWA</div><div class=\"wide-button\" id=\"button-gotowwa\"></div>\
            </div>\
            <div id=\"wwa-controller\"></div>\
            <div id=\"wwa-fader\"></div>\
            <div id=\"wwa-cover\">\
                 <div id=\"version\"></div>\
                 <div id=\"progress-message-container\">開始しています...</div>\
                 <div id=\"progress-bar-bg\"></div>\
                 <div id=\"progress-bar\" class=\"progress-bar\"></div>\
                 <div id=\"progress-bar-audio\" class=\"progress-bar\"></div>\
                 <div id=\"progress-disp\">---</div>\
            </div>\
            <div id=\"wwa-audio-wrapper\"></div>\"\
    ";
    */
    function inject(parent, titleImgName) {
        var style = document.createElement("style");
        style.type = "text/css";
        style.setAttribute("id", wwa_data.WWAConsts.WWA_STYLE_TAG_ID);
        wwa_util.$tag("head")[0].appendChild(style);
        if (titleImgName === null) {
            parent.innerHTML = inject_html_no_img;
            var canvas = document.createElement("canvas");
            canvas.height = wwa_data.WWAConsts.SCREEN_HEIGHT;
            canvas.width = wwa_data.WWAConsts.SCREEN_WIDTH;
            canvas.id = "progress-panel";
            wwa_util.$id("wwa-cover").appendChild(canvas);
        }
        else {
            parent.innerHTML = inject_html;
            var img = document.createElement("img");
            img.src = titleImgName;
            wwa_util.$id("wwa-cover").appendChild(img);
        }
    }
    wwa_inject_html.inject = inject;
})(wwa_inject_html || (wwa_inject_html = {}));
/// <reference path="./wwa_data.ts" />
var wwa_psave;
(function (wwa_psave) {
    var pressData;
    var VALUE_MAX = 65000;
    var MASK_BIG = 0xFF00;
    var MASK_LITTLE = 0x00FF;
    function getPressData() {
        return pressData;
    }
    wwa_psave.getPressData = getPressData;
    function pressToBuffer(pos, value, useMax) {
        if (useMax === void 0) { useMax = false; }
        if (useMax) {
            value = Math.max(VALUE_MAX, value);
        }
        pressData[pos] = value;
    }
    function createSavePassword(wwaData) {
        var map;
        if (pressData === void 0 || pressData === null) {
            pressData = new Uint8Array(wwaData.mapWidth * wwaData.mapWidth * 4);
        }
        //        pressToBuffer();
        return "";
    }
    wwa_psave.createSavePassword = createSavePassword;
})(wwa_psave || (wwa_psave = {}));
/// <reference path="./wwa_main.ts" />
var wwa_password_window;
(function (wwa_password_window) {
    var Mode;
    (function (Mode) {
        Mode[Mode["SAVE"] = 0] = "SAVE";
        Mode[Mode["LOAD"] = 1] = "LOAD";
    })(Mode = wwa_password_window.Mode || (wwa_password_window.Mode = {}));
    var DESCRIPTION_LOAD = ("下のボックスに前回のプレイで取得した\n" +
        "復帰用パスワードを入力してください。\n" +
        "テキストは、Ctrl+Cでコピー、Ctrl+Vで貼り付けできます。\n" +
        "現在、Java版WWAで取得したパスワードはご利用になれません。\n" +
        //        "テキストの先頭に「Ａ」最後尾に「Ｚ」の文字があることを確認してください。\n" +
        "作成者がマップの内容を変更した場合は\n" +
        "それ以前に取得したパスワードは使えなくなります。");
    var DESCRIPTION_SAVE = ("下記テキストがデータ復帰用のパスワードになっています。\n" +
        "コピーしてメモ帳などのテキストエディタに貼り付けて\n" +
        "保存してください。ボックスをクリックで全体を選択、\n" +
        "「Ctrl+C」でコピー、「Ctrl+V」で貼り付けできます。\n" +
        "通常数万文字程度ありますので、ご注意ください。");
    var PasswordWindow = /** @class */ (function () {
        function PasswordWindow(_wwa, _parent) {
            var _this = this;
            this._wwa = _wwa;
            this._parent = _parent;
            this._element = document.createElement("div");
            this._element.setAttribute("id", "wwa-password-window");
            this._element.style.display = "none";
            this._descriptionElement = document.createElement("div");
            this._descriptionElement.classList.add("wwa-password-description");
            this._passwordBoxElement = document.createElement("textarea");
            this._passwordBoxElement.setAttribute("cols", "50");
            this._passwordBoxElement.setAttribute("rows", "16");
            this._passwordBoxElement.addEventListener("focus", function (e) {
                _this._passwordBoxElement.select();
            });
            this._buttonWrapperElement = document.createElement("div");
            this._okButtonElement = document.createElement("button");
            this._okButtonElement.textContent = "OK";
            this._okButtonElement.addEventListener("click", function () {
                _this._wwa.hidePasswordWindow();
            });
            this._cancelButtonElement = document.createElement("button");
            this._cancelButtonElement.textContent = "キャンセル";
            this._cancelButtonElement.addEventListener("click", function () {
                _this._wwa.hidePasswordWindow(true);
            });
            this._buttonWrapperElement.appendChild(this._okButtonElement);
            this._buttonWrapperElement.appendChild(this._cancelButtonElement);
            this._mode = Mode.LOAD;
            this._element.appendChild(this._descriptionElement);
            this._element.appendChild(this._passwordBoxElement);
            this._element.appendChild(this._buttonWrapperElement);
            this._parent.appendChild(this._element);
            this.update();
        }
        Object.defineProperty(PasswordWindow.prototype, "mode", {
            get: function () {
                return this._mode;
            },
            set: function (mode) {
                this._mode = mode;
                if (mode === Mode.LOAD) {
                    this.password = "";
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PasswordWindow.prototype, "password", {
            get: function () {
                return this._passwordBoxElement.value;
            },
            set: function (password) {
                this._passwordBoxElement.value = password;
            },
            enumerable: true,
            configurable: true
        });
        PasswordWindow.prototype.show = function (mode) {
            if (mode !== void 0) {
                this.mode = mode;
            }
            this._isVisible = true;
            this.update();
        };
        PasswordWindow.prototype.hide = function () {
            this._isVisible = false;
            this.update();
        };
        PasswordWindow.prototype.update = function () {
            var msg = "";
            if (this._mode === Mode.LOAD) {
                msg = DESCRIPTION_LOAD;
                try {
                    this._passwordBoxElement.removeAttribute("readonly");
                }
                catch (e) { }
                this._cancelButtonElement.style.display = "inline";
            }
            else {
                msg = DESCRIPTION_SAVE;
                this._passwordBoxElement.setAttribute("readonly", "readonly");
                this._cancelButtonElement.style.display = "none";
            }
            var mesArray = msg.split("\n");
            this._descriptionElement.textContent = "";
            for (var i = 0; i < mesArray.length; i++) {
                var sp = document.createElement("span");
                sp.textContent = mesArray[i];
                this._descriptionElement.appendChild(sp);
                this._descriptionElement.appendChild(document.createElement("br"));
            }
            if (this._isVisible) {
                this._element.style.display = "block";
            }
            else {
                this._element.style.display = "none";
            }
        };
        return PasswordWindow;
    }());
    wwa_password_window.PasswordWindow = PasswordWindow;
})(wwa_password_window || (wwa_password_window = {}));
/// <reference path="./wwa_util.ts" />
var wwa_item_menu;
(function (wwa_item_menu) {
    var ItemMenu = /** @class */ (function () {
        function ItemMenu() {
            this.allClear();
        }
        ItemMenu.prototype.update = function () {
            if (this.counter > 0) {
                this.counter--;
            }
        };
        ItemMenu.prototype.cursor_wait = function () {
            this.counter = 6;
        };
        ItemMenu.prototype.allClear = function () {
            this.col = 0;
            this.row = 0;
            this.counter = 0;
        };
        ItemMenu.prototype.cursor_up = function () {
            if (this.counter > 0) {
                //�J�[�\�����s�[�g�ҋ@
                return;
            }
            if (this.row > 0) {
                this.row--;
                this.openView();
                this.cursor_wait();
            }
        };
        ItemMenu.prototype.cursor_down = function () {
            if (this.counter > 0) {
                //�J�[�\�����s�[�g�ҋ@
                return;
            }
            if (this.row < ItemMenu.ROW_MAX - 1) {
                this.row++;
                this.openView();
                this.cursor_wait();
            }
        };
        ItemMenu.prototype.cursor_left = function () {
            if (this.counter > 0) {
                //�J�[�\�����s�[�g�ҋ@
                return;
            }
            if (this.col > 0) {
                this.col--;
                this.openView();
                this.cursor_wait();
            }
        };
        ItemMenu.prototype.cursor_right = function () {
            if (this.counter > 0) {
                //�J�[�\�����s�[�g�ҋ@
                return;
            }
            if (this.col < ItemMenu.COL_MAX - 1) {
                this.col++;
                this.openView();
                this.cursor_wait();
            }
        };
        ItemMenu.prototype.ok = function () {
            this.close();
            //�I�𒆂�DOM�ƘA������DOM��N���b�N
            var elm = null;
            elm = (wwa_util.$qsh(ItemMenu.CLICK_DOM_QUERY_TABLE[this.row][this.col]));
            if (elm.classList.contains("item-click-border")) {
                //ITEM
            }
            else {
                this.allClear();
            }
            var evt = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            return elm.dispatchEvent(evt);
        };
        ItemMenu.prototype.ng = function () {
            this.close();
        };
        ItemMenu.prototype.close = function () {
            var elm = null;
            var i, j;
            for (i = 0; i < ItemMenu.COL_MAX; i++) {
                for (j = 0; j < ItemMenu.ROW_MAX; j++) {
                    elm = (wwa_util.$id(ItemMenu.DOM_ID_TABLE[j][i]));
                    if (elm.classList.contains("onpress")) {
                        elm.classList.remove("onpress");
                    }
                }
            }
        };
        ItemMenu.prototype.openView = function () {
            this.close();
            var elm = null;
            elm = (wwa_util.$id(ItemMenu.DOM_ID_TABLE[this.row][this.col]));
            elm.classList.add("onpress");
        };
        ItemMenu.prototype.init = function () {
            this.allClear();
            this.openView();
        };
        ItemMenu.KEY_BUFFER_MAX = 256;
        ItemMenu.ROW_MAX = 8;
        ItemMenu.COL_MAX = 3;
        ItemMenu.DOM_ID_TABLE = [
            ["item0", "item1", "item2"],
            ["item3", "item4", "item5"],
            ["item6", "item7", "item8"],
            ["item9", "item10", "item11"],
            ["cell-load", "cell-load", "cell-load"],
            ["cell-save", "cell-save", "cell-save"],
            ["cell-restart", "cell-restart", "cell-restart"],
            ["cell-gotowwa", "cell-gotowwa", "cell-gotowwa"]
        ];
        ItemMenu.CLICK_DOM_QUERY_TABLE = [
            ["#item0 .item-click-border", "#item1 .item-click-border", "#item2 .item-click-border"],
            ["#item3 .item-click-border", "#item4 .item-click-border", "#item5 .item-click-border"],
            ["#item6 .item-click-border", "#item7 .item-click-border", "#item8 .item-click-border"],
            ["#item9 .item-click-border", "#item10 .item-click-border", "#item11 .item-click-border"],
            ["#button-load", "#button-load", "#button-load"],
            ["#button-save", "#button-save", "#button-save"],
            ["#button-restart", "#button-restart", "#button-restart"],
            ["#button-gotowwa", " #button-gotowwa", "#button-gotowwa"]
        ];
        return ItemMenu;
    }());
    wwa_item_menu.ItemMenu = ItemMenu;
})(wwa_item_menu || (wwa_item_menu = {}));
/// <reference path="./wwa_input.ts" />
/// <reference path="./wwa_cgmanager.ts" />
/// <reference path="./wwa_data.ts" />
/// <reference path="./wwa_util.ts" />
/// <reference path="./wwa_parts_player.ts" />
/// <reference path="./wwa_message.ts" />
/// <reference path="./wwa_monster.ts" />
/// <reference path="./wwa_motion.ts" />
/// <reference path="./wwa_estimate_battle.ts" />
/// <reference path="./wwa_inject_html.ts" />
/// <reference path="./wwa_psave.ts" />
/// <reference path="./wwa_password_window.ts" />
/// <reference path="./wwa_item_menu.ts" />
var postMessage_noWorker = function (e) { };
var wwa_main;
(function (wwa_main) {
    var KeyCode = wwa_input.KeyCode;
    var KeyState = wwa_input.KeyState;
    var KeyStore = wwa_input.KeyStore;
    var MouseState = wwa_input.MouseState;
    var MouseStore = wwa_input.MouseStore;
    var GamePadStore = wwa_input.GamePadStore;
    var CGManager = wwa_cgmanager.CGManager;
    var Consts = wwa_data.WWAConsts;
    var Coord = wwa_data.Coord;
    var Position = wwa_data.Position;
    var Camera = wwa_camera.Camera;
    var ItemMenu = wwa_item_menu.ItemMenu;
    var util = wwa_util;
    var wwa;
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    /**
     *
     *
     * @param current
     * @param total
     * @param stage
     * @returns {wwa_data.LoaderProgress}
     */
    function getProgress(current, total, stage) {
        var progress = new wwa_data.LoaderProgress();
        progress.current = current;
        progress.total = total;
        progress.stage = stage;
        return progress;
    }
    wwa_main.getProgress = getProgress;
    var WWAWebAudio = /** @class */ (function () {
        function WWAWebAudio() {
            this.isBgm = false;
            this.buffer_sources = [];
            this.pos = 0;
        }
        WWAWebAudio.prototype.play = function () {
            var audioContext = wwa.audioContext;
            var gainNode = wwa.audioGain;
            var buffer_source = null;
            buffer_source = audioContext.createBufferSource();
            this.buffer_sources.push(buffer_source);
            buffer_source.buffer = this.buffer;
            if (this.isBgm) {
                buffer_source.loop = true;
            }
            buffer_source.connect(gainNode);
            //gainNode.gain.setValueAtTime(1, audioContext.currentTime);
            var duration = buffer_source.duration;
            if ((!isFinite(duration)) || (duration < 0) || (typeof duration !== "number")) {
                duration = 0;
            }
            buffer_source.start(0, this.pos * duration);
            buffer_source.onended = function () {
                var id = this.buffer_sources.indexOf(buffer_source);
                if (id !== -1) {
                    this.buffer_sources.splice(id, 1);
                }
                try {
                    buffer_source.stop();
                }
                catch (e) {
                }
                buffer_source.onended = null;
            }.bind(this);
            gainNode.connect(audioContext.destination);
        };
        WWAWebAudio.prototype.pause = function () {
            var len = this.buffer_sources.length;
            var i;
            var buffer_source = null;
            for (i = 0; i < len; i++) {
                buffer_source = this.buffer_sources[i];
                try {
                    buffer_source.stop();
                }
                catch (e) {
                }
                buffer_source.onended = null;
            }
            this.buffer_sources.length = 0;
        };
        WWAWebAudio.prototype.skipTo = function (pos) {
            this.pos = pos;
        };
        return WWAWebAudio;
    }());
    wwa_main.WWAWebAudio = WWAWebAudio;
    var WWA = /** @class */ (function () {
        function WWA(mapFileName, workerFileName, urlgateEnabled, titleImgName, classicModeEnabled, audioDirectory) {
            if (urlgateEnabled === void 0) { urlgateEnabled = false; }
            if (audioDirectory === void 0) { audioDirectory = ""; }
            var _this = this;
            this.audioExtension = "";
            /**
              何でこんなことしてるの?
               requestAnimationFrame で関数を呼んだ時, this が window になることを防ぐため!
            */
            this.mainCaller = (function () {
                _this._main();
            });
            this.soundCheckCaller = (function () {
                _this.checkAllSoundLoaded();
            });
            var ctxCover;
            window.addEventListener("click", function (e) {
                // WWA操作領域がクリックされた場合は, stopPropagationなので呼ばれないはず
                _this._isActive = false;
            });
            wwa_util.$id("wwa-wrapper").addEventListener("click", function (e) {
                e.stopPropagation();
                _this._isActive = true;
            });
            this._isActive = true;
            this._useGameEnd = false;
            if (titleImgName === null) {
                this._hasTitleImg = false;
                this._cvsCover = util.$id("progress-panel");
                ctxCover = this._cvsCover.getContext("2d");
                ctxCover.fillStyle = "rgb(0, 0, 0)";
            }
            else {
                this._hasTitleImg = true;
            }
            try {
                if (this._hasTitleImg) {
                    util.$id("version").textContent = "WWA Wing Ver." + Consts.VERSION_WWAJS;
                }
                else {
                    this._setLoadingMessage(ctxCover, 0);
                }
            }
            catch (e) { }
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = window.audioContext = window.audioContext || new AudioContext();
                this.audioGain = this.audioContext.createGain();
                this.audioGain.gain.setValueAtTime(1, this.audioContext.currentTime);
            }
            var myAudio = new Audio();
            if (("no" !== myAudio.canPlayType("audio/mpeg")) && ("" !== myAudio.canPlayType("audio/mpeg"))) {
                this.audioExtension = "mp3";
            }
            else {
                this.audioExtension = "m4a";
            }
            var ua = window.navigator.userAgent;
            var browser = { os: '', browser: '' };
            browser.os = ua.match(/windows/i) ? 'Windows' : '';
            browser.os = browser.os || (ua.match(/macintosh/i) ? 'Macintosh' : '');
            browser.os = browser.os || (ua.match(/iphone|ipad|ipod/i) ? 'iOS' : '');
            browser.os = browser.os || (ua.match(/oculus/i) ? 'Oculus' : '');
            browser.os = browser.os || (ua.match(/android/i) ? 'Android' : '');
            browser.os = browser.os || (ua.match(/nintendo/i) ? 'Nintendo' : '');
            browser.os = browser.os || (ua.match(/playstation/i) ? 'PlayStation' : '');
            browser.os = browser.os || (ua.match(/linux/i) ? 'Linux' : '');
            this._isURLGateEnable = urlgateEnabled;
            this._isClassicModeEnable = classicModeEnabled;
            this._mainCallCounter = 0;
            this._animationCounter = 0;
            this._statusPressCounter = new wwa_data.Status(0, 0, 0, 0);
            if (!audioDirectory) {
                audioDirectory = "./audio/";
            }
            else if (audioDirectory[audioDirectory.length - 1] !== "/") {
                audioDirectory += "/";
            }
            this._audioDirectory = audioDirectory;
            this._useBattleReportButton = true;
            var t_start = new Date().getTime();
            var isLocal = !!location.href.match(/^file/);
            if (isLocal) {
                if (browser.os === "Nintendo") {
                    wwa_data.speedList = [10, 10, 10, 10];
                    Consts.BATTLE_INTERVAL_FRAME_NUM = 5;
                    this._useGameEnd = true;
                    this._useBattleReportButton = false;
                }
                else {
                    alert("【警告】直接HTMLファイルを開いているようです。\n" +
                        "このプログラムは正常に動作しない可能性があります。\n" +
                        "マップデータの確認を行う場合には同梱の「WWA Debugger」をご利用ください。");
                }
            }
            this._usePassword = browser.os !== "Nintendo";
            this._useHelp = true;
            this._useScaleUp = false;
            switch (browser.os) {
                case "Android":
                case "iOS":
                case "Oculus":
                case "Nintendo":
                case "PlayStation":
                    this._useHelp = false;
                    break;
            }
            switch (browser.os) {
                case "Android":
                case "iOS":
                    util.$id("wwa-wrapper").classList.add("useScaleUp");
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
            if (window["audiojs"] === void 0) {
                this._setErrorMessage("Audio.jsのロードに失敗しました。\n" +
                    "フォルダ" + this._audioDirectory + "の中にaudio.min.jsは配置されていますか？ \n" +
                    "フォルダを変更される場合には data-wwa-audio-dir 属性を\n" +
                    "指定してください", ctxCover);
                return;
            }
            this._loadHandler = function (e) {
                if (e.data.error !== null && e.data.error !== void 0) {
                    _this._setErrorMessage("下記のエラーが発生しました。: \n" + e.data.error.message, ctxCover);
                    return;
                }
                if (e.data.progress !== null && e.data.progress !== void 0) {
                    _this._setProgressBar(e.data.progress);
                    return;
                }
                _this._wwaData = e.data.wwaData;
                try {
                    if (_this._hasTitleImg) {
                        util.$id("version").textContent += (" (Map data Ver. "
                            + Math.floor(_this._wwaData.version / 10) + "." +
                            +_this._wwaData.version % 10 + ")");
                    }
                    else {
                        _this._setLoadingMessage(ctxCover, 1);
                    }
                }
                catch (e) { }
                var mapFileName = wwa_util.$id("wwa-wrapper").getAttribute("data-wwa-mapdata"); //ファイル名取得
                var pathList = mapFileName.split("/"); //ディレクトリで分割
                pathList.pop(); //最後のファイルを消す
                pathList.push(_this._wwaData.mapCGName); //最後に画像ファイル名を追加
                _this._wwaData.mapCGName = pathList.join("/"); //pathを復元
                _this.initCSSRule();
                _this._setProgressBar(getProgress(0, 4, wwa_data.LoadStage.GAME_INIT));
                _this._setLoadingMessage(ctxCover, 2);
                var cgFile = new Image();
                cgFile.src = _this._wwaData.mapCGName;
                cgFile.addEventListener("error", function () {
                    _this._setErrorMessage("画像ファイル「" + _this._wwaData.mapCGName + "」が見つかりませんでした。\n" +
                        "管理者の方へ: データがアップロードされているか、\n" +
                        "パーミッションを確かめてください。", ctxCover);
                });
                _this._restartData = JSON.parse(JSON.stringify(_this._wwaData));
                var escapedFilename = _this._wwaData.mapCGName.replace("(", "\\(").replace(")", "\\)");
                Array.prototype.forEach.call(util.$qsAll("div.item-cell"), function (node) {
                    node.style.backgroundPosition = "-40px -80px";
                    node.style.backgroundImage = "url(" + escapedFilename + ")";
                });
                Array.prototype.forEach.call(util.$qsAll("div.wide-cell-row"), function (node) {
                    node.style.backgroundPosition = "-160px -120px";
                    node.style.backgroundImage = "url(" + escapedFilename + ")";
                });
                Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-click-border"), function (node) {
                    node.style.backgroundImage = "url('" + Consts.ITEM_BORDER_IMG_DATA_URL + "')";
                    node.style.backgroundPosition = "0 0";
                    node.style.display = "none";
                    node.style.cursor = "pointer";
                });
                Array.prototype.forEach.call(util.$qsAll(".item-cell>.item-disp"), function (node) {
                    node.style.backgroundImage = "url(" + escapedFilename + ")";
                });
                var iconNode_energy = util.$qsh("#disp-energy>.status-icon");
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
                _this._setProgressBar(getProgress(1, 4, wwa_data.LoadStage.GAME_INIT));
                _this._setLoadingMessage(ctxCover, 3);
                _this._replaceAllRandomObjects();
                var t_end = new Date().getTime();
                console.log("Loading Complete!" + (t_end - t_start) + "ms");
                _this._cvs = util.$id("wwa-map");
                _this._cvsSub = util.$id("wwa-map-sub");
                var ctx = _this._cvs.getContext("2d");
                var ctxSub = _this._cvsSub.getContext("2d");
                ctx.fillStyle = "rgba( 255, 255, 255, 0.5)";
                ctx.fillRect(0, 0, 440, 440);
                var playerPosition = new Position(_this, _this._wwaData.playerX, _this._wwaData.playerY);
                _this._camera = new Camera(playerPosition);
                _this._itemMenu = new ItemMenu();
                var status = new wwa_data.Status(_this._wwaData.statusEnergy, _this._wwaData.statusStrength, _this._wwaData.statusDefence, _this._wwaData.statusGold);
                _this._player = new wwa_parts_player.Player(_this, playerPosition, _this._camera, status, _this._wwaData.statusEnergyMax);
                _this._objectMovingDataManager = new wwa_motion.ObjectMovingDataManager(_this, _this._player);
                _this._camera.setPlayer(_this._player);
                _this._keyStore = new KeyStore();
                _this._mouseStore = new MouseStore();
                _this._gamePadStore = new GamePadStore();
                _this._messageQueue = [];
                _this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                _this._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
                _this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.NONE;
                _this._prevFrameEventExected = false;
                _this._lastMessage = new wwa_message.MessageInfo("", false, false, []);
                _this._execMacroListInNextFrame = [];
                _this._passwordLoadExecInNextFrame = false;
                _this._setProgressBar(getProgress(2, 4, wwa_data.LoadStage.GAME_INIT));
                _this._setLoadingMessage(ctxCover, 4);
                window.addEventListener("keydown", function (e) {
                    if (!_this._isActive) {
                        return;
                    }
                    if (browser.os === "Nintendo") {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    _this._keyStore.setPressInfo(e.keyCode);
                    if (e.keyCode === KeyCode.KEY_F5) {
                        e.preventDefault();
                        return;
                    }
                    if (!_this._player.isWaitingMessage()) {
                        if (!_this._player.isWaitingPasswordWindow()) {
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
                    }
                    else {
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
                window.addEventListener("keyup", function (e) {
                    if (!_this._isActive) {
                        return;
                    }
                    if (browser.os === "Nintendo") {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    _this._keyStore.setReleaseInfo(e.keyCode);
                    if (e.keyCode === KeyCode.KEY_F5) {
                        e.preventDefault();
                    }
                    else if (e.keyCode === KeyCode.KEY_DOWN ||
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
                        if (!_this._player.isWaitingMessage() && !_this._player.isWaitingPasswordWindow()) {
                            e.preventDefault();
                        }
                    }
                });
                window.addEventListener("blur", function (e) {
                    _this._keyStore.allClear();
                    _this._mouseStore.clear();
                });
                window.addEventListener("contextmenu", function (e) {
                    _this._keyStore.allClear();
                    _this._mouseStore.clear();
                });
                // IEのF1キー対策
                window.addEventListener("help", function (e) {
                    if (!_this._isActive) {
                        return;
                    }
                    e.preventDefault();
                });
                _this._wwaWrapperElement = (wwa_util.$id("wwa-wrapper"));
                _this._mouseControllerElement = (wwa_util.$id("wwa-controller"));
                _this._mouseControllerElement.addEventListener("mousedown", function (e) {
                    if (!_this._isActive) {
                        return;
                    }
                    if (e.which === 1) {
                        if (_this._mouseStore.getMouseState() !== wwa_input.MouseState.NONE) {
                            e.preventDefault();
                            return;
                        }
                        var mousePos = wwa_util.$localPos(e.clientX, e.clientY);
                        var playerPos = _this._player.getDrawingCenterPosition();
                        var dist = mousePos.substract(playerPos);
                        var dx = Math.abs(dist.x);
                        var dy = Math.abs(dist.y);
                        var dir;
                        var sideFlag = false;
                        if ((dx < Consts.CHIP_SIZE) && (dy < Consts.CHIP_SIZE)) {
                            //同一のマスをタップしていて、かつ側面の場合はその方向へ移動
                            switch ((playerPos.x / Consts.CHIP_SIZE | 0)) {
                                case 0:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.LEFT;
                                    break;
                                case Consts.H_PARTS_NUM_IN_WINDOW - 1:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.RIGHT;
                                    break;
                            }
                            switch ((playerPos.y / Consts.CHIP_SIZE | 0)) {
                                case 0:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.UP;
                                    break;
                                case Consts.V_PARTS_NUM_IN_WINDOW - 1:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.DOWN;
                                    break;
                            }
                        }
                        if (!sideFlag) {
                            if (dist.y > 0 && dy > dx) {
                                dir = wwa_data.Direction.DOWN;
                            }
                            else if (dist.y < 0 && dy > dx) {
                                dir = wwa_data.Direction.UP;
                            }
                            else if (dist.x > 0 && dy < dx) {
                                dir = wwa_data.Direction.RIGHT;
                            }
                            else if (dist.x < 0 && dy < dx) {
                                dir = wwa_data.Direction.LEFT;
                            }
                        }
                        _this._mouseStore.setPressInfo(dir);
                        //e.preventDefault();//無効にするとクリック時にWWAにフォーカスされなくなる
                    }
                });
                _this._mouseControllerElement.addEventListener("mouseleave", function (e) {
                    _this._mouseStore.clear();
                });
                _this._mouseControllerElement.addEventListener("mouseup", function (e) {
                    if (!_this._isActive) {
                        return;
                    }
                    if (e.which === 1) {
                        _this._mouseStore.setReleaseInfo();
                        e.preventDefault();
                    }
                });
                //////////////// タッチ関連 超β ////////////////////////////
                if (window["TouchEvent"] /* ←コンパイルエラー回避 */) {
                    if (_this.audioContext) {
                        var audioTest = function () {
                            this.audioContext.createBufferSource().start(0);
                            this._mouseControllerElement.removeEventListener("touchstart", audioTest);
                            audioTest = null;
                        }.bind(_this);
                        _this._mouseControllerElement.addEventListener("touchstart", audioTest);
                    }
                    _this._mouseControllerElement.addEventListener("touchstart", function (e /*←コンパイルエラー回避*/) {
                        if (!_this._isActive) {
                            return;
                        }
                        if (_this._mouseStore.getMouseState() !== wwa_input.MouseState.NONE) {
                            e.preventDefault();
                            return;
                        }
                        var mousePos = wwa_util.$localPos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                        var playerPos = _this._player.getDrawingCenterPosition();
                        var dist = mousePos.substract(playerPos);
                        var dx = Math.abs(dist.x);
                        var dy = Math.abs(dist.y);
                        var dir;
                        var sideFlag = false;
                        if ((dx < Consts.CHIP_SIZE) && (dy < Consts.CHIP_SIZE)) {
                            //同一のマスをタップしていて、かつ側面の場合はその方向へ移動
                            switch ((playerPos.x / Consts.CHIP_SIZE | 0)) {
                                case 0:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.LEFT;
                                    break;
                                case Consts.H_PARTS_NUM_IN_WINDOW - 1:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.RIGHT;
                                    break;
                            }
                            switch ((playerPos.y / Consts.CHIP_SIZE | 0)) {
                                case 0:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.UP;
                                    break;
                                case Consts.V_PARTS_NUM_IN_WINDOW - 1:
                                    sideFlag = true;
                                    dir = wwa_data.Direction.DOWN;
                                    break;
                            }
                        }
                        if (!sideFlag) {
                            if (dist.y > 0 && dy > dx) {
                                dir = wwa_data.Direction.DOWN;
                            }
                            else if (dist.y < 0 && dy > dx) {
                                dir = wwa_data.Direction.UP;
                            }
                            else if (dist.x > 0 && dy < dx) {
                                dir = wwa_data.Direction.RIGHT;
                            }
                            else if (dist.x < 0 && dy < dx) {
                                dir = wwa_data.Direction.LEFT;
                            }
                        }
                        _this._mouseStore.setPressInfo(dir, e.changedTouches[0].identifier);
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    });
                    _this._mouseControllerElement.addEventListener("touchend", function (e) {
                        if (!_this._isActive) {
                            return;
                        }
                        for (var i = 0; i < e.changedTouches.length; i++) {
                            if (_this._mouseStore.getTouchID() === e.changedTouches[i].identifier) {
                                _this._mouseStore.setReleaseInfo();
                                e.preventDefault();
                                break;
                            }
                        }
                    });
                    _this._mouseControllerElement.addEventListener("touchcancel", function (e) {
                        if (!_this._isActive) {
                            return;
                        }
                        for (var i = 0; i < e.changedTouches.length; i++) {
                            if (_this._mouseStore.getTouchID() === e.changedTouches[i].identifier) {
                                _this._mouseStore.setReleaseInfo();
                                e.preventDefault();
                                break;
                            }
                        }
                    });
                }
                //////////////// タッチ関連 超β ////////////////////////////
                util.$id("button-load").addEventListener("click", function () {
                    if (_this._player.isControllable() || (_this._messageWindow.isItemMenuChoice())) {
                        _this.onselectbutton(wwa_data.SidebarButton.QUICK_LOAD);
                    }
                });
                util.$id("button-save").addEventListener("click", function () {
                    if (_this._player.isControllable() || (_this._messageWindow.isItemMenuChoice())) {
                        _this.onselectbutton(wwa_data.SidebarButton.QUICK_SAVE);
                    }
                });
                util.$id("button-restart").addEventListener("click", function () {
                    if (_this._player.isControllable() || (_this._messageWindow.isItemMenuChoice())) {
                        _this.onselectbutton(wwa_data.SidebarButton.RESTART_GAME);
                    }
                });
                util.$id("button-gotowwa").addEventListener("click", function () {
                    if (_this._player.isControllable() || (_this._messageWindow.isItemMenuChoice())) {
                        _this.onselectbutton(wwa_data.SidebarButton.GOTO_WWA, true);
                    }
                });
                Array.prototype.forEach.call(util.$qsAll(".wide-cell-row"), function (node) {
                    node.addEventListener("click", function () {
                        _this._displayHelp();
                    });
                });
                _this._frameCoord = new Coord(Consts.IMGPOS_DEFAULT_FRAME_X, Consts.IMGPOS_DEFAULT_YESNO_Y);
                _this._battleEffectCoord = new Coord(Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_X, Consts.IMGPOS_DEFAULT_BATTLE_EFFECT_Y);
                _this._battleEstimateWindow = new wwa_estimate_battle.BattleEstimateWindow(_this, _this._wwaData.mapCGName, wwa_util.$id("wwa-wrapper"));
                _this._passwordWindow = new wwa_password_window.PasswordWindow(_this, wwa_util.$id("wwa-wrapper"));
                _this._messageWindow = new wwa_message.MessageWindow(_this, 50, 180, 340, 0, "", _this._wwaData.mapCGName, false, true, false, util.$id("wwa-wrapper"));
                _this._monsterWindow = new wwa_message.MosterWindow(_this, new Coord(50, 180), 340, 60, false, util.$id("wwa-wrapper"), _this._wwaData.mapCGName);
                _this._scoreWindow = new wwa_message.ScoreWindow(_this, new Coord(50, 50), false, util.$id("wwa-wrapper"));
                _this._setProgressBar(getProgress(3, 4, wwa_data.LoadStage.GAME_INIT));
                _this._isLoadedSound = false;
                _this._temporaryInputDisable = false;
                _this._paintSkipByDoorOpen = false;
                _this._clearFacesInNextFrame = false;
                _this._useConsole = false;
                _this.clearFaces();
                var self = _this;
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
                _this._cgManager = new CGManager(ctx, ctxSub, _this._wwaData.mapCGName, _this._frameCoord, function () {
                    _this._isSkippedSoundMessage = true;
                    if (_this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE] === "ON") {
                        _this._isLoadedSound = true;
                        _this.setMessageQueue("ゲームを開始します。\n画面をクリックしてください。\n" +
                            "※iOS, Android端末では、音楽は再生されないことがあります。", false, true);
                        _this._setLoadingMessage(ctxCover, wwa_data.LoadStage.AUDIO);
                        _this.loadSound();
                        requestAnimationFrame(_this.soundCheckCaller);
                        return;
                    }
                    else if (_this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE] === "OFF") {
                        _this._isLoadedSound = false;
                        _this.setMessageQueue("ゲームを開始します。\n画面をクリックしてください。", false, true);
                        _this.openGameWindow();
                        return;
                    } // 読み込みメッセージをスキップした場合、処理はここまで
                    _this._isSkippedSoundMessage = false;
                    if (!_this._hasTitleImg) {
                        ctxCover.clearRect(0, 0, Consts.SCREEN_WIDTH, Consts.SCREEN_HEIGHT);
                    }
                    if (_this._usePassword) {
                        _this._messageWindow.setMessage((_this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE] === "" ?
                            "効果音・ＢＧＭデータをロードしますか？" :
                            _this._wwaData.systemMessage[wwa_data.SystemMessage2.LOAD_SE]) + "\n※iOS, Android端末では、選択に関わらず音楽が再生されないことがあります。");
                        _this._messageWindow.show();
                        _this._setProgressBar(getProgress(4, 4, wwa_data.LoadStage.GAME_INIT));
                        var timer = setInterval(function () {
                            self._keyStore.update();
                            self._gamePadStore.update();
                            if (self._yesNoJudgeInNextFrame === wwa_data.YesNoState.UNSELECTED) {
                                if (self._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                                    self._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                                    self._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A)) {
                                    self._yesNoJudgeInNextFrame = wwa_data.YesNoState.YES;
                                }
                                else if (self._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                                    self._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                                    self._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_B)) {
                                    self._yesNoJudgeInNextFrame = wwa_data.YesNoState.NO;
                                }
                            }
                            if (self._yesNoJudgeInNextFrame === wwa_data.YesNoState.YES) {
                                clearInterval(timer);
                                self._messageWindow.update();
                                self._yesNoJudge = self._yesNoJudgeInNextFrame;
                                self._messageWindow.setInputDisable();
                                setTimeout(function () {
                                    self._messageWindow.hide();
                                    self._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                                    self._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
                                    self._isLoadedSound = true;
                                    _this._setLoadingMessage(ctxCover, wwa_data.LoadStage.AUDIO);
                                    self.loadSound();
                                    requestAnimationFrame(_this.soundCheckCaller);
                                }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                            }
                            else if (self._yesNoJudgeInNextFrame === wwa_data.YesNoState.NO) {
                                clearInterval(timer);
                                self._messageWindow.update();
                                self._yesNoJudge = self._yesNoJudgeInNextFrame;
                                self._messageWindow.setInputDisable();
                                setTimeout(function () {
                                    self._messageWindow.hide();
                                    self._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                                    self._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
                                    self._isLoadedSound = false;
                                    self.openGameWindow();
                                }, Consts.YESNO_PRESS_DISP_FRAME_NUM * Consts.DEFAULT_FRAME_INTERVAL);
                            }
                        }, Consts.DEFAULT_FRAME_INTERVAL);
                    }
                    else {
                        clearInterval(timer);
                        self._messageWindow.hide();
                        self._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                        self._yesNoJudgeInNextFrame = wwa_data.YesNoState.UNSELECTED;
                        self._isLoadedSound = true;
                        self.loadSound();
                        requestAnimationFrame(_this.soundCheckCaller);
                    }
                });
            };
            if (wwap_mode || Worker === void 0) {
                var script;
                if (!external_script_inject_mode) {
                    script = document.createElement("script");
                    if (wwap_mode) {
                        script.src = Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_LOADER_NO_WORKER;
                    }
                    else {
                        script.src = "wwaload.noworker.js";
                    }
                    document.getElementsByTagName("head")[0].appendChild(script);
                }
                else {
                    script = document.getElementById("wwaloader-ex");
                    if (!script.src.match(/^http:\/\/wwawing\.com/) &&
                        !script.src.match(/^http:\/\/www\.wwawing\.com/) &&
                        !script.src.match(/^https:\/\/wwaphoenix\.github\.io/) &&
                        !script.src.match(/^https:\/\/www\.wwaphoenix\.github\.io/)) {
                        throw new Error("SCRIPT ORIGIN ERROR");
                    }
                }
                var self1 = this;
                postMessage_noWorker = function (e) {
                    self1._loadHandler(e);
                };
                // 黒魔術
                try {
                    loader_start({
                        data: {
                            fileName: mapFileName + "?date=" + t_start
                        }
                    });
                }
                catch (e) {
                    script.onload = function () {
                        loader_start({
                            data: {
                                fileName: mapFileName + "?date=" + t_start
                            }
                        });
                    };
                }
            }
            else {
                try {
                    var loadWorker = new Worker(workerFileName + "?date=" + t_start);
                    loadWorker.postMessage({ "fileName": mapFileName + "?date=" + t_start });
                    loadWorker.addEventListener("message", this._loadHandler);
                }
                catch (e) {
                    alert("マップデータのロード時のエラーが発生しました。:\nWebWorkerの生成に失敗しました。" + e.message);
                    return;
                }
            }
        }
        WWA.prototype._setProgressBar = function (progress) {
            if (!this._hasTitleImg) {
                return;
            }
            if (progress.stage <= Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO) {
                (wwa_util.$id("progress-message-container")).textContent =
                    (progress.stage === Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO ? "World Name: " + this._wwaData.worldName : wwa_data.loadMessages[progress.stage]);
                (wwa_util.$id("progress-bar")).style.width =
                    (1 * progress.stage + (progress.current / progress.total) * 1) / (Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO + 1) * Consts.MAP_WINDOW_WIDTH + "px";
                (wwa_util.$id("progress-disp")).textContent =
                    ((1 * progress.stage + (progress.current / progress.total) * 1) / (Consts.LOAD_STAGE_MAX_EXCEPT_AUDIO + 1) * 100).toFixed(2) + "%";
            }
            else {
                if (this._usePassword) {
                    (wwa_util.$id("progress-message-container")).textContent = "効果音/BGMを読み込んでいます。(スペースキーでスキップ）";
                }
                else {
                    (wwa_util.$id("progress-message-container")).textContent = "ゲームデータを読み込んでいます。";
                }
                (wwa_util.$id("progress-bar-audio")).style.width =
                    (progress.current * Consts.MAP_WINDOW_WIDTH / progress.total) + "px";
                (wwa_util.$id("progress-disp")).textContent =
                    ((progress.current / progress.total * 100).toFixed(2)) + "%";
            }
        };
        WWA.prototype._setLoadingMessage = function (ctx, mode) {
            if (this._hasTitleImg) {
                return;
            } // 注意！this._hasTitleImg が false でないと動きません！
            if (mode <= 0) {
                ctx.font = wwa_data.LoadingMessageSize.TITLE + "px " + Consts.LOADING_FONT;
                ctx.fillText(wwa_data.loadMessagesClassic[0], wwa_data.LoadingMessagePosition.TITLE_X, wwa_data.LoadingMessagePosition.TITLE_Y);
                ctx.font = wwa_data.LoadingMessageSize.FOOTER + "px " + Consts.LOADING_FONT;
                ctx.fillText("WWA Wing Ver." + Consts.VERSION_WWAJS, wwa_data.LoadingMessagePosition.FOOTER_X, wwa_data.LoadingMessagePosition.COPYRIGHT_Y);
            }
            else if (mode <= wwa_data.loadMessagesClassic.length) {
                ctx.font = wwa_data.LoadingMessageSize.LOADING + "px " + Consts.LOADING_FONT;
                if (mode >= 2) {
                    ctx.clearRect(wwa_data.LoadingMessagePosition.LOADING_X, wwa_data.LoadingMessagePosition.LOADING_Y + (wwa_data.LoadingMessagePosition.LINE * (mode - 3)), Consts.SCREEN_WIDTH - wwa_data.LoadingMessagePosition.LOADING_X, wwa_data.LoadingMessagePosition.LINE); // 文字が太ましく見えるので一旦消去
                    ctx.fillText(wwa_data.loadMessagesClassic[mode - 1] + " Complete!", wwa_data.LoadingMessagePosition.LOADING_X, wwa_data.LoadingMessagePosition.LOADING_Y + (wwa_data.LoadingMessagePosition.LINE * (mode - 2)));
                }
                if (mode < wwa_data.loadMessagesClassic.length) {
                    ctx.fillText(wwa_data.loadMessagesClassic[mode], wwa_data.LoadingMessagePosition.LOADING_X, wwa_data.LoadingMessagePosition.LOADING_Y + (wwa_data.LoadingMessagePosition.LINE * (mode - 1)));
                }
                if (mode == 1) {
                    ctx.font = wwa_data.LoadingMessageSize.FOOTER + "px " + Consts.LOADING_FONT;
                    ctx.fillText("World Name  " + this._wwaData.worldName, wwa_data.LoadingMessagePosition.FOOTER_X, wwa_data.LoadingMessagePosition.WORLD_Y);
                    ctx.fillText(" (Map data Ver. " + Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10 + ")", wwa_data.LoadingMessagePosition.FOOTER_X, wwa_data.LoadingMessagePosition.WORLD_Y + wwa_data.LoadingMessagePosition.LINE);
                }
            }
            else {
                var messageY;
                if (this._isSkippedSoundMessage) {
                    messageY = wwa_data.LoadingMessagePosition.LOADING_Y + (wwa_data.LoadingMessagePosition.LINE * (wwa_data.loadMessagesClassic.length - 1));
                }
                else {
                    messageY = wwa_data.LoadingMessagePosition.FOOTER_Y;
                } // 読み込みの2択画面をスキップするかでサウンドの読み込みメッセージ位置が変わる
                if (mode <= wwa_data.LoadStage.AUDIO) {
                    ctx.fillText("Now Sound data Loading .....", wwa_data.LoadingMessagePosition.LOADING_X, messageY);
                }
                else {
                    ctx.clearRect(wwa_data.LoadingMessagePosition.LOADING_X, messageY - wwa_data.LoadingMessagePosition.LINE, Consts.SCREEN_WIDTH - wwa_data.LoadingMessagePosition.LOADING_X, wwa_data.LoadingMessagePosition.LINE);
                    ctx.fillText("Now Sound data Loading ..... Complete!", wwa_data.LoadingMessagePosition.LOADING_X, messageY);
                }
            }
        };
        WWA.prototype._setErrorMessage = function (message, ctx) {
            if (this._hasTitleImg) {
                alert(message);
            }
            else {
                ctx.clearRect(0, 0, Consts.SCREEN_WIDTH, Consts.SCREEN_HEIGHT);
                ctx.font = wwa_data.LoadingMessageSize.ERRROR + "px " + Consts.LOADING_FONT;
                var errorMessage = message.split('\n');
                errorMessage.forEach(function (line, i) {
                    ctx.fillText(line, wwa_data.LoadingMessagePosition.ERROR_X, wwa_data.LoadingMessagePosition.ERROR_Y + (wwa_data.LoadingMessagePosition.LINE * i));
                });
            }
        };
        WWA.prototype.createAudioJSInstance = function (idx, isSub) {
            if (isSub === void 0) { isSub = false; }
            var audioContext = this.audioContext;
            if (audioContext) {
                if (idx === 0 || this._webAudioJSInstances[idx] !== void 0 || idx === wwa_data.SystemSound.NO_SOUND) {
                    return;
                }
            }
            else {
                if (idx === 0 || this._audioJSInstances[idx] !== void 0 || idx === wwa_data.SystemSound.NO_SOUND) {
                    return;
                }
            }
            var file = (wwap_mode ? Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_AUDIO_DIR + "/" + idx + "." + this.audioExtension : this._audioDirectory + idx + "." + this.audioExtension);
            if (audioContext) {
                //WebAuido
                this._webAudioJSInstances[idx] = new WWAWebAudio();
                if (idx >= wwa_data.SystemSound.BGM_LB) {
                    this._webAudioJSInstances[idx].isBgm = true;
                }
                this.audioFileLoader(file, idx);
            }
            else {
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
                audioElement.loop = true;
            }
        };
        WWA.prototype.audioFileLoader = function (file, idx) {
            var audioContext = this.audioContext;
            var req = new XMLHttpRequest();
            var error_count = 0;
            var that = this;
            req.responseType = 'arraybuffer';
            req.onload = function (e) {
                var req = e.target;
                if (req.readyState === 4) {
                    if (req.status === 0 || req.status === 200) {
                        var decodeTime = +new Date();
                        audioContext.decodeAudioData(req.response, function (buffer) {
                            if (buffer.length === 0) {
                                if (error_count > 10) {
                                    //10回エラー
                                    console.log("error audio file!  " + file + " buffer size " + buffer.length);
                                }
                                else {
                                    setTimeout(function () {
                                        that.audioFileLoader(file, idx);
                                    }, 100);
                                    return;
                                }
                            }
                            that._webAudioJSInstances[idx].buffer = buffer;
                        });
                    }
                }
            };
            req.open('GET', file, true);
            req.send('');
        };
        WWA.prototype.loadSound = function () {
            this._webAudioJSInstances = new Array(Consts.SOUND_MAX + 1);
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
        };
        WWA.prototype.checkAllSoundLoaded = function () {
            var loadedNum = 0;
            var total = 0;
            if (!this._hasTitleImg) {
                var ctxCover = this._cvsCover.getContext("2d");
            } // 本当はコンストラクタで生成した変数を利用したかったけど、ゆるして
            this._keyStore.update();
            if (this._keyStore.getKeyState(wwa_input.KeyCode.KEY_SPACE) === wwa_input.KeyState.KEYDOWN) {
                this._soundLoadSkipFlag = true;
            }
            if (this.audioContext) {
                for (var i = 1; i <= Consts.SOUND_MAX; i++) {
                    if (this._webAudioJSInstances[i] === void 0) {
                        continue;
                    }
                    total++;
                    if (!this._webAudioJSInstances[i].buffer) {
                        continue;
                    }
                    loadedNum++;
                }
            }
            else {
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
            }
            if (loadedNum < total && !this._soundLoadSkipFlag) {
                this._setProgressBar(getProgress(loadedNum, total, wwa_data.LoadStage.AUDIO));
                requestAnimationFrame(this.soundCheckCaller);
                return;
            }
            this._setProgressBar(getProgress(Consts.SOUND_MAX, Consts.SOUND_MAX, wwa_data.LoadStage.AUDIO));
            this._setLoadingMessage(ctxCover, wwa_data.LoadStage.FINISH);
            this.openGameWindow();
        };
        WWA.prototype.playSound = function (id) {
            var _this = this;
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
                if (this.audioContext) {
                    if (this._webAudioJSInstances[this._wwaData.bgm].buffer) {
                        this._webAudioJSInstances[this._wwaData.bgm].pause();
                    }
                }
                else {
                    if (!this._audioJSInstances[this._wwaData.bgm].wrapper.classList.contains("loading")) {
                        this._audioJSInstances[this._wwaData.bgm].pause();
                    }
                }
                this._wwaData.bgm = 0;
            }
            if (id === 0 || id === wwa_data.SystemSound.NO_SOUND) {
                return;
            }
            if (this.audioContext) {
                if (!this._webAudioJSInstances[id].buffer) {
                    if (id >= wwa_data.SystemSound.BGM_LB) {
                        var loadi = (function (id, self) {
                            var timer = setInterval(function () {
                                if (self._wwaData.bgm === id) {
                                    if (!self._webAudioJSInstances[id].buffer) {
                                        _this._webAudioJSInstances[id].skipTo(0);
                                        _this._webAudioJSInstances[id].play();
                                        _this._wwaData.bgm = id;
                                        clearInterval(timer);
                                    }
                                }
                                else {
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
            }
            else {
                if (this._audioJSInstances[id].wrapper.classList.contains("loading")) {
                    if (id >= wwa_data.SystemSound.BGM_LB) {
                        var loadi = (function (id, self) {
                            var timer = setInterval(function () {
                                if (self._wwaData.bgm === id) {
                                    if (!self._audioJSInstances[id].wrapper.classList.contains("loading")) {
                                        _this._audioJSInstances[id].skipTo(0);
                                        _this._audioJSInstances[id].play();
                                        _this._wwaData.bgm = id;
                                        clearInterval(timer);
                                    }
                                }
                                else {
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
            }
            if (this.audioContext) {
                if (id !== 0 && this._webAudioJSInstances[id].buffer) {
                    if (id >= wwa_data.SystemSound.BGM_LB) {
                        this._webAudioJSInstances[id].skipTo(0);
                        this._webAudioJSInstances[id].play();
                        this._wwaData.bgm = id;
                    }
                    else {
                        this._webAudioJSInstances[id].skipTo(0);
                        this._webAudioJSInstances[id].play();
                    }
                }
            }
            else {
                if (id !== 0 && !this._audioJSInstances[id].wrapper.classList.contains("error")) {
                    if (id >= wwa_data.SystemSound.BGM_LB) {
                        this._audioJSInstances[id].skipTo(0);
                        this._audioJSInstances[id].play();
                        this._wwaData.bgm = id;
                    }
                    else if (this._nextSoundIsSub) {
                        this._audioJSInstancesSub[id].skipTo(0);
                        this._audioJSInstancesSub[id].play();
                        this._nextSoundIsSub = false;
                    }
                    else {
                        this._audioJSInstances[id].skipTo(0);
                        this._audioJSInstances[id].play();
                        this._nextSoundIsSub = true;
                    }
                }
            }
        };
        WWA.prototype.openGameWindow = function () {
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
        };
        WWA.prototype.onselectitem = function (itemPos) {
            if (this._player.canUseItem(itemPos)) {
                var bg = (wwa_util.$id("item" + (itemPos - 1)));
                bg.classList.add("onpress");
                this.playSound(wwa_data.SystemSound.DECISION);
                if (this._wwaData.message[wwa_data.SystemMessage1.USE_ITEM] === "BLANK") {
                    this._player.readyToUseItem(itemPos);
                    var itemID = this._player.useItem();
                    var mesID = this.getObjectAttributeById(itemID, Consts.ATR_STRING);
                    this.setMessageQueue(this.getMessageById(mesID), false, false, itemID, wwa_data.PartsType.OBJECT, this._player.getPosition().getPartsCoord());
                }
                else {
                    this.setMessageQueue(this._wwaData.message[wwa_data.SystemMessage1.USE_ITEM] === "" ?
                        "このアイテムを使用します。\nよろしいですか?" :
                        this._wwaData.message[wwa_data.SystemMessage1.USE_ITEM], true, true);
                    this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_ITEM_USE;
                    this._yesNoUseItemPos = itemPos;
                }
            }
        };
        WWA.prototype.onselectbutton = function (button, forcePassword) {
            if (forcePassword === void 0) { forcePassword = false; }
            var bg = (wwa_util.$id(wwa_data.sidebarButtonCellElementID[button]));
            this.playSound(wwa_data.SystemSound.DECISION);
            this._itemMenu.close();
            bg.classList.add("onpress");
            if (button === wwa_data.SidebarButton.QUICK_LOAD) {
                if (this._quickSaveData !== void 0 && !forcePassword) {
                    if (this._usePassword) {
                        this.setMessageQueue("データを読み込みますか？\n→Ｎｏでデータ復帰用パスワードの\n　入力選択ができます。", true, true);
                        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD;
                    }
                    else {
                        this.setMessageQueue("データを読み込みますか？", true, true);
                        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD;
                    }
                }
                else {
                    this.onpasswordloadcalled();
                }
            }
            else if (button === wwa_data.SidebarButton.QUICK_SAVE) {
                if (!this._wwaData.disableSaveFlag) {
                    if (this._usePassword) {
                        this.setMessageQueue("データの一時保存をします。\nよろしいですか？\n→Ｎｏでデータ復帰用パスワードの\n　表示選択ができます。", true, true);
                        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE;
                    }
                    else {
                        this.setMessageQueue("データの一時保存をします。\nよろしいですか？", true, true);
                        this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE;
                    }
                }
                else {
                    this.setMessageQueue("ここではセーブ機能は\n使用できません。", false, true);
                }
            }
            else if (button === wwa_data.SidebarButton.RESTART_GAME) {
                this.setMessageQueue("初めからスタートしなおしますか？", true, true);
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_RESTART_GAME;
            }
            else if (button === wwa_data.SidebarButton.GOTO_WWA) {
                if (this._useGameEnd) {
                    (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                    this.setMessageQueue("ＷＷＡゲームを終了しますか？", true, true);
                    this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_END_GAME;
                }
                else if (!forcePassword) {
                    (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                    this.setMessageQueue("ＷＷＡの公式サイトを開きますか？", true, true);
                    this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA;
                }
                else if (this._useBattleReportButton) {
                    this.launchBattleEstimateWindow();
                }
                else {
                    this.setMessageQueue("ＷＷＡの公式サイトを開きますか？", true, true);
                    this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA;
                }
            }
        };
        WWA.prototype.onpasswordloadcalled = function () {
            if (this._usePassword) {
                var bg = (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD]));
                bg.classList.add("onpress");
                this.setMessageQueue("データ復帰用のパスワードを入力しますか？", true, true);
                this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
            }
            else {
                this.setMessageQueue("セーブデータがありません。", false, true);
            }
        };
        WWA.prototype.onpasswordsavecalled = function () {
            var bg = (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE]));
            bg.classList.add("onpress");
            if (!this._wwaData.disableSaveFlag) {
                if (this._usePassword) {
                    this.setMessageQueue("データ復帰用のパスワードを表示しますか？", true, true);
                    this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_SAVE;
                }
            }
            else {
                this.setMessageQueue("ここではセーブ機能は\n使用できません。", false, true);
            }
        };
        WWA.prototype.onitemmenucalled = function () {
            this.setMessageQueue("右のメニューを選択してください。", false, true);
            this._messageWindow.setItemMenuChoice(true);
            this.playSound(wwa_data.SystemSound.DECISION);
            this._itemMenu.openView();
        };
        WWA.prototype.onchangespeed = function (type) {
            var speedIndex;
            if (type === wwa_data.SpeedChange.UP) {
                speedIndex = this._player.speedUp();
            }
            else {
                speedIndex = this._player.speedDown();
            }
            this.setMessageQueue("移動速度を【" + wwa_data.speedNameList[speedIndex] + "】に切り替えました。\n" +
                (speedIndex === Consts.MAX_SPEED_INDEX ? "戦闘も速くなります。\n" : "") +
                "(" + (Consts.MAX_SPEED_INDEX + 1) + "段階中" + (speedIndex + 1) + "） 速度を落とすにはIキー, 速度を上げるにはPキーを押してください。", false, true);
        };
        WWA.prototype._main = function () {
            var _this = this;
            this._temporaryInputDisable = false;
            this._waitTimeInCurrentFrame = Consts.DEFAULT_FRAME_INTERVAL;
            this._stopUpdateByLoadFlag = false;
            // キー情報のアップデート
            this._keyStore.update();
            this._mouseStore.update();
            this._gamePadStore.update();
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
                if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_LEFT) === wwa_input.KeyState.KEYDOWN ||
                    this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.LEFT) === wwa_input.MouseState.MOUSEDOWN) {
                    this._player.controll(wwa_data.Direction.LEFT);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_UP) === wwa_input.KeyState.KEYDOWN ||
                    this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.UP) === wwa_input.MouseState.MOUSEDOWN) {
                    this._player.controll(wwa_data.Direction.UP);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_RIGHT) === wwa_input.KeyState.KEYDOWN ||
                    this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.RIGHT) === wwa_input.MouseState.MOUSEDOWN) {
                    this._player.controll(wwa_data.Direction.RIGHT);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.getKeyStateForControllPlayer(KeyCode.KEY_DOWN) === wwa_input.KeyState.KEYDOWN ||
                    this._mouseStore.getMouseStateForControllPlayer(wwa_data.Direction.DOWN) === wwa_input.MouseState.MOUSEDOWN) {
                    this._player.controll(wwa_data.Direction.DOWN);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.checkHitKey(wwa_data.dirToKey[pdir])) {
                    this._player.controll(pdir);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                    this._mouseStore.checkClickMouse(wwa_data.Direction.LEFT) ||
                    this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                    this._player.controll(wwa_data.Direction.LEFT);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                    this._mouseStore.checkClickMouse(wwa_data.Direction.UP) ||
                    this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_UP)) {
                    this._player.controll(wwa_data.Direction.UP);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                    this._mouseStore.checkClickMouse(wwa_data.Direction.RIGHT) ||
                    this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                    this._player.controll(wwa_data.Direction.RIGHT);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                    this._mouseStore.checkClickMouse(wwa_data.Direction.DOWN) ||
                    this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                    this._player.controll(wwa_data.Direction.DOWN);
                    this._objectMovingDataManager.update();
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_1) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(1);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_2) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(2);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_3) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(3);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_Q) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(4);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_W) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(5);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_E) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(6);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_A) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(7);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_S) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(8);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_D) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(9);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_Z) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(10);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_X) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(11);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_C) === wwa_input.KeyState.KEYDOWN) {
                    this.onselectitem(12);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_I)) {
                    this.onchangespeed(wwa_data.SpeedChange.DOWN);
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_P) ||
                    this._keyStore.checkHitKey(KeyCode.KEY_F2)) {
                    this.onchangespeed(wwa_data.SpeedChange.UP);
                }
                else if (this._keyStore.getKeyState(KeyCode.KEY_F1) === wwa_input.KeyState.KEYDOWN ||
                    this._keyStore.getKeyState(KeyCode.KEY_M) === wwa_input.KeyState.KEYDOWN ||
                    this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A)) {
                    // 戦闘結果予測 
                    if (this.launchBattleEstimateWindow()) {
                    }
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F3)) {
                    this.playSound(wwa_data.SystemSound.DECISION);
                    this.onselectbutton(wwa_data.SidebarButton.QUICK_LOAD, true);
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F4)) {
                    this.playSound(wwa_data.SystemSound.DECISION);
                    this.onpasswordsavecalled();
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F5) ||
                    this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A, wwa_input.GamePadState.BUTTON_INDEX_ZL)) {
                    this.onselectbutton(wwa_data.SidebarButton.QUICK_LOAD);
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F6) ||
                    this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A, wwa_input.GamePadState.BUTTON_INDEX_ZR)) {
                    this.onselectbutton(wwa_data.SidebarButton.QUICK_SAVE);
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F7) ||
                    this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A, wwa_input.GamePadState.BUTTON_INDEX_R)) {
                    this.onselectbutton(wwa_data.SidebarButton.RESTART_GAME);
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F8)) {
                    this.onselectbutton(wwa_data.SidebarButton.GOTO_WWA);
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F9) ||
                    this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_X)) {
                    if (this._player.isControllable() || (this._messageWindow.isItemMenuChoice())) {
                        this.onitemmenucalled();
                    }
                }
                else if (this._keyStore.checkHitKey(KeyCode.KEY_F12)) {
                    // コマンドのヘルプ 
                    this._displayHelp();
                }
                this._keyStore.memorizeKeyStateOnControllableFrame();
                this._mouseStore.memorizeMouseStateOnControllableFrame();
            }
            else if (this._player.isJumped()) {
                if (!this._camera.isResetting()) {
                    this._player.processAfterJump();
                }
            }
            else if (this._player.isMoving()) {
                this._player.move();
                this._objectMovingDataManager.update();
            }
            else if (this._player.isWaitingMessage()) {
                if (!this._messageWindow.isVisible()) {
                    this._messageWindow.show();
                }
                if (this._messageWindow.isYesNoChoice()) {
                    //Yes No 選択肢
                    if (!this._messageWindow.isInputDisable()) {
                        if (this._yesNoJudge === wwa_data.YesNoState.UNSELECTED) {
                            if (this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                                this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                                this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A)) {
                                this._yesNoJudge = wwa_data.YesNoState.YES;
                            }
                            else if (this._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                                this._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                                this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_B)) {
                                this._yesNoJudge = wwa_data.YesNoState.NO;
                            }
                        }
                        if (this._yesNoJudge === wwa_data.YesNoState.YES) {
                            this.playSound(wwa_data.SystemSound.DECISION);
                            this._yesNoDispCounter = Consts.YESNO_PRESS_DISP_FRAME_NUM;
                            this._messageWindow.setInputDisable();
                            this._messageWindow.update();
                        }
                        else if (this._yesNoJudge === wwa_data.YesNoState.NO) {
                            this.playSound(wwa_data.SystemSound.DECISION);
                            this._yesNoDispCounter = Consts.YESNO_PRESS_DISP_FRAME_NUM;
                            this._messageWindow.setInputDisable();
                            this._messageWindow.update();
                        }
                    }
                }
                else if (this._messageWindow.isItemMenuChoice()) {
                    //Item Menu 選択肢
                    this._itemMenu.update();
                    if (this._keyStore.checkHitKey(KeyCode.KEY_LEFT) ||
                        this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_LEFT)) {
                        this._itemMenu.cursor_left();
                    }
                    else if (this._keyStore.checkHitKey(KeyCode.KEY_UP) ||
                        this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_UP)) {
                        this._itemMenu.cursor_up();
                    }
                    else if (this._keyStore.checkHitKey(KeyCode.KEY_RIGHT) ||
                        this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_RIGHT)) {
                        this._itemMenu.cursor_right();
                    }
                    else if (this._keyStore.checkHitKey(KeyCode.KEY_DOWN) ||
                        this._gamePadStore.crossPressed(wwa_input.GamePadState.BUTTON_CROSS_KEY_DOWN)) {
                        this._itemMenu.cursor_down();
                    }
                    if (this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                        this._keyStore.getKeyState(KeyCode.KEY_Y) === KeyState.KEYDOWN ||
                        this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A)) {
                        this._setNextMessage();
                        this._messageWindow.setItemMenuChoice(false);
                        this._itemMenu.ok();
                    }
                    else if (this._mouseStore.checkClickMouse(wwa_data.Direction.LEFT) ||
                        this._mouseStore.checkClickMouse(wwa_data.Direction.UP) ||
                        this._mouseStore.checkClickMouse(wwa_data.Direction.RIGHT) ||
                        this._mouseStore.checkClickMouse(wwa_data.Direction.DOWN) ||
                        this._keyStore.getKeyState(KeyCode.KEY_N) === KeyState.KEYDOWN ||
                        this._keyStore.getKeyState(KeyCode.KEY_ESC) === KeyState.KEYDOWN ||
                        this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_B)) {
                        for (var i = 0; i < wwa_data.sidebarButtonCellElementID.length; i++) {
                            var elm = (wwa_util.$id(wwa_data.sidebarButtonCellElementID[i]));
                            if (elm.classList.contains("onpress")) {
                                elm.classList.remove("onpress");
                            }
                        }
                        this._itemMenu.ng();
                        this._setNextMessage();
                        this.playSound(wwa_data.SystemSound.DECISION);
                        this._messageWindow.setItemMenuChoice(false);
                    }
                }
                else {
                    //通常メッセージ
                    var enter = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_ENTER);
                    var space = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_SPACE);
                    var esc = this._keyStore.getKeyStateForMessageCheck(KeyCode.KEY_ESC);
                    if (enter === KeyState.KEYDOWN || enter === KeyState.KEYPRESS_MESSAGECHANGE ||
                        space === KeyState.KEYDOWN || space === KeyState.KEYPRESS_MESSAGECHANGE ||
                        esc === KeyState.KEYDOWN || esc === KeyState.KEYPRESS_MESSAGECHANGE ||
                        this._mouseStore.getMouseState() === MouseState.MOUSEDOWN ||
                        this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A, wwa_input.GamePadState.BUTTON_INDEX_B)) {
                        for (var i = 0; i < wwa_data.sidebarButtonCellElementID.length; i++) {
                            var elm = (wwa_util.$id(wwa_data.sidebarButtonCellElementID[i]));
                            if (elm.classList.contains("onpress")) {
                                elm.classList.remove("onpress");
                            }
                        }
                        this._setNextMessage();
                    }
                }
            }
            else if (this._player.isWatingEstimateWindow()) {
                if (this._keyStore.getKeyState(KeyCode.KEY_ENTER) === KeyState.KEYDOWN ||
                    this._keyStore.getKeyState(KeyCode.KEY_SPACE) === KeyState.KEYDOWN ||
                    this._gamePadStore.buttonTrigger(wwa_input.GamePadState.BUTTON_INDEX_A, wwa_input.GamePadState.BUTTON_INDEX_B)) {
                    this.hideBattleEstimateWindow();
                }
            }
            else if (this._player.isFighting()) {
                this._player.fight();
                this._monsterWindow.update(this._monster);
            }
            else if (this._player.isWaitingMoveMacro()) {
                if (this._player.isMoveObjectAutoExecTime()) {
                    this.moveObjects(false);
                    this._player.resetMoveObjectAutoExecTimer();
                }
                this._objectMovingDataManager.update();
            }
            this._prevFrameEventExected = false;
            if (this._player.getPosition().isJustPosition() && this._camera.getPosition().isScreenTopPosition()) {
                if (!this._player.isJumped() &&
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
                if (this._player.isWaitingMessage() &&
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
            if (!this._player.isWaitingMessage() || !this._isClassicModeEnable) {
                this._animationCounter = (this._animationCounter + 1) % (Consts.ANIMATION_REP_HALF_FRAME * 2);
            }
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
                //setTimeout(this.mainCaller, this._waitTimeInCurrentFrame, this);
                requestAnimationFrame(this.mainCaller);
            }
            else {
                this._fadeout(function () {
                    if (_this._loadType === wwa_data.LoadType.QUICK_LOAD) {
                        _this._quickLoad();
                    }
                    else if (_this._loadType === wwa_data.LoadType.RESTART_GAME) {
                        _this._restartGame();
                    }
                    else if (_this._loadType === wwa_data.LoadType.PASSWORD) {
                        _this._applyQuickLoad(_this._passwordSaveExtractData);
                        _this._passwordSaveExtractData = void 0;
                    }
                    setTimeout(_this.mainCaller, _this._waitTimeInCurrentFrame, _this);
                });
            }
        };
        WWA.prototype._drawAll = function () {
            var cpParts = this._camera.getPosition().getPartsCoord();
            var cpOffset = this._camera.getPosition().getOffsetCoord();
            var yLimit = Consts.MAP_WINDOW_HEIGHT;
            var targetX;
            var targetY;
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
                    var timer = setInterval(function () {
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
                this._cgManager.drawCanvas(this._battleEffectCoord.x, this._battleEffectCoord.y, Consts.CHIP_SIZE * (targetX - cpParts.x) - cpOffset.x, Consts.CHIP_SIZE * (targetY - cpParts.y) - cpOffset.y, false);
            }
            this._drawEffect();
            this._drawFaces();
            this._drawFrame();
        };
        // 背景描画
        WWA.prototype._drawMap = function (cpParts, cpOffset, yLimit, isPrevCamera) {
            if (isPrevCamera === void 0) { isPrevCamera = false; }
            if (cpParts === void 0) {
                return;
            }
            var xLeft = Math.max(0, cpParts.x - 1);
            var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW);
            var yTop = Math.max(0, cpParts.y - 1);
            var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW);
            var count, drawFlag;
            drawFlag = false;
            count = 0;
            if (isPrevCamera) {
                for (var x = xLeft; x <= xRight; x++) {
                    for (var y = yTop; y <= yBottom; y++) {
                        var partsID = this._wwaData.map[y][x];
                        var ppx = this._wwaData.mapAttribute[partsID][Consts.ATR_X] / Consts.CHIP_SIZE;
                        var ppy = this._wwaData.mapAttribute[partsID][Consts.ATR_Y] / Consts.CHIP_SIZE;
                        var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) - cpOffset.x;
                        var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) - cpOffset.y;
                        this._cgManager.drawCanvasWithLowerYLimit(ppx, ppy, canvasX, canvasY, yLimit);
                    }
                }
            }
            else {
                for (var x = xLeft; x <= xRight; x++) {
                    for (var y = yTop; y <= yBottom; y++) {
                        var partsID = this._wwaData.map[y][x];
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
                if (drawFlag) {
                    //バックキャンバスをクリア
                    this._cgManager.clearBackCanvas();
                    //バックキャンバスに背景を描画
                    for (var x = xLeft; x <= xRight; x++) {
                        for (var y = yTop; y <= yBottom; y++) {
                            var partsID = this._wwaData.map[y][x];
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
        };
        // プレイヤー描画
        WWA.prototype._drawPlayer = function (cpParts, cpOffset, yLimit, isPrevCamera) {
            if (isPrevCamera === void 0) { isPrevCamera = false; }
            if (cpParts === void 0 || this._wwaData.delPlayerFlag) {
                return;
            }
            var pos = this._player.getPosition().getPartsCoord();
            var poso = this._player.getPosition().getOffsetCoord();
            var relpcrop = wwa_data.dirToPos[this._player.getDir()];
            var canvasX = (pos.x - cpParts.x) * Consts.CHIP_SIZE + poso.x - cpOffset.x;
            var canvasY = (pos.y - cpParts.y) * Consts.CHIP_SIZE + poso.y - cpOffset.y;
            var dx = Math.abs(poso.x);
            var dy = Math.abs(poso.y);
            var dir = this._player.getDir();
            var crop;
            var dirChanger = [2, 3, 4, 5, 0, 1, 6, 7];
            if (this._player.isLookingAround() && !this._player.isWaitingMessage()) {
                crop = this._wwaData.playerImgPosX + dirChanger[Math.floor(this._mainCallCounter % 64 / 8)];
                crop = this._wwaData.playerImgPosX + relpcrop + 1;
            }
            else if (this._player.isMovingImage()) {
                crop = this._wwaData.playerImgPosX + relpcrop + 1;
            }
            else {
                crop = this._wwaData.playerImgPosX + relpcrop;
            }
            if (isPrevCamera) {
                this._cgManager.drawCanvasWithLowerYLimit(crop, this._wwaData.playerImgPosY, canvasX, canvasY, yLimit);
            }
            else {
                this._cgManager.drawCanvasWithUpperYLimit(crop, this._wwaData.playerImgPosY, canvasX, canvasY, yLimit);
            }
        };
        // 物体描画
        WWA.prototype._drawObjects = function (cpParts, cpOffset, yLimit, isPrevCamera) {
            if (isPrevCamera === void 0) { isPrevCamera = false; }
            if (cpParts === void 0) {
                return;
            }
            var xLeft = Math.max(0, cpParts.x - 1);
            var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW);
            var yTop = Math.max(0, cpParts.y - 1);
            var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW);
            var offset;
            // 画面内物体描画
            for (var x = xLeft; x <= xRight; x++) {
                for (var y = yTop; y <= yBottom; y++) {
                    if (this._player.isFighting() &&
                        this._player.isTurn() &&
                        this._player.getPosition().getPartsCoord().equals(this._monster.position) &&
                        new wwa_data.Coord(x, y).equals(this._monster.position)) {
                        continue;
                    }
                    var partsIDObj = this._wwaData.mapObject[y][x];
                    offset = new Coord(0, 0);
                    if (this._wwaData.objectAttribute[partsIDObj][Consts.ATR_MOVE] !== wwa_data.MoveType.STATIC) {
                        var result = this._objectMovingDataManager.getOffsetByBeforePartsCoord(new Coord(x, y));
                        if (result !== null) {
                            offset = result;
                        }
                    }
                    var imgType = (this._animationCounter > Consts.ANIMATION_REP_HALF_FRAME ||
                        this._wwaData.objectAttribute[partsIDObj][Consts.ATR_X2] === 0 &&
                            this._wwaData.objectAttribute[partsIDObj][Consts.ATR_Y2] === 0);
                    var ppxo = this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_X : Consts.ATR_X2] / Consts.CHIP_SIZE;
                    var ppyo = this._wwaData.objectAttribute[partsIDObj][imgType ? Consts.ATR_Y : Consts.ATR_Y2] / Consts.CHIP_SIZE;
                    var canvasX = Consts.CHIP_SIZE * (x - cpParts.x) + offset.x - cpOffset.x;
                    var canvasY = Consts.CHIP_SIZE * (y - cpParts.y) + offset.y - cpOffset.y;
                    var type = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_TYPE];
                    var num = this._wwaData.objectAttribute[partsIDObj][Consts.ATR_NUMBER];
                    if (partsIDObj !== 0 && !this._checkNoDrawObject(new Coord(x, y), type, num)) {
                        if (isPrevCamera) {
                            this._cgManager.drawCanvasWithLowerYLimit(ppxo, ppyo, canvasX, canvasY, yLimit);
                        }
                        else {
                            this._cgManager.drawCanvasWithUpperYLimit(ppxo, ppyo, canvasX, canvasY, yLimit);
                        }
                    }
                }
            }
        };
        WWA.prototype._drawEffect = function () {
            if (this._wwaData.effectCoords.length === 0) {
                return;
            }
            var i = Math.floor(this._mainCallCounter % (this._wwaData.effectCoords.length * this._wwaData.effectWaits) / this._wwaData.effectWaits);
            for (var y = 0; y < Consts.V_PARTS_NUM_IN_WINDOW; y++) {
                for (var x = 0; x < Consts.H_PARTS_NUM_IN_WINDOW; x++) {
                    this._cgManager.drawCanvas(this._wwaData.effectCoords[i].x, this._wwaData.effectCoords[i].y, x * Consts.CHIP_SIZE, y * Consts.CHIP_SIZE, false);
                }
            }
        };
        WWA.prototype._drawFaces = function () {
            for (var i = 0; i < this._faces.length; i++) {
                this._cgManager.drawCanvasWithSize(this._faces[i].srcPos.x, this._faces[i].srcPos.y, this._faces[i].srcSize.x, this._faces[i].srcSize.y, this._faces[i].destPos.x, this._faces[i].destPos.y, false);
            }
        };
        WWA.prototype._drawFrame = function () {
            this._cgManager.drawFrame();
        };
        WWA.prototype._checkNoDrawObject = function (objCoord, objType, atrNumber) {
            var pPos = this._player.getPosition();
            var pCoord = pPos.getPartsCoord();
            if (!pPos.isJustPosition() || pCoord.x !== objCoord.x || pCoord.y !== objCoord.y || this._wwaData.objectNoCollapseDefaultFlag) {
                return false;
            }
            if (objType === Consts.OBJECT_DOOR && atrNumber === 0) {
                return true;
            }
            return (objType === Consts.OBJECT_STATUS || objType === Consts.OBJECT_MESSAGE ||
                objType === Consts.OBJECT_ITEM || objType === Consts.OBJECT_SELL ||
                objType === Consts.OBJECT_BUY || objType === Consts.OBJECT_SELL ||
                objType === Consts.OBJECT_LOCALGATE);
        };
        WWA.prototype.getMapWidth = function () {
            if (this._wwaData === void 0) {
                throw new Error("マップデータがロードされていません");
            }
            return this._wwaData.mapWidth;
        };
        WWA.prototype.getMapIdByPosition = function (pos) {
            var pc = pos.getPartsCoord();
            return this._wwaData.map[pc.y][pc.x];
        };
        WWA.prototype.getObjectIdByPosition = function (pos) {
            var pc = pos.getPartsCoord();
            return this._wwaData.mapObject[pc.y][pc.x];
        };
        WWA.prototype.getMapTypeByPosition = function (pos) {
            var pc = pos.getPartsCoord();
            var pid = this._wwaData.map[pc.y][pc.x];
            return this._wwaData.mapAttribute[pid][Consts.ATR_TYPE];
        };
        WWA.prototype.getObjectTypeByPosition = function (pos) {
            var pc = pos.getPartsCoord();
            var pid = this._wwaData.mapObject[pc.y][pc.x];
            return this._wwaData.objectAttribute[pid][Consts.ATR_TYPE];
        };
        WWA.prototype.getMapAttributeByPosition = function (pos, attr) {
            var pc = pos.getPartsCoord();
            var pid = this._wwaData.map[pc.y][pc.x];
            return this._wwaData.mapAttribute[pid][attr];
        };
        WWA.prototype.isCurrentPosMapPartsIncludingMessage = function (pos) {
            var mesid = this.getMapAttributeByPosition(pos, Consts.ATR_STRING);
            return mesid !== 0;
        };
        WWA.prototype.getObjectAttributeByPosition = function (pos, attr) {
            var pc = pos.getPartsCoord();
            var pid = this._wwaData.mapObject[pc.y][pc.x];
            return this._wwaData.objectAttribute[pid][attr];
        };
        WWA.prototype.getMapAttributeById = function (id, attr) {
            return this._wwaData.mapAttribute[id][attr];
        };
        WWA.prototype.getObjectAttributeById = function (id, attr) {
            return this._wwaData.objectAttribute[id][attr];
        };
        WWA.prototype.getObjectCropXById = function (id) {
            return this._wwaData.objectAttribute[id][Consts.ATR_X];
        };
        WWA.prototype.getObjectCropYById = function (id) {
            return this._wwaData.objectAttribute[id][Consts.ATR_Y];
        };
        WWA.prototype.getMessageById = function (messageID) {
            return this._wwaData.message[messageID];
        };
        WWA.prototype.getSystemMessageById = function (messageID) {
            return this._wwaData.systemMessage[messageID];
        };
        // 背景パーツ判定
        WWA.prototype.checkMap = function (pos) {
            var playerPos = this._player.getPosition().getPartsCoord();
            pos = (pos !== void 0 && pos !== null) ? pos : playerPos;
            var partsID = this._wwaData.map[pos.y][pos.x];
            var mapAttr = this._wwaData.mapAttribute[partsID][Consts.ATR_TYPE];
            var isPlayerPositionExec = (pos.x === playerPos.x && pos.y === playerPos.y);
            var eventExecuted = false;
            if (isPlayerPositionExec) {
                if (this._player.getLastExecPartsIDOnSamePosition(wwa_data.PartsType.MAP) === partsID) {
                    return false;
                }
            }
            // 道
            if (mapAttr === Consts.MAP_STREET) {
                eventExecuted = this._execMapStreetEvent(pos, partsID, mapAttr);
                // 壁
            }
            else if (mapAttr === Consts.MAP_WALL) {
                eventExecuted = this._execMapWallEvent(pos, partsID, mapAttr);
                // ジャンプゲート
            }
            else if (mapAttr === Consts.MAP_LOCALGATE) {
                eventExecuted = this._execMapLocalGateEvent(pos, partsID, mapAttr);
                // URLゲート
            }
            else if (mapAttr === Consts.MAP_URLGATE) {
                eventExecuted = this._execMapUrlGateEvent(pos, partsID, mapAttr);
            }
            if (isPlayerPositionExec && !this._player.isJumped()) {
                this._player.setLastExecInfoOnSamePosition(wwa_data.PartsType.MAP, partsID);
            }
            return eventExecuted;
        };
        // 物体パーツ判定
        WWA.prototype.checkObject = function (pos) {
            var playerPos = this._player.getPosition().getPartsCoord();
            pos = (pos !== void 0 && pos !== null) ? pos : playerPos;
            var partsID = this._wwaData.mapObject[pos.y][pos.x];
            var objAttr = this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE];
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
            }
            else if (objAttr === Consts.OBJECT_MESSAGE) {
                this._execObjectMessageEvent(pos, partsID, objAttr);
                // モンスター
            }
            else if (objAttr === Consts.OBJECT_MONSTER) {
                this._execObjectMonsterEvent(pos, partsID, objAttr);
                // アイテム
            }
            else if (objAttr === Consts.OBJECT_ITEM) {
                this._execObjectItemEvent(pos, partsID, objAttr);
                // 扉
            }
            else if (objAttr === Consts.OBJECT_DOOR) {
                this._execObjectDoorEvent(pos, partsID, objAttr);
                // ステータス変化
            }
            else if (objAttr === Consts.OBJECT_STATUS) {
                this._execObjectStatusEvent(pos, partsID, objAttr);
                // 物を買う
            }
            else if (objAttr === Consts.OBJECT_BUY) {
                this._execObjectBuyEvent(pos, partsID, objAttr);
                // 物を売る
            }
            else if (objAttr === Consts.OBJECT_SELL) {
                this._execObjectSellEvent(pos, partsID, objAttr);
                // URLゲート
            }
            else if (objAttr === Consts.OBJECT_URLGATE) {
                this._execObjectUrlGateEvent(pos, partsID, objAttr);
                // スコア表示
            }
            else if (objAttr === Consts.OBJECT_SCORE) {
                this._execObjectScoreEvent(pos, partsID, objAttr);
                // 二者択一
            }
            else if (objAttr === Consts.OBJECT_SELECT) {
                this._execObjectYesNoChoiceEvent(pos, partsID, objAttr);
                // ジャンプゲート
            }
            else if (objAttr === Consts.OBJECT_LOCALGATE) {
                this._execObjectLocalGateEvent(pos, partsID, objAttr);
            }
            if (isPlayerPositionExec && !this._player.isJumped()) {
                this._player.setLastExecInfoOnSamePosition(wwa_data.PartsType.OBJECT, partsID);
            }
        };
        WWA.prototype._execMapStreetEvent = function (pos, partsID, mapAttr) {
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
        };
        WWA.prototype._execMapWallEvent = function (pos, partsID, mapAttr) {
            var objID = this.getObjectIdByPosition(pos.convertIntoPosition(this));
            var objType = this.getObjectAttributeById(objID, Consts.ATR_TYPE);
            if (objID === 0 ||
                objType === Consts.OBJECT_NORMAL ||
                objType === Consts.OBJECT_DOOR && (!this._player.hasItem(this.getObjectAttributeById(objID, Consts.ATR_ITEM)) ||
                    this.getObjectAttributeById(objType, Consts.ATR_MODE) === Consts.PASSABLE_OBJECT)) {
                this.appearParts(pos, wwa_data.AppearanceTriggerType.MAP);
                var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
                var message = this._wwaData.message[messageID];
                this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.MAP, pos.clone());
                this.playSound(this._wwaData.mapAttribute[partsID][Consts.ATR_SOUND]);
                return false;
            }
            return false;
        };
        WWA.prototype._execMapLocalGateEvent = function (pos, partsID, mapAttr) {
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
            if (0 <= jx && 0 <= jy && jx < this._wwaData.mapWidth && jy < this._wwaData.mapWidth &&
                (jx !== playerPos.x || jy !== playerPos.y)) {
                this._player.jumpTo(new Position(this, jx, jy, 0, 0));
                this.playSound(this._wwaData.mapAttribute[partsID][Consts.ATR_SOUND]);
                return true;
            }
            return false;
        };
        WWA.prototype._execMapUrlGateEvent = function (pos, partsID, mapAttr) {
            var messageID = this._wwaData.mapAttribute[partsID][Consts.ATR_STRING];
            if (!this._isURLGateEnable) {
                return true;
            }
            if (this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "BLANK") {
                location.href = wwa_util.$escapedURI(this._wwaData.message[messageID].split(/\s/g)[0]);
                return;
            }
            this.setMessageQueue(this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "" ?
                "他のページにリンクします。\nよろしいですか？" :
                this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK], true, true);
            this._yesNoChoicePartsCoord = pos;
            this._yesNoChoicePartsID = partsID;
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_MAP_PARTS;
            this._yesNoURL = this._wwaData.message[messageID].split(/\s/g)[0];
            return true;
        };
        WWA.prototype._execObjectNormalEvent = function (pos, partsID, objAttr) {
            // 何もしない
        };
        WWA.prototype._execObjectMessageEvent = function (pos, partsID, objAttr) {
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
        };
        WWA.prototype._execObjectStatusEvent = function (pos, partsID, objAttr) {
            var status = new wwa_data.Status(this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY], this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH], this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE], this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]);
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
                Consts.STATUS_MINUS_BORDER - status.energy : status.energy;
            status.strength = status.strength > Consts.STATUS_MINUS_BORDER ?
                Consts.STATUS_MINUS_BORDER - status.strength : status.strength;
            status.defence = status.defence > Consts.STATUS_MINUS_BORDER ?
                Consts.STATUS_MINUS_BORDER - status.defence : status.defence;
            status.gold = status.gold > Consts.STATUS_MINUS_BORDER ?
                Consts.STATUS_MINUS_BORDER - status.gold : status.gold;
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
        };
        WWA.prototype._execObjectMonsterEvent = function (pos, partsID, objAttr) {
            var _this = this;
            var monsterImgCoord = new wwa_data.Coord(this._wwaData.objectAttribute[partsID][Consts.ATR_X], this._wwaData.objectAttribute[partsID][Consts.ATR_Y]);
            var monsterStatus = new wwa_data.Status(this._wwaData.objectAttribute[partsID][Consts.ATR_ENERGY], this._wwaData.objectAttribute[partsID][Consts.ATR_STRENGTH], this._wwaData.objectAttribute[partsID][Consts.ATR_DEFENCE], this._wwaData.objectAttribute[partsID][Consts.ATR_GOLD]);
            var monsterMessage = this._wwaData.message[this._wwaData.objectAttribute[partsID][Consts.ATR_STRING]];
            var monsterItemID = this._wwaData.objectAttribute[partsID][Consts.ATR_ITEM];
            this._monster = new wwa_monster.Monster(partsID, pos, monsterImgCoord, monsterStatus, monsterMessage, monsterItemID, function () {
                _this._monsterWindow.hide();
            });
            this._player.startBattleWith(this._monster);
            //↓待ち時間の前にやるのはよくないので、戦闘開始時にやります。
            //            this._monsterWindow.show();
        };
        WWA.prototype._execObjectBuyEvent = function (pos, partsID, objAttr) {
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
        };
        WWA.prototype._execObjectSellEvent = function (pos, partsID, objAttr) {
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
        };
        WWA.prototype._execObjectItemEvent = function (pos, partsID, objAttr) {
            var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
            var message = this._wwaData.message[messageID];
            try {
                this._player.addItem(partsID, this._wwaData.objectAttribute[partsID][Consts.ATR_NUMBER]);
                this._wwaData.mapObject[pos.y][pos.x] = 0;
                if (this._wwaData.objectAttribute[partsID][Consts.ATR_MODE] !== 0) {
                    // 使用型アイテム の場合は、処理は使用時です。
                }
                else {
                    this.setMessageQueue(message, false, false, partsID, wwa_data.PartsType.OBJECT, pos.clone());
                    this.appearParts(pos, wwa_data.AppearanceTriggerType.OBJECT, partsID);
                }
            }
            catch (e) {
                // これ以上、アイテムを持てません
                if (this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM] !== "BLANK") {
                    this.setMessageQueue(this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM] === "" ?
                        "これ以上、アイテムを持てません。" :
                        this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM], false, true);
                }
            }
            this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
        };
        WWA.prototype._execObjectDoorEvent = function (pos, partsID, objAttr) {
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
        };
        WWA.prototype._execObjectYesNoChoiceEvent = function (pos, partsID, objAttr) {
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
        };
        WWA.prototype._execObjectLocalGateEvent = function (pos, partsID, mapAttr) {
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
            if (0 <= jx && 0 <= jy && jx < this._wwaData.mapWidth && jy < this._wwaData.mapWidth &&
                (jx !== playerPos.x || jy !== playerPos.y)) {
                this._player.jumpTo(new Position(this, jx, jy, 0, 0));
                this.playSound(this._wwaData.objectAttribute[partsID][Consts.ATR_SOUND]);
            }
        };
        WWA.prototype._execObjectUrlGateEvent = function (pos, partsID, mapAttr) {
            var messageID = this._wwaData.objectAttribute[partsID][Consts.ATR_STRING];
            if (!this._isURLGateEnable) {
                return;
            }
            if (this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "BLANK") {
                location.href = wwa_util.$escapedURI(this._wwaData.message[messageID].split(/\s/g)[0]);
                return;
            }
            this.setMessageQueue(this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK] === "" ?
                "他のページにリンクします。\nよろしいですか？" :
                this._wwaData.message[wwa_data.SystemMessage1.ASK_LINK], true, true);
            this._yesNoChoicePartsCoord = pos;
            this._yesNoChoicePartsID = partsID;
            this._yesNoChoiceCallInfo = wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS;
            this._yesNoURL = this._wwaData.message[messageID].split(/\s/g)[0];
        };
        WWA.prototype._execObjectScoreEvent = function (pos, partsID, mapAttr) {
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
        };
        WWA.prototype._execChoiceWindowRunningEvent = function () {
            var partsType;
            var gold;
            if (--this._yesNoDispCounter === 0) {
                if (this._yesNoJudge === wwa_data.YesNoState.YES) {
                    if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_MAP_PARTS) {
                        partsType = this._wwaData.mapAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                        if (partsType === Consts.MAP_URLGATE) {
                            location.href = wwa_util.$escapedURI(this._yesNoURL);
                        }
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS) {
                        partsType = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                        if (partsType === Consts.OBJECT_BUY) {
                            if (this._player.hasItem(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM])) {
                                this._player.removeItemByPartsID(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM]);
                                gold = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD];
                                this._player.earnGold(gold);
                                this.setStatusChangedEffect(new wwa_data.Status(0, 0, 0, gold));
                                this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.OBJECT, this._yesNoChoicePartsID);
                            }
                            else {
                                // アイテムを持っていない
                                if (this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM] !== "BLANK") {
                                    this._messageQueue.push(new wwa_message.MessageInfo(this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM] === "" ?
                                        "アイテムを持っていない。" : this._wwaData.message[wwa_data.SystemMessage1.NO_ITEM], true));
                                }
                                ;
                            }
                        }
                        else if (partsType === Consts.OBJECT_SELL) {
                            if (this._player.hasGold(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD])) {
                                if (this._player.canHaveMoreItems() || this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM] === 0) {
                                    if (this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM] !== 0) {
                                        this._player.addItem(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ITEM]);
                                    }
                                    var status = new wwa_data.Status(this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_ENERGY], this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_STRENGTH], this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_DEFENCE], -this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_GOLD] // 払うので、マイナスになります。
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
                                }
                                else {
                                    // アイテムをボックスがいっぱい
                                    if (this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM] !== "BLANK") {
                                        this._messageQueue.push(new wwa_message.MessageInfo(this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM] === "" ?
                                            "これ以上、アイテムを持てません。" : this._wwaData.systemMessage[wwa_data.SystemMessage2.FULL_ITEM], true));
                                    }
                                }
                            }
                            else {
                                // 所持金が足りない
                                if (this._wwaData.message[wwa_data.SystemMessage1.NO_MONEY] !== "BLANK") {
                                    this._messageQueue.push(new wwa_message.MessageInfo(this._wwaData.message[wwa_data.SystemMessage1.NO_MONEY] === "" ?
                                        "所持金がたりない。" : this._wwaData.message[wwa_data.SystemMessage1.NO_MONEY], true));
                                }
                            }
                        }
                        else if (partsType === Consts.OBJECT_SELECT) {
                            this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.CHOICE_YES, this._yesNoChoicePartsID);
                        }
                        else if (partsType === Consts.OBJECT_URLGATE) {
                            location.href = wwa_util.$escapedURI(this._yesNoURL);
                        }
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_ITEM_USE) {
                        this._player.readyToUseItem(this._yesNoUseItemPos);
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD])).classList.remove("onpress");
                        this._stopUpdateByLoadFlag = true;
                        this._loadType = wwa_data.LoadType.QUICK_LOAD;
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE])).classList.remove("onpress");
                        this._quickSave();
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_RESTART_GAME) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.RESTART_GAME])).classList.remove("onpress");
                        this._stopUpdateByLoadFlag = true;
                        this._loadType = wwa_data.LoadType.RESTART_GAME;
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_END_GAME) {
                        window.history.back(-1);
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA) {
                        location.href = wwa_util.$escapedURI(Consts.WWA_HOME);
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_LOAD) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD])).classList.remove("onpress");
                        this._player.setPasswordWindowWating();
                        this._passwordWindow.show(wwa_password_window.Mode.LOAD);
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_SAVE) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE])).classList.remove("onpress");
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
                }
                else if (this._yesNoJudge === wwa_data.YesNoState.NO) {
                    if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_MAP_PARTS) {
                        partsType = this._wwaData.mapAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                        if (partsType === Consts.MAP_URLGATE) {
                        }
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_OBJECT_PARTS) {
                        partsType = this._wwaData.objectAttribute[this._yesNoChoicePartsID][Consts.ATR_TYPE];
                        if (partsType === Consts.OBJECT_BUY) {
                        }
                        else if (partsType === Consts.OBJECT_SELL) {
                        }
                        else if (partsType === Consts.OBJECT_SELECT) {
                            this.appearParts(this._yesNoChoicePartsCoord, wwa_data.AppearanceTriggerType.CHOICE_NO, this._yesNoChoicePartsID);
                        }
                        else if (partsType === Consts.OBJECT_URLGATE) {
                        }
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_ITEM_USE) {
                        var bg = (wwa_util.$id("item" + (this._yesNoUseItemPos - 1)));
                        bg.classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_LOAD) {
                        if (this._usePassword) {
                            this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                            this.onpasswordloadcalled();
                            return;
                        }
                        else {
                            (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD])).classList.remove("onpress");
                        }
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_QUICK_SAVE) {
                        if (this._usePassword) {
                            this._yesNoJudge = wwa_data.YesNoState.UNSELECTED;
                            this.onpasswordsavecalled();
                            return;
                        }
                        else {
                            (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE])).classList.remove("onpress");
                        }
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_RESTART_GAME) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.RESTART_GAME])).classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_END_GAME) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_GOTO_WWA) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_LOAD) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_LOAD])).classList.remove("onpress");
                    }
                    else if (this._yesNoChoiceCallInfo === wwa_data.ChoiceCallInfo.CALL_BY_PASSWORD_SAVE) {
                        (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.QUICK_SAVE])).classList.remove("onpress");
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
        };
        WWA.prototype.setMessageQueue = function (message, showChoice, isSystemMessage, partsID, partsType, partsPosition, messageDisplayed) {
            if (partsID === void 0) { partsID = 0; }
            if (partsType === void 0) { partsType = wwa_data.PartsType.OBJECT; }
            if (partsPosition === void 0) { partsPosition = new Coord(0, 0); }
            if (messageDisplayed === void 0) { messageDisplayed = false; }
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
                    this._messageWindow.setPositionByPlayerPosition(this._faces.length !== 0, this._scoreWindow.isVisible(), isSystemMessage, this._player.getPosition(), this._camera.getPosition());
                    this._player.setMessageWaiting();
                    return true;
                }
                else {
                    if (this._messageQueue.length === 0) {
                        this._hideMessageWindow(messageDisplayed);
                    }
                    else {
                        this._setNextMessage();
                    }
                }
            }
            return false;
        };
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
        WWA.prototype.getMessageQueueByRawMessage = function (message, partsID, partsType, partsPosition, isSystemMessage) {
            if (isSystemMessage === void 0) { isSystemMessage = false; }
            // コメント削除
            var messageMain = message
                .split(/\n\<c\>/i)[0]
                .split(/\<c\>/i)[0]
                .replace(/\n\<p\>\n/ig, "<P>")
                .replace(/\n\<p\>/ig, "<P>")
                .replace(/\<p\>\n/ig, "<P>")
                .replace(/\<p\>/ig, "<P>");
            var messageQueue = [];
            if (messageMain !== "") {
                var rawQueue = messageMain.split(/\<p\>/ig);
                for (var j = 0; j < rawQueue.length; j++) {
                    var lines = rawQueue[j].split("\n");
                    var linesWithoutMacro = [];
                    var macroQueue = [];
                    for (var i = 0; i < lines.length; i++) {
                        var matchInfo = lines[i].match(/(\$(?:[a-zA-Z_][a-zA-Z0-9_]*)\=(?:.*))/);
                        if (matchInfo !== null && matchInfo.length >= 2) {
                            var macro = wwa_message.parseMacro(this, partsID, partsType, partsPosition, matchInfo[1]);
                            // マクロのエンキュー (最も左のものを対象とする。)
                            // それ以外のメッセージ、マクロは一切エンキューしない。(原作どおり)
                            // なので、「あああ$map=1,1,1」の「あああ」は表示されず、map文だけが処理される。
                            macroQueue.push(macro);
                            // 行頭コメントはpushしない
                        }
                        else if (!lines[i].match(/^\$/)) {
                            linesWithoutMacro.push(lines[i]);
                        }
                    }
                    messageQueue.push(new wwa_message.MessageInfo(linesWithoutMacro.join("\n"), isSystemMessage, j === rawQueue.length - 1, macroQueue));
                }
            }
            return messageQueue;
        };
        WWA.prototype.appearParts = function (pos, triggerType, triggerPartsID) {
            if (triggerPartsID === void 0) { triggerPartsID = 0; }
            var triggerPartsType;
            var rangeMin = (triggerType === wwa_data.AppearanceTriggerType.CHOICE_NO) ?
                Consts.APPERANCE_PARTS_MIN_INDEX_NO : Consts.APPERANCE_PARTS_MIN_INDEX;
            var rangeMax = (triggerType === wwa_data.AppearanceTriggerType.CHOICE_YES) ?
                Consts.APPERANCE_PARTS_MAX_INDEX_YES : Consts.APPERANCE_PARTS_MAX_INDEX;
            var targetPartsID;
            var targetPartsType;
            var targetX;
            var targetY;
            var targetPos;
            var i;
            if (triggerType === wwa_data.AppearanceTriggerType.MAP) {
                triggerPartsID = (triggerPartsID === 0) ? this._wwaData.map[pos.y][pos.x] : triggerPartsID;
                triggerPartsType = wwa_data.PartsType.MAP;
            }
            else {
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
                    targetX = this._player.getPosition().getPartsCoord().x;
                    this._player.resetEventExecutionInfo();
                }
                else if (targetX > Consts.RELATIVE_COORD_LOWER) {
                    targetX = pos.x + targetX - Consts.RELATIVE_COORD_BIAS;
                }
                if (targetY === Consts.PLAYER_COORD) {
                    targetY = this._player.getPosition().getPartsCoord().y;
                    this._player.resetEventExecutionInfo();
                }
                else if (targetY > Consts.RELATIVE_COORD_LOWER) {
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
                    }
                    else {
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
                }
                catch (e) {
                    // 範囲外座標の場合と範囲外IDの場合はパーツ指定がなかったことにする。
                }
            }
        };
        WWA.prototype.appearPartsByDirection = function (distance, targetPartsID, targetPartsType) {
            var ppos = this._player.getPosition().getPartsCoord();
            var pdir = this._player.getDir();
            var signX = wwa_data.vx[pdir];
            var signY = wwa_data.vy[pdir];
            this.appearPartsEval(ppos, (signX >= 0 ? "+" : "-") + (Math.abs(signX) * distance), (signY >= 0 ? "+" : "-") + (Math.abs(signY) * distance), targetPartsID, targetPartsType);
        };
        WWA.prototype.appearPartsEval = function (triggerPartsPos, xstr, ystr, targetPartsID, targetPartsType) {
            var targetX;
            var targetY;
            var ppos = this._player.getPosition().getPartsCoord();
            if (xstr === "P" || xstr === "p") {
                targetX = ppos.x;
            }
            else if (xstr[0] === "+") {
                targetX = triggerPartsPos.x + parseInt(xstr.substr(1));
            }
            else if (xstr[0] === "-") {
                targetX = triggerPartsPos.x - parseInt(xstr.substr(1));
            }
            else {
                targetX = parseInt(xstr);
                if (isNaN(targetX)) {
                    throw new Error("座標として解釈できない文字が含まれています。");
                }
            }
            if (ystr === "P" || ystr === "p") {
                targetY = ppos.y;
            }
            else if (ystr[0] === "+") {
                targetY = triggerPartsPos.y + parseInt(ystr.substr(1));
            }
            else if (ystr[0] === "-") {
                targetY = triggerPartsPos.y - parseInt(ystr.substr(1));
            }
            else {
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
                }
                else {
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
            }
            catch (e) {
                // 範囲外座標の場合と範囲外IDの場合はパーツ指定がなかったことにする。
            }
        };
        WWA.prototype._replaceRandomObject = function (pos) {
            var id = this._wwaData.mapObject[pos.y][pos.x];
            var type = this._wwaData.objectAttribute[id][Consts.ATR_TYPE];
            var newId;
            var randv;
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
        };
        WWA.prototype._replaceRandomObjectsInScreen = function () {
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
        };
        WWA.prototype._replaceAllRandomObjects = function () {
            for (var x = 0; x < this._wwaData.mapWidth; x++) {
                for (var y = 0; y < this._wwaData.mapWidth; y++) {
                    this._replaceRandomObject(new Coord(x, y));
                }
            }
        };
        WWA.prototype.gameover = function () {
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
        };
        WWA.prototype.setYesNoInput = function (yesNo) {
            this._yesNoJudgeInNextFrame = yesNo;
        };
        WWA.prototype.getYesNoState = function () {
            if (this._yesNoJudgeInNextFrame !== void 0) {
                return this._yesNoJudgeInNextFrame;
            }
            return this._yesNoJudge;
        };
        WWA.prototype.setStatusChangedEffect = function (additionalStatus) {
            if (additionalStatus.strength !== 0) {
                wwa_util.$id("disp-strength").classList.add("onpress");
                this._statusPressCounter.strength = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
            }
            if (additionalStatus.defence !== 0) {
                wwa_util.$id("disp-defence").classList.add("onpress");
                this._statusPressCounter.defence = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
            }
            if (additionalStatus instanceof wwa_data.Status) {
                if (additionalStatus.energy !== 0) {
                    wwa_util.$id("disp-energy").classList.add("onpress");
                    this._statusPressCounter.energy = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
                }
                if (additionalStatus.gold !== 0) {
                    wwa_util.$id("disp-gold").classList.add("onpress");
                    this._statusPressCounter.gold = Consts.STATUS_CHANGED_EFFECT_FRAME_NUM;
                }
            }
        };
        WWA.prototype.setPartsOnPosition = function (partsType, id, pos) {
            if (partsType === wwa_data.PartsType.MAP) {
                if (id >= this._wwaData.mapPartsMax) {
                    this._wwaData.map[pos.y][pos.x] = 0;
                }
                this._wwaData.map[pos.y][pos.x] = id;
            }
            else {
                if (id >= this._wwaData.objPartsMax) {
                    this._wwaData.mapObject[pos.y][pos.x] = 0;
                }
                this._wwaData.mapObject[pos.y][pos.x] = id;
            }
        };
        WWA.prototype._countSamePartsLength = function (data, startPos) {
            var i;
            for (i = startPos + 1; i < data.length; i++) {
                if (data[i] !== data[i - 1]) {
                    break;
                }
            }
            return i - startPos;
        };
        WWA.prototype._compressMap = function (map) {
            var dest = [];
            for (var y = 0; y < map.length; y++) {
                dest[y] = [];
                for (var x = 0; x < map[y].length;) {
                    var len = this._countSamePartsLength(map[y], x);
                    dest[y].push([map[y][x], len]);
                    x += (len);
                }
            }
            return dest;
        };
        WWA.prototype._decompressMap = function (compressedMap) {
            var dest = [];
            var x;
            for (var y = 0; y < compressedMap.length; y++) {
                dest[y] = [];
                x = 0;
                for (var i = 0; i < compressedMap[y].length; i++) {
                    var len = compressedMap[y][i][1]; // length
                    for (var j = 0; j < len; j++) {
                        dest[y].push(compressedMap[y][i][0]); // parts id
                    }
                }
            }
            return dest;
        };
        WWA.prototype._generateMapDataHash = function (data) {
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
        };
        WWA.prototype._generateSaveDataHash = function (data) {
            var maphash = this._generateMapDataHash(data);
            var text = maphash;
            var keyArray = [];
            for (var key in data) {
                if (key === "map" || key === "mapObject" ||
                    key === "mapCompressed" || key === "mapObjectCompressed" ||
                    key === "mapAttribute" || key === "objectAttribute" ||
                    key === "checkString") {
                    continue;
                }
                keyArray.push(key);
            }
            keyArray.sort();
            for (var i = 0; i < keyArray.length; i++) {
                text += wwa_util.arr2str4save(data[keyArray[i]]);
            }
            return CryptoJS.MD5(text).toString();
        };
        WWA.prototype._quickSave = function (isPassword) {
            if (isPassword === void 0) { isPassword = false; }
            var qd = JSON.parse(JSON.stringify(this._wwaData));
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
                return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(s), "^ /" + (this._wwaData.worldPassNumber * 231 + 8310 + qd.checkOriginalMapString) + "P+>A[]").toString();
            }
            this._quickSaveData = qd;
            util.$id("cell-load").textContent = "Quick Load";
            return "";
        };
        WWA.prototype._decodePassword = function (pass) {
            var ori = this._generateMapDataHash(this._restartData);
            try {
                var json = CryptoJS.AES.decrypt(pass, "^ /" + (this._wwaData.worldPassNumber * 231 + 8310 + ori) + "P+>A[]").toString(CryptoJS.enc.Utf8);
            }
            catch (e) {
                throw new Error("データが破損しています。\n" + e.message);
            }
            var obj;
            try {
                obj = JSON.parse(json);
            }
            catch (e) {
                throw new Error("マップデータ以外のものが暗号化されたか、マップデータに何かが不足しているようです。\nJSON PARSE FAILED");
            }
            return obj;
        };
        WWA.prototype._quickLoad = function (restart, password, apply) {
            if (restart === void 0) { restart = false; }
            if (password === void 0) { password = null; }
            if (apply === void 0) { apply = true; }
            if (!restart && this._quickSaveData === void 0 && password === null) {
                throw new Error("セーブデータがありません。");
            }
            var newData;
            if (password !== null) {
                newData = this._decodePassword(password);
            }
            else {
                newData = JSON.parse(JSON.stringify(restart ? this._restartData : this._quickSaveData));
            }
            // TODO: WWAEvalの属性変更対策, もう少しスマートなディープコピー方法考える
            newData.message = JSON.parse(JSON.stringify(this._restartData.message));
            newData.mapAttribute = JSON.parse(JSON.stringify(this._restartData.mapAttribute));
            newData.objectAttribute = JSON.parse(JSON.stringify(this._restartData.objectAttribute));
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
        };
        WWA.prototype._applyQuickLoad = function (newData) {
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
            }
            else {
                this.playSound(newData.bgm);
            }
            this.setImgClick(new Coord(newData.imgClickX, newData.imgClickY));
            if (this.getObjectIdByPosition(this._player.getPosition()) !== 0) {
                this._player.setPartsAppearedFlag();
            }
            this._wwaData = newData;
            this._replaceAllRandomObjects();
            this.updateCSSRule();
        };
        WWA.prototype._restartGame = function () {
            this._quickLoad(true);
        };
        WWA.prototype._fadeout = function (callback) {
            var borderWidth = 0;
            var size = Consts.MAP_WINDOW_WIDTH;
            var v = Consts.FADEOUT_SPEED; // borderの一本が増える速さ
            var elm = wwa_util.$id("wwa-fader");
            elm.style.display = "block";
            var timer = setInterval(function () {
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
        };
        WWA.prototype.moveObjects = function (playerIsMoving) {
            var camPos = this._camera.getPosition();
            var pPos = this._player.getPosition();
            var camCoord = camPos.getPartsCoord();
            // 物体が動く範囲は、カメラ内の11*11の1周外側も含む13*13
            var leftX = camPos.getPartsCoord().x;
            var topY = camPos.getPartsCoord().y;
            var objectsInNextFrame; // y - x
            var localX, localY;
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
                    }
                    catch (e) {
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
                    }
                    catch (e) {
                        continue;
                    }
                    var partsID = this._wwaData.mapObject[posc.y][posc.x];
                    if (partsID === 0 ||
                        this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] === wwa_data.MoveType.STATIC ||
                        this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_LOCALGATE ||
                        this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_RANDOM) {
                        continue;
                    }
                    // 作成ツールで空白の移動属性が指定でき、その場合に意図しない値が入ることがあるため、これらの属性でなければ静止とみなす.
                    if (this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] !== wwa_data.MoveType.CHASE_PLAYER &&
                        this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] !== wwa_data.MoveType.RUN_OUT &&
                        this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE] !== wwa_data.MoveType.HANG_AROUND) {
                        continue;
                    }
                    var moveMode = this._wwaData.objectAttribute[partsID][Consts.ATR_MOVE];
                    if (moveMode !== wwa_data.MoveType.HANG_AROUND) {
                        var candCoord = this._getCandidateCoord(playerIsMoving, pos, moveMode);
                        var xCand = new Coord(candCoord.x, posc.y);
                        var yCand = new Coord(posc.x, candCoord.y);
                        var thirdCand = null;
                        var randomCand;
                        if (this._objectCanMoveTo(playerIsMoving, candCoord, objectsInNextFrame)) {
                            this._setObjectsInNextFrame(posc, candCoord, leftX, topY, objectsInNextFrame, partsID);
                        }
                        else {
                            var mode = this._getSecondCandidateMoveMode(playerIsMoving, posc, candCoord, xCand, yCand, this._wwaData.objectAttribute[partsID][Consts.ATR_TYPE] === Consts.OBJECT_MONSTER, objectsInNextFrame);
                            if (mode === wwa_data.SecondCandidateMoveType.MODE_X) {
                                this._setObjectsInNextFrame(posc, xCand, leftX, topY, objectsInNextFrame, partsID);
                            }
                            else if (mode === wwa_data.SecondCandidateMoveType.MODE_Y) {
                                this._setObjectsInNextFrame(posc, yCand, leftX, topY, objectsInNextFrame, partsID);
                            }
                            else {
                                thirdCand = this._getThirdCandidate(playerIsMoving, pos, candCoord, moveMode, objectsInNextFrame);
                                // thirdCandを用いた第三候補の作成は WWA 3.10以降のみで有効
                                if (thirdCand !== null && this._wwaData.version >= 31) {
                                    this._setObjectsInNextFrame(posc, thirdCand, leftX, topY, objectsInNextFrame, partsID);
                                }
                                else {
                                    // うろうろする
                                    randomCand = this._getRandomMoveCoord(playerIsMoving, pos, objectsInNextFrame);
                                    this._setObjectsInNextFrame(posc, randomCand, leftX, topY, objectsInNextFrame, partsID);
                                }
                            }
                        }
                    }
                    else {
                        // うろうろする
                        randomCand = this._getRandomMoveCoord(playerIsMoving, pos, objectsInNextFrame);
                        this._setObjectsInNextFrame(posc, randomCand, leftX, topY, objectsInNextFrame, partsID);
                    }
                }
            }
        };
        WWA.prototype._getCandidateCoord = function (playerIsMoving, currentPos, moveType) {
            var currentCoord = currentPos.getPartsCoord();
            var playerOffsetCoord = this._player.getPosition().getOffsetCoord();
            var playerCoord = this._player.getPosition().getPartsCoord();
            try {
                var playerNextCoord = playerIsMoving ? this._player.getPosition().getNextJustPosition().getPartsCoord() : this._player.getPosition().getPartsCoord();
            }
            catch (e) {
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
            }
            else if (moveType === wwa_data.MoveType.RUN_OUT) {
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
        };
        WWA.prototype._getSecondCandidateMoveMode = function (playerIsMoving, current, firstCandidate, xCand, yCand, isMonster, objectsInNextFrame) {
            if (playerIsMoving && ((this._player.getDir() === wwa_data.Direction.UP || this._player.getDir() === wwa_data.Direction.DOWN) && isMonster ||
                (this._player.getDir() === wwa_data.Direction.LEFT || this._player.getDir() === wwa_data.Direction.RIGHT) && !isMonster)) {
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
        };
        WWA.prototype._getThirdCandidate = function (playerIsMoving, currentPos, firstCandidate, mode, objectsInNextFrame) {
            var dir = mode === wwa_data.MoveType.CHASE_PLAYER ? 1 :
                mode === wwa_data.MoveType.RUN_OUT ? -1 : 0;
            var npCoord = playerIsMoving ? this._player.getPosition().getNextJustPosition().getPartsCoord() : this._player.getPosition().getPartsCoord();
            var currentCoord = currentPos.getPartsCoord();
            var testCoord;
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
        };
        WWA.prototype._getRandomMoveCoord = function (playerIsMoving, currentPos, objectsInNextFrame) {
            var currentCoord = currentPos.getPartsCoord();
            var resultCoord = currentCoord.clone();
            var iterNum = this._wwaData.version < 31 ? Consts.RANDOM_MOVE_ITERATION_NUM_BEFORE_V31 : Consts.RANDOM_MOVE_ITERATION_NUM;
            for (var i = 0; i < iterNum; i++) {
                var rand = Math.floor(Math.random() * 8);
                resultCoord.x = currentCoord.x + wwa_data.vx[rand];
                resultCoord.y = currentCoord.y + wwa_data.vy[rand];
                if (this._objectCanMoveTo(playerIsMoving, resultCoord, objectsInNextFrame)) {
                    return resultCoord;
                }
            }
            return currentCoord;
        };
        WWA.prototype.isPrevFrameEventExecuted = function () {
            return this._prevFrameEventExected;
        };
        WWA.prototype._objectCanMoveTo = function (playerIsMoving, candCoord, objectsInNextFrame) {
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
            }
            else {
                if (objID !== 0) {
                    return false;
                }
            }
            if (playerIsMoving) {
                if (this._player.getPosition().getNextJustPosition().getPartsCoord().equals(candCoord)) {
                    return false;
                }
            }
            else {
                if (this._player.getPosition().getPartsCoord().equals(candCoord)) {
                    return false;
                }
            }
            return true;
        };
        WWA.prototype._setObjectsInNextFrame = function (currentCoord, candCoord, leftX, topY, objectsInNextFrame, partsID) {
            var targetX = candCoord.x - leftX + 1;
            var targetY = candCoord.y - topY + 1;
            if (0 <= candCoord.x && candCoord.x <= this._wwaData.mapWidth && 0 <= candCoord.y && candCoord.y <= this._wwaData.mapWidth) {
                if (0 <= targetX && targetX < objectsInNextFrame.length && 0 <= targetY && targetY < objectsInNextFrame.length) {
                    objectsInNextFrame[currentCoord.y - topY + 1][currentCoord.x - leftX + 1] = 0;
                    objectsInNextFrame[candCoord.y - topY + 1][candCoord.x - leftX + 1] = partsID;
                    this.hoge[candCoord.y - topY + 1][candCoord.x - leftX + 1] = partsID;
                }
                this._objectMovingDataManager.add(partsID, currentCoord.convertIntoPosition(this), candCoord.convertIntoPosition(this), currentCoord.getDirectionTo(candCoord));
            }
        };
        WWA.prototype.launchBattleEstimateWindow = function () {
            var cpParts = this._camera.getPosition().getPartsCoord();
            var xLeft = Math.max(0, cpParts.x);
            var xRight = Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW - 1);
            var yTop = Math.max(0, cpParts.y);
            var yBottom = Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW - 1);
            var monsterList = [];
            this.playSound(wwa_data.SystemSound.DECISION);
            for (var x = xLeft; x <= xRight; x++) {
                for (var y = yTop; y <= yBottom; y++) {
                    var pid = this._wwaData.mapObject[y][x];
                    if (this._wwaData.objectAttribute[pid][Consts.ATR_TYPE] === Consts.OBJECT_MONSTER) {
                        if (monsterList.indexOf(pid) === -1) {
                            monsterList.push(pid);
                        }
                    }
                }
            }
            if (this._useBattleReportButton) {
                (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.add("onpress");
            }
            if (monsterList.length === 0) {
                (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
                this.hideBattleEstimateWindow();
                return false;
            }
            this._battleEstimateWindow.update(this._player.getStatus(), monsterList);
            this._battleEstimateWindow.show();
            this._player.setEstimateWindowWating();
            return true;
        };
        WWA.prototype.hideBattleEstimateWindow = function () {
            this._battleEstimateWindow.hide();
            this._player.clearEstimateWindowWaiting();
            (wwa_util.$id(wwa_data.sidebarButtonCellElementID[wwa_data.SidebarButton.GOTO_WWA])).classList.remove("onpress");
        };
        WWA.prototype.hidePasswordWindow = function (isCancel) {
            if (isCancel === void 0) { isCancel = false; }
            this._passwordWindow.hide();
            if (isCancel || this._passwordWindow.mode === wwa_password_window.Mode.SAVE) {
                this._player.clearPasswordWindowWaiting();
                return;
            }
            try {
                var data = this._quickLoad(false, this._passwordWindow.password, false);
            }
            catch (e) {
                this._player.clearPasswordWindowWaiting();
                // 読み込み失敗
                alert("パスワードが正常ではありません。\nエラー詳細:\n" + e.message);
                return;
            }
            this._passwordLoadExecInNextFrame = true;
            this._passwordSaveExtractData = data;
        };
        WWA.prototype._displayHelp = function () {
            if (!this._useHelp) {
                //パスワードなしの場合はヘルプを開かない
                return;
            }
            if (this._player.isControllable()) {
                this.setMessageQueue("　【ショートカットキーの一覧】\n" +
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
                    Math.floor(this._wwaData.version / 10) + "." + this._wwaData.version % 10, false, true);
            }
        };
        WWA.prototype._setNextMessage = function (displayCenter) {
            if (displayCenter === void 0) { displayCenter = false; }
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
            }
            else {
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
                    this._messageWindow.setPositionByPlayerPosition(this._faces.length !== 0, this._scoreWindow.isVisible(), displayCenter, this._player.getPosition(), this._camera.getPosition());
                    this._messageWindow.show();
                }
                else {
                    if (this._messageQueue.length === 0) {
                        this._hideMessageWindow();
                    }
                    else {
                        this._setNextMessage();
                    }
                }
            }
        };
        WWA.prototype._hideMessageWindow = function (messageDisplayed) {
            if (messageDisplayed === void 0) { messageDisplayed = true; }
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
            }
            else {
                this.setMessageQueue(this.getMessageById(mesID), false, false, itemID, wwa_data.PartsType.OBJECT, this._player.getPosition().getPartsCoord(), true);
            }
        };
        WWA.prototype.replaceParts = function (srcID, destID, partsType, onlyThisSight) {
            if (partsType === void 0) { partsType = wwa_data.PartsType.OBJECT; }
            if (onlyThisSight === void 0) { onlyThisSight = false; }
            var cpParts = this._camera.getPosition().getPartsCoord();
            var xLeft = onlyThisSight ? Math.max(0, cpParts.x) : 0;
            var xRight = onlyThisSight ? Math.min(this._wwaData.mapWidth - 1, cpParts.x + Consts.H_PARTS_NUM_IN_WINDOW - 1) : this._wwaData.mapWidth - 1;
            var yTop = onlyThisSight ? Math.max(0, cpParts.y) : 0;
            var yBottom = onlyThisSight ? Math.min(this._wwaData.mapWidth - 1, cpParts.y + Consts.V_PARTS_NUM_IN_WINDOW) - 1 : this._wwaData.mapWidth - 1;
            for (var x = xLeft; x <= xRight; x++) {
                for (var y = yTop; y <= yBottom; y++) {
                    if (partsType === wwa_data.PartsType.OBJECT) {
                        var pid = this._wwaData.mapObject[y][x];
                        if (pid === srcID) {
                            this._wwaData.mapObject[y][x] = destID;
                        }
                    }
                    else {
                        var pid = this._wwaData.map[y][x];
                        if (pid === srcID) {
                            this._wwaData.map[y][x] = destID;
                        }
                    }
                }
            }
        };
        WWA.prototype.getYesNoImgCoord = function () {
            return new Coord(this._wwaData.yesnoImgPosX, this._wwaData.yesnoImgPosY);
        };
        WWA.prototype.setYesNoImgCoord = function (coord) {
            this._wwaData.yesnoImgPosX = coord.x;
            this._wwaData.yesnoImgPosY = coord.y;
            return coord;
        };
        WWA.prototype.getPlayerImgCoord = function () {
            return new Coord(this._wwaData.playerImgPosX, this._wwaData.playerImgPosY);
        };
        WWA.prototype.setPlayerImgCoord = function (coord) {
            this._wwaData.playerImgPosX = coord.x;
            this._wwaData.playerImgPosY = coord.y;
            return coord;
        };
        WWA.prototype.setPlayerEnergyMax = function (eng) {
            return this._player.setEnergyMax(eng);
        };
        WWA.prototype.getMapPartsNum = function () {
            return this._wwaData.mapPartsMax;
        };
        WWA.prototype.getObjectPartsNum = function () {
            return this._wwaData.objPartsMax;
        };
        WWA.prototype.setMoveMacroWaitingToPlayer = function (moveNum) {
            this._reservedMoveMacroTurn = moveNum;
        };
        WWA.prototype.disableSave = function (flag) {
            return this._wwaData.disableSaveFlag = flag;
        };
        WWA.prototype.isOldMap = function () {
            return this._wwaData.isOldMap;
        };
        WWA.prototype.setOldMap = function (flag) {
            return this._wwaData.isOldMap = flag;
        };
        WWA.prototype.setObjectNotCollapseOnPartsOnPlayer = function (flag) {
            return this._wwaData.objectNoCollapseDefaultFlag = flag;
        };
        WWA.prototype.setGameOverPosition = function (pos) {
            if (pos.x < 0 || pos.x >= this.getMapWidth() || pos.y < 0 || pos.y >= this.getMapWidth()) {
                throw new Error("マップの範囲外が指定されています!");
            }
            this._wwaData.gameoverX = pos.x;
            this._wwaData.gameoverY = pos.y;
            return pos;
        };
        WWA.prototype.setPlayerStatus = function (type, value) {
            if (type === wwa_data.MacroStatusIndex.ENERGY) {
                this._player.setEnergy(value);
            }
            else if (type === wwa_data.MacroStatusIndex.STRENGTH) {
                this._player.setStrength(value);
            }
            else if (type === wwa_data.MacroStatusIndex.DEFENCE) {
                this._player.setDefence(value);
            }
            else if (type === wwa_data.MacroStatusIndex.GOLD) {
                this._player.setGold(value);
            }
            else if (type === wwa_data.MacroStatusIndex.MOVES) {
                this._player.setMoveCount(value);
            }
            else {
                throw new Error("未定義のステータスタイプです");
            }
            // ステータス変更アニメーションは対応なし (原作通り)
        };
        WWA.prototype.setDelPlayer = function (flag) {
            return this._wwaData.delPlayerFlag = flag;
        };
        WWA.prototype.setPlayerGetItem = function (pos, id) {
            try {
                this._player.addItem(id, pos, true);
            }
            catch (e) {
                // アイテムを持てない時、メッセージを出さない。
            }
        };
        WWA.prototype.setFrameCoord = function (coord) {
            return this._frameCoord = coord.clone();
        };
        WWA.prototype.setBattleEffectCoord = function (coord) {
            return this._battleEffectCoord = coord.clone();
        };
        WWA.prototype.canInput = function () {
            return !this._temporaryInputDisable;
        };
        WWA.prototype.setWaitTime = function (time) {
            this._waitTimeInCurrentFrame += time;
            this._temporaryInputDisable = true;
        };
        WWA.prototype.setEffect = function (waits, coords) {
            this._wwaData.effectWaits = waits;
            this._wwaData.effectCoords = coords;
        };
        WWA.prototype.stopEffect = function () {
            this._wwaData.effectCoords = [];
        };
        WWA.prototype.setImgClick = function (pos) {
            this._wwaData.imgClickX = pos.x;
            this._wwaData.imgClickY = pos.y;
            if (pos.equals(new Coord(0, 0))) {
                // reset
                Array.prototype.forEach.call(wwa_util.$qsAll(".item-cell>.item-click-border"), function (node) {
                    node.style.backgroundImage = "url('" + wwa_data.WWAConsts.ITEM_BORDER_IMG_DATA_URL + "')";
                    node.style.backgroundPosition = "0 0";
                });
            }
            else {
                var escapedFilename = this._wwaData.mapCGName.replace("(", "\\(").replace(")", "\\)");
                Array.prototype.forEach.call(wwa_util.$qsAll(".item-cell>.item-click-border"), function (node) {
                    node.style.backgroundImage = "url('" + escapedFilename + "')";
                    node.style.backgroundPosition = "-" + pos.x * Consts.CHIP_SIZE + "px -" + pos.y * Consts.CHIP_SIZE + "px";
                });
            }
        };
        WWA.prototype.addFace = function (face) {
            this._faces.push(face);
        };
        WWA.prototype.clearFaces = function () {
            this._faces = [];
        };
        WWA.prototype.initCSSRule = function () {
            this._styleElm = wwa_util.$id(Consts.WWA_STYLE_TAG_ID);
            this._sheet = this._styleElm.sheet;
            this.updateCSSRule();
        };
        WWA.prototype.updateCSSRule = function () {
            var messageOpacity = this._isClassicModeEnable ? 1 : 0.9;
            if (this._stylePos === void 0) {
                this._stylePos = new Array(2);
            }
            else {
                if (this._sheet.addRule !== void 0) {
                    for (var i = 0; i < this._stylePos.length; i++) {
                        this._sheet.removeRule(this._stylePos[this._styleElm[i]]);
                    }
                }
                else {
                    for (var i = 0; i < this._stylePos.length; i++) {
                        this._sheet.deleteRule(this._stylePos[this._styleElm[i]]);
                    }
                }
            }
            if (this._sheet.addRule !== void 0) {
                this._stylePos[wwa_data.SelectorType.MESSAGE_WINDOW] = this._sheet.addRule("div.wwa-message-window, div#wwa-battle-estimate, div#wwa-password-window", "background-color: rgba(" + this._wwaData.frameColorR + "," + this._wwaData.frameColorG + "," + this._wwaData.frameColorB + ", " + messageOpacity + ");" +
                    "border-color: rgba(" + this._wwaData.frameOutColorR + "," + this._wwaData.frameOutColorG + "," + this._wwaData.frameOutColorB + ", 1);" +
                    "color: rgba(" + this._wwaData.fontColorR + "," + this._wwaData.fontColorG + "," + this._wwaData.fontColorB + ", 1);");
                this._stylePos[wwa_data.SelectorType.SIDEBAR] = this._sheet.addRule("div#wwa-sidebar", "color: rgba(" + this._wwaData.statusColorR + "," + this._wwaData.statusColorG + "," + this._wwaData.statusColorB + ",1);" +
                    "font-weight: bold;");
            }
            else {
                this._stylePos[wwa_data.SelectorType.MESSAGE_WINDOW] = this._sheet.insertRule("div.wwa-message-window, div#wwa-battle-estimate, div#wwa-password-window {\n" +
                    "background-color: rgba(" + this._wwaData.frameColorR + "," + this._wwaData.frameColorG + "," + this._wwaData.frameColorB + ", " + messageOpacity + ");\n" +
                    "border-color: rgba(" + this._wwaData.frameOutColorR + "," + this._wwaData.frameOutColorG + "," + this._wwaData.frameOutColorB + ", 1);\n" +
                    "color: rgba(" + this._wwaData.fontColorR + "," + this._wwaData.fontColorG + "," + this._wwaData.fontColorB + ", 1);\n" +
                    "}", 0);
                this._stylePos[wwa_data.SelectorType.SIDEBAR] = this._sheet.insertRule("div#wwa-sidebar {\n" +
                    "color: rgba(" + this._wwaData.statusColorR + "," + this._wwaData.statusColorG + "," + this._wwaData.statusColorB + ",1);\n" +
                    "font-weight: bold;\n" +
                    "}", 1);
            }
        };
        WWA.prototype.changeStyleRule = function (type, r, g, b) {
            if (type === wwa_data.ChangeStyleType.COLOR_FRAME) {
                this._wwaData.frameColorR = r;
                this._wwaData.frameColorG = g;
                this._wwaData.frameColorB = b;
            }
            else if (type === wwa_data.ChangeStyleType.COLOR_FRAMEOUT) {
                this._wwaData.frameOutColorR = r;
                this._wwaData.frameOutColorG = g;
                this._wwaData.frameOutColorB = b;
            }
            else if (type === wwa_data.ChangeStyleType.COLOR_STR) {
                this._wwaData.fontColorR = r;
                this._wwaData.fontColorG = g;
                this._wwaData.fontColorB = b;
            }
            else if (type === wwa_data.ChangeStyleType.COLOR_STATUS_STR) {
                this._wwaData.statusColorR = r;
                this._wwaData.statusColorG = g;
                this._wwaData.statusColorB = b;
            }
            this.updateCSSRule();
        };
        WWA.prototype.showMonsterWindow = function () {
            this._monsterWindow.show();
        };
        WWA.prototype.isClassicMode = function () {
            return this._isClassicModeEnable;
        };
        WWA.prototype.isConsoleOutputMode = function () {
            return this._useConsole;
        };
        return WWA;
    }());
    wwa_main.WWA = WWA;
    ;
    var isCopyRightClick = false;
    function start() {
        if (window["wwap_mode"] === void 0) {
            wwap_mode = false;
        }
        Array.prototype.forEach.call(util.$qsAll("a.wwa-copyright"), function (node) {
            node.addEventListener("click", function () {
                isCopyRightClick = true;
            });
        });
        window.addEventListener("beforeunload", function (e) {
            var mes = "このページを離れますか？";
            if (isCopyRightClick) {
                isCopyRightClick = false;
                e.returnValue = mes; // Gecko and Trident
                return mes; // Gecko and WebKit
            }
        });
        var titleImgName = wwap_mode ?
            Consts.WWAP_SERVER + "/" + Consts.WWAP_SERVER_TITLE_IMG :
            util.$id("wwa-wrapper").getAttribute("data-wwa-title-img");
        wwa_inject_html.inject(util.$id("wwa-wrapper"), titleImgName);
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
        wwa = new WWA(mapFileName, loaderFileName, urlgateEnabled, titleImgName, classicModeEnabled, audioDirectory);
    }
    if (document.readyState === "complete") {
        setTimeout(start);
    }
    else {
        window.addEventListener("load", start);
    }
})(wwa_main || (wwa_main = {}));
