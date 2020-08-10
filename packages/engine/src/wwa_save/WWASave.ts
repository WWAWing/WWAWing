import {
    WWAConsts,
    WWAButtonTexts,
    WWAData,
    ChoiceCallInfo,
    BROWSER_TYPE
} from "../wwa_data";
import * as util from "../wwa_util";
import { WWA } from "../wwa_main";
import { Player } from "../wwa_parts_player"; 
import WWASaveData from "./WWASaveData";
import WWASaveDataList from "./WWASaveDataList";
import WWASaveDataDBList from "./WWASaveDataDBList";
import WWASaveDataLogList from "./WWASaveDataLogList";

export default class WWASave {
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
    public selectDBSaveDataList() {
        this.list = this._wwaDBSaveList;
    }
    public selectLogSaveDataList() {
        this.list = this._wwaLogSaveList;
    }
    public save(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData, id: number): boolean {
        var saveData: WWASaveData = this.list[id];
        if (!saveData) {
            return false;
        }
        return saveData.save(gameCvs, _quickSaveData);
    }
    public load(id:number): WWAData {
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


    public getFirstSaveChoiceCallInfo(forcePassword: boolean, usePassword: boolean): ChoiceCallInfo {
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
    public quickSaveButtonUpdate(wwaData: WWAData):void{
        if (!wwaData.disableSaveFlag) {
            // セーブ可能
            util.$id("cell-save").textContent = WWAButtonTexts.QUICK_SAVE;
        } else {
            // セーブ不可
            util.$id("cell-save").textContent = WWAButtonTexts.EMPTY_SAVE;
        }
    }
}
