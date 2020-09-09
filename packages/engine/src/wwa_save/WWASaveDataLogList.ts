import {
    WWASaveConsts,
    WWAData
} from "../wwa_data";
import WWASaveDataLog from "./WWASaveDataLog";
import WWASaveDataList from "./WWASaveDataList";
import { Player } from "../wwa_parts_player";

export default class WWASaveDataLogList extends WWASaveDataList {
    private _saveNo: number = 0;
    private _lastAutoSaveMove: number = 0;
    private _autoInterval: number;
    public constructor() {
        super();
        this._autoInterval = WWASaveConsts.SAVE_INTERVAL_MOVE;
        Object.setPrototypeOf(this, Object.create(WWASaveDataLogList.prototype));
        for (var i = 0; i < WWASaveConsts.QUICK_SAVE_MAX; i++) {
            this[i] = new WWASaveDataLog(i, this);
        }
        this._saveNo = 0;
        this._lastAutoSaveMove = 0;
    }
    public resumeStart(): void {
        this._lastAutoSaveMove = -1;
    }
    public setPlayer(player: Player): void {
        this._lastAutoSaveMove = player.getMoveCount();
    }
    public isAutoSaveFrame(player: Player): boolean {
        if (this._autoInterval === 0) {
            //オートセーブなし
            return false;
        }
        var moves = player.getMoveCount();
        if (this._lastAutoSaveMove >= moves) {
            //既に保存したフレーム
            return false;
        }
        if (moves % this._autoInterval !== 0) {
            //セーブしない
            return false;
        }
        this._lastAutoSaveMove = moves;
        return true;
    }
    public autoSave(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData): void {
        this[this._saveNo].save(gameCvs, _quickSaveData);
        this._saveNo++;
        this._saveNo = this._saveNo % WWASaveConsts.QUICK_SAVE_MAX;
    }
    public setAutoSaveInterval(autoInterval: number): void {
        this._autoInterval = autoInterval | 0;
    } 
}
