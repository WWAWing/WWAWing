import {
    WWASaveConsts
} from "../wwa_data";
import WWASaveData from "./WWASaveData";

export default class WWASaveDataList extends Array<WWASaveData> {
    constructor() {
        super();
        Object.setPrototypeOf(this, Object.create(WWASaveDataList.prototype));
    }

    hasSaveData(): boolean {
        for (var i = 0; i < WWASaveConsts.QUICK_SAVE_MAX; i++) {
            if (this[i].flag) {
                return true;
            }
        }
        return false;
    }
}
