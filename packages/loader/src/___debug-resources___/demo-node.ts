import { NodeEventEmitter } from "@wwawing/event-emitter";
import { WWALoader, WWALoaderEventEmitter } from "..";
import { WWAData } from "@wwawing/common-interface";
import { EXTRACTING_MAPDATA_FILENAME, targetKeys} from "./demo-common";
import path from "path";

const display = (data: WWAData) => {
    targetKeys.forEach(key => {
        console.log(`${key}: ${data[key]}`);
    });
};

const main = () => {
    const eventEmitter = new NodeEventEmitter() as WWALoaderEventEmitter;
    const loader = new WWALoader(path.join(__dirname, EXTRACTING_MAPDATA_FILENAME), eventEmitter);
    const startedLoadAt = new Date();
    const mapDataListener = eventEmitter.addListener("mapData", (wwaMap) => {
        console.log(`load complete! time=${new Date().getTime() - startedLoadAt.getTime()} ms`);
        eventEmitter.removeListener("mapData", mapDataListener);
        eventEmitter.removeListener("progress", progressListener);
        eventEmitter.removeListener("error", errorListener);
        display(wwaMap)
    });
    const progressListener = eventEmitter.addListener("progress", (progress) => {
        console.log(`current=${progress.current} total=${progress.total} stage=${progress.stage}`);
   });
   const errorListener = eventEmitter.addListener("error", (error) => console.error(error.message));
   loader.requestAndLoadMapData();
};

try {
    window;
} catch (error) {
    main();
}
