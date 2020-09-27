import {
    WWAButtonTexts,
    WWAData,
    ChoiceCallInfo
} from "../wwa_data";
import * as util from "../wwa_util";
import { WWA } from "../wwa_main";
import { Player } from "../wwa_parts_player"; 
import WWASaveData from "./WWASaveData";
import WWASaveDataList from "./WWASaveDataList";
import WWASaveDataDBList from "./WWASaveDataDBList";
import WWASaveDataLogList from "./WWASaveDataLogList";

/**
 * WWA のセーブデータを管理するシステムのクラスです。
 */
export default class WWASave {
    /**
     * @see WWA.checkOriginalMapString
     */
    public static checkOriginalMapString: string;
    public static worldName: string;
    public static disAllowLoadOldSave: boolean;
    /**
     * Quick Save で保存されるセーブデータ領域です。
     */
    private _wwaDBSaveList: WWASaveDataDBList;
    /**
     * オートセーブで保存されるセーブデータ領域です。
     */
    private _wwaLogSaveList: WWASaveDataLogList;
    public list: WWASaveDataList;

    /**
     * @param wwa WWA インスタンス本体
     * @param worldName WWA マップデータのワールド名
     * @param disAllowLoadOldSave アップデート前のセーブデータの読み込みを許可するか
     */
    public constructor(wwa: WWA, worldName: string, disAllowLoadOldSave: boolean) {
        WWASave.checkOriginalMapString = wwa.checkOriginalMapString;
        WWASave.worldName = worldName;
        WWASave.disAllowLoadOldSave = disAllowLoadOldSave;
        this._wwaDBSaveList = new WWASaveDataDBList();
        this._wwaLogSaveList = new WWASaveDataLogList();
        this.selectDBSaveDataList();
    }
    public resumeStart() {
        this._wwaLogSaveList.resumeStart();
    }
    public isAutoSaveFrame(player: Player): boolean {
        return this._wwaLogSaveList.isAutoSaveFrame(player);
    }
    public autoSave(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData) {
        this._wwaLogSaveList.autoSave(gameCvs, _quickSaveData);
    }
    public selectDBSaveDataList() {
        this.list = this._wwaDBSaveList;
    }
    public selectLogSaveDataList() {
        this.list = this._wwaLogSaveList;
    }
    /**
     * @param gameCvs セーブ時点のフィールド画面の Canvas 要素
     * @param _quickSaveData セーブデータ本体
     * @param id セーブしたい場所
     */
    public save(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData, id: number): boolean {
        var saveData: WWASaveData = this.list[id];
        if (!saveData) {
            return false;
        }
        return saveData.save(gameCvs, _quickSaveData);
    }
    public load(id: number): WWAData {
        var saveData: WWASaveData = this.list[id];
        if (!saveData) {
            return null;
        }
        return saveData.load();
    }
    public hasSaveData(): boolean {
        return this.list.hasSaveData();
    }
    public setAutoSaveInterval(autoInterval: number): void {
        return this._wwaLogSaveList.setAutoSaveInterval(autoInterval);
    } 

    public getFirstSaveChoiceCallInfo(forcePassword: boolean): ChoiceCallInfo {
        if (forcePassword) {
            return ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
        }
        if (this._wwaDBSaveList.hasSaveData()) {
            return ChoiceCallInfo.CALL_BY_QUICK_LOAD;
        }
        if (this._wwaLogSaveList.hasSaveData()) {
            return ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD;
        }
        return ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
    }
    public getSecondSaveChoiceCallInfo(usePassword: boolean): ChoiceCallInfo {
        if (this.list === this._wwaDBSaveList) {
            //DBクイックセーブを参照中
            if (this._wwaLogSaveList.hasSaveData()) {
                //セーブログがある場合そちらを利用
                return ChoiceCallInfo.CALL_BY_LOG_QUICK_LOAD;
            }
        }
        if (usePassword) {
            return ChoiceCallInfo.CALL_BY_PASSWORD_LOAD;
        }
        return ChoiceCallInfo.NONE;
    }

    public gameStart(wwaData: WWAData, player: Player) {
        this._wwaLogSaveList.setPlayer(player);
        this.quickSaveButtonUpdate(wwaData);
    }
    public quickSaveButtonUpdate(wwaData: WWAData): void {
        if (!wwaData.disableSaveFlag) {
            // セーブ可能
            util.$id("cell-save").textContent = WWAButtonTexts.QUICK_SAVE;
        } else {
            // セーブ不可
            util.$id("cell-save").textContent = WWAButtonTexts.EMPTY_SAVE;
        }
    }
}
