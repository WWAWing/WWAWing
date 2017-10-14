/*
 * assumed call by npm scripts. 
 */

var cpx = require("cpx");
var fs = require("fs");
var path = require("path");
var Promise = require("es6-promise");

var wwawingDistDirName = "wwawing-dist";
var wwawingUpdateDirName = "wwawing-update";

// cpx (glob) 用 Windowsでもパス区切りは / でOK
var destBaseGlob = "./" + wwawingDistDirName;
var destUpdateBaseGlob = "./" + wwawingUpdateDirName;

// fs.mkdir 用 パス区切りが / でない環境も考慮する
var destBasePath = path.join(".", wwawingDistDirName);
var destUpdateBasePath = path.join(".", wwawingUpdateDirName);

// 完全版配布物を生成
makeDistribution(false);

// 更新版配布物を生成
makeDistribution(true);

function makeDistribution(isUpdate) {
    return new Promise( function (resolve, reject) {
        var tasks = [];

        if(isUpdate) {
            tasks = [
                copy("LICENSE"),
                copy("manual.html"),
                copy("wwa.js"),
                copy("wwaload.js"),
                copy("*.css"),
            ];
        } else {
            tasks = [
                 // debugger は廃止のためコピーなし
                copy("LICENSE"),
                copy("manual.html"),
                copy("wwa.js", "mapdata"),
                copy("wwaload.js", "mapdata"),
                copy("*.css", "mapdata"), 
                copy("wwamk310/WinWwamk.exe"),
                copy("wwawing-disp.png", "mapdata"),
                copy("audio/*.*","mapdata/audio"),
                copy("*.{dat,gif}", "mapdata"),
                copy("dist_html/*.html", "mapdata"),
            ];
        }
        Promise.all(tasks)
        .then( function () {
            if (!isUpdate) {
                return mkdir(path.join( "mapdata", "backup"));
            } else {
                return Promise.resolve();
            }
        })
        .then( function () {
            console.log( (isUpdate ? "update" : "full") + " version done.");
            resolve();
        })
        .catch( function (error) {
            console.error("error", error);
            reject(error);
        });
    });

    function copy (src, dest) {
        var destFull = (
            ( isUpdate ? destUpdateBaseGlob : destBaseGlob ) +
            "/" +
            ( dest ? dest : "" )
        );
        return new Promise(function (resolve, reject) {
            console.log("copy " + src + " to " +  destFull);
            cpx.copy(src, destFull, {
                clean: true,
                includeEmptyDirs: true
            }, function (error) {
                if (error) {
                    console.error( "copy " + src + " was rejected!" );
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    
    function mkdir (dest) {
        var destFull = path.join(
             ( isUpdate ? destUpdateBasePath : destBasePath ),
             dest
        ); 
        return new Promise(function (resolve, reject) {
            if (fs.existsSync(destFull)) {
                resolve();
            } else {
                fs.mkdir(destFull, function(error) {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            }
        });
    }       
}
