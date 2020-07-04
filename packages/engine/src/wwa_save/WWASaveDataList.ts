import {
    WWASaveConsts
} from "../wwa_data";
import WWASaveData from "./WWASaveData";

export default class WWASaveDataList extends Array<WWASaveData> {
    constructor() {
        super();
        Object.setPrototypeOf(this, Object.create(WWASaveDataList.prototype));
    }

    public hasSaveData(): boolean {
        for (var i = 0; i < WWASaveConsts.QUICK_SAVE_MAX; i++) {
            if (this[i].flag) {
                return true;
            }
        }
        return false;
    }
    /**
     * 最後にセーブした箇所を返す
    */
    public getLastSaveData(): WWASaveData {
        var lastSaveData: WWASaveData, wwaSaveData: WWASaveData;
        for (var i = 0; i < WWASaveConsts.QUICK_SAVE_MAX; i++) {
            wwaSaveData = this[i];
            if (!wwaSaveData.flag) {
                continue;
            }
            if (lastSaveData) {
                if ((wwaSaveData.date) && (lastSaveData.date)){
                    if (wwaSaveData.date.getTime() > lastSaveData.date.getTime()) {
                        lastSaveData = wwaSaveData;
                    }
                }
            } else {
                lastSaveData = wwaSaveData;
            }
        }
        return lastSaveData;
    }
}
