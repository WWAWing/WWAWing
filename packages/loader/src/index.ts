declare function postMessage(message: any): void;
declare function postMessage_noWorker(message: any): void;

import { util } from "./loader_util";
import * as loader_wwa_data from "./wwa_data";
import { WWAConsts, WWAData } from "./wwa_data";
import { WWADataExtractor } from "./loader_extractor";
import { WWALoader } from "./loader_core";
import { conf } from "./loader_config";

export function sendToMain(m: any): void {
    if (conf.is_worker) {
        postMessage(m);
    } else {
        postMessage_noWorker({
            data: m
        });
    }
}

function loader_start( e: MessageEvent ): void {
     if (e.data.fileName !== void 0) {
        var loader: WWALoader = new WWALoader(e.data.fileName);
        loader.requestMapData();
    } else {
        var resp = new loader_wwa_data.LoaderResponse();
        resp.wwaData = null;
        resp.progress = null;
        resp.error = new loader_wwa_data.LoaderError();
        resp.error.name = "";
        resp.error.message = "マップデータのファイル名が指定されていません。";

        sendToMain(resp);
    }   
}

if (conf.is_worker) {
    addEventListener("message", loader_start);
}