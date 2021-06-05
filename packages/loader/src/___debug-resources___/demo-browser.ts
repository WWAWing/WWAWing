import { BrowserEventEmitter } from "@wwawing/event-emitter";
import { WWALoader, WWALoaderEventEmitter } from "..";
import { WWAData } from "@wwawing/common-interface";
import { EXTRACTING_MAPDATA_FILENAME, targetKeys} from "./demo-common";

const $id = (id: string) => document.getElementById(id) as HTMLInputElement;

const display = (data: WWAData) => {
    targetKeys.forEach(key => {
        try {
            ($id(key)).value = `${data[key]}`;
        } catch (e) {
            alert("Display Error!! index: " + key);
        }
    })
};

const main = () => {
    const eventEmitter = new BrowserEventEmitter() as WWALoaderEventEmitter;
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

if (window) {
    window.addEventListener("load", main);
}
