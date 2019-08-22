import {
    WWAData
} from "../wwa_data";
import * as util from "../wwa_util";
import WWACompress from "./WWACompress";
import WWASaveData from "./WWASaveData";
import WWASaveDataDBList from "./WWASaveDataDBList";

export default class WWASaveDataDB extends WWASaveData {
    public saveDataDecompress(dbSaveData):void {
        var quickSaveData = WWACompress.decompress(dbSaveData.data);
        this.saveDataSet(dbSaveData.image, dbSaveData.data, quickSaveData.statusEnergy, dbSaveData.date);
    }
    public save(gameCvs: HTMLCanvasElement, _quickSaveData: WWAData): boolean {
        var flag: boolean = super.save.apply(this, arguments);
        (this._parent as WWASaveDataDBList).dbUpdateSaveData(this._id, gameCvs, this.compressData, this.date);
        return flag;
    }
}