import {
    WWAConsts,
    WWAData,
    ChoiceCallInfo,
    BROWSER_TYPE
} from "../wwa_data";
import { MessageWindow } from "../wwa_message";
import { WWA } from "../wwa_main";
import { Player } from "../wwa_parts_player"; 
import WWASaveData from "./WWASaveData";
import WWASaveDataList from "./WWASaveDataList";
import WWASaveDataDBList from "./WWASaveDataDBList";
import WWASaveDataLogList from "./WWASaveDataLogList";

export default class WWASave {
    private _messageWindow: MessageWindow;
    public static checkOriginalMapString: string;
    private _wwaDBSaveList: WWASaveDataDBList;
    private _wwaLogSaveList: WWASaveDataLogList;
    public list: WWASaveDataList;

    public constructor(wwa: WWA) {
        WWASave.checkOriginalMapString = wwa.checkOriginalMapString;
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
    public setPlayer(player: Player) {
        this._wwaLogSaveList.setPlayer(player);
    }
    public selectDBSaveDataList() {
        this.list = this._wwaDBSaveList;
    }
    public selectLogSaveDataList() {
        this.list = this._wwaLogSaveList;
    }
    save(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData, id: number): boolean {
        var saveData: WWASaveData = this.list[id];
        if (!saveData) {
            return false;
        }
        return saveData.save(gameCvs, _quickSaveData);
    }
    load(id:number): WWAData {
        var saveData: WWASaveData = this.list[id];
        if (!saveData) {
            return null;
        }
        return saveData.load();
    }
    hasSaveData(): boolean {
        return this.list.hasSaveData();
    }
    setAutoSaveInterval(autoInterval: number): void {
        return this._wwaLogSaveList.setAutoSaveInterval(autoInterval);
    } 


    getFirstSaveChoiceCallInfo(forcePassword: boolean, usePassword: boolean): ChoiceCallInfo {
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
    getSecondSaveChoiceCallInfo(usePassword: boolean): ChoiceCallInfo {
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
}