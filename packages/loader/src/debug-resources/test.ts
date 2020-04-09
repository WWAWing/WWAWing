import { BrowserEventEmitter } from "@wwawing/event-emitter";
import { WWALoader, WWALoaderEventEmitter } from "..";
import { WWAData } from "@wwawing/common-interface";

const EXTRACTING_MAPDATA_FILENAME = "wwamap.dat"; // 吸い出すファイル名

let t_start: Date;
let t_end: Date;

const $id = (id: string) => document.getElementById(id) as HTMLInputElement;

const display = (data: WWAData) => {
    t_end = new Date();

    console.log(data);   

    ($id("loadTime")).value = `${t_end.getTime() - t_start.getTime()}`;

    const ids = [
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
    
    for (let i in ids) {
        const key = ids[i];
        try {
            ($id(key)).value = data[key];
        } catch (e) {
            throw new Error("Display Error!! index: " + key);
        }
    }
}

const main = () => {
    t_start = new Date();
    const eventEmitter: WWALoaderEventEmitter = new BrowserEventEmitter();
    eventEmitter.addListener("mapData", (wwaMap) => display(wwaMap));
    eventEmitter.addListener("progress", (progress) => {
        ($id("progressCurrent")).value = `${progress.current}`;
        ($id("progressTotal")).value = `${progress.total}`;
        ($id("progressStage")).value = `${progress.stage}`;
   });
   eventEmitter.addListener("error", (error) => alert(error.message));

   const loader = new WWALoader(EXTRACTING_MAPDATA_FILENAME, eventEmitter);
   loader.requestMapData();
};

window.addEventListener("load", main);
