var use_worker = true;
var EXTRACTING_MAPDATA_FILENAME = "wwamap.dat"; // 吸い出すファイル名

var t_start;
var t_end;
var messageHandler = function (e) {
    if (e.data.error !== null && e.data.error !== void 0) {
        try {
            alert(e.data.error.message);
        } catch (e) {
            alert("エラーの表示に失敗しました。");
        }
    } else if (e.data.progress !== null && e.data.progress !== null) {
        ($id("progressCurrent")).value = e.data.progress.current;
        ($id("progressTotal")).value = e.data.progress.total;
        ($id("progressStage")).value = e.data.progress.stage;
    } else {
        disp(e.data.wwaData);
    }
}


var postMessage_noWorker = messageHandler;

var main = function () {
    t_start = new Date();
    if (use_worker) {
        var worker = new Worker("./wwaload.long.js");
        worker.postMessage({ "fileName": "./" + EXTRACTING_MAPDATA_FILENAME });
        worker.addEventListener("message", messageHandler)
    } else {
        var script = document.createElement("script")
        script.src = "wwaload.long.noworker.js";
        document.getElementsByTagName("head")[0].appendChild(script);
        if (script.readyState === "complete") {
            loader_start(
                {
                    data: {
                        fileName: EXTRACTING_MAPDATA_FILENAME
                    }
                });
        } else {
            script.onload = function () {
                loader_start(
                    {
                        data: {
                            fileName: EXTRACTING_MAPDATA_FILENAME
                        }
                    });
            }
        }
    }
}
var $id = function (id) {
    return document.getElementById(id);
};

var disp = function (data) {
    t_end = new Date();

    console.log(data);   

    ($id("loadTime")).value = t_end - t_start;

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

window.addEventListener("load", function () {
    main();
});
