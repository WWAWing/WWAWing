import { CustomEventEmitter } from "@wwawing/event-emitter";
import { WWALoader } from "..";

const EXTRACTING_MAPDATA_FILENAME = "wwamap.dat"; // 吸い出すファイル名

let t_start: Date;
let t_end: Date;

const $id = function (id: string) {
    return document.getElementById(id) as HTMLInputElement;
};

const disp = function (data) {
    t_end = new Date();

    console.log(data);   

    ($id("loadTime")).value = `${t_end.getTime() - t_start.getTime()}`;

    var ids = [
       "playerX",
       "playerY",
       "gameoverX",
       "gameoverY",
       "mapPartsMax",
       "objPartsMax",
       "statusEnergyMax",
       "statusEnergy",
       "statusStrength",
       "statusDefence",
       "statusGold",
       "mapWidth",
       "messageNum",
       "worldName",
       "mapCGName"
    ];
    
    for (var i in ids) {
        var key = ids[i];
        try {
            ($id(key)).value = data[key];
        } catch (e) {
            throw new Error("Display Error!! index: " + key);
        }
    }
}

const main = function () {
    t_start = new Date();
    const eventEmitter = new CustomEventEmitter();
    eventEmitter.addListener("mapData", (wwaMap) => disp(wwaMap));
    eventEmitter.addListener("progress", (progress) => {
        ($id("progressCurrent")).value = progress.current;
        ($id("progressTotal")).value = progress.total;
        ($id("progressStage")).value = progress.stage;
   });
   eventEmitter.addListener("error", (error) => alert(error.message));

   const loader = new WWALoader(EXTRACTING_MAPDATA_FILENAME, eventEmitter);
   loader.requestMapData();
};

window.addEventListener("load", function () { main(); });
