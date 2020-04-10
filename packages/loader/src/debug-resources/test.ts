import { BrowserEventEmitter } from "@wwawing/event-emitter";
import { WWALoader, WWALoaderEventEmitter } from "..";
import { WWAData } from "@wwawing/common-interface";

const EXTRACTING_MAPDATA_FILENAME = "wwamap.dat"; // 吸い出すファイル名

const $id = (id: string) => document.getElementById(id) as HTMLInputElement;

const display = (data: WWAData) => {
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
            alert("Display Error!! index: " + key);
        }
    }
}

const main = () => {
    const eventEmitter: WWALoaderEventEmitter = new BrowserEventEmitter();
    const loader = new WWALoader(EXTRACTING_MAPDATA_FILENAME, eventEmitter);
    const startedLoadAt = new Date();
    const mapDataListener = eventEmitter.addListener("mapData", (wwaMap) => {
        ($id("loadTime")).value = `${new Date().getTime() - startedLoadAt.getTime()}`;
        console.log("mapData", wwaMap);   
        eventEmitter.removeListener("mapData", mapDataListener);
        eventEmitter.removeListener("progress", progressListener);
        eventEmitter.removeListener("error", errorListener);
        display(wwaMap)
    });
    const progressListener = eventEmitter.addListener("progress", (progress) => {
        console.log("progress", progress);
        ($id("progressCurrent")).value = `${progress.current}`;
        ($id("progressTotal")).value = `${progress.total}`;
        ($id("progressStage")).value = `${progress.stage}`;
   });
   const errorListener = eventEmitter.addListener("error", (error) => alert(error.message));
   loader.requestAndLoadMapData();
};

window.addEventListener("load", main);
