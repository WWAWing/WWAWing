/*
 * assumed call by npm scripts. 
 */

var JSZip = require("jszip");
var fs = require("fs");
var path = require("path");
var glob = require("glob");
var Promise = require("es6-promise");
var dirName = "__DISTRIBUTE__";
var baseDir = ".";

makeZip("wwawing-dist");
makeZip("wwawing-update");

function joinPathArray(prev, cur) {
    return path.join(prev, cur);
}

function makeZip (target) {
    var zip = new JSZip();
    glob(baseDir + "/" + dirName + "/" + target + "/**/*.*", function(error, matches) {
        Promise.all(matches.map(function(itemPath) {
            return new Promise(function(resolve, reject) {

                // Windows のエクスプローラでもzipが開けるように
                // globから出てくるパスセパレータ( / )を
                // 動作環境におけるパスセパレータに変換する.
                var itemPathArray = itemPath.split("/")
                var itemPathFs = itemPathArray.reduce(joinPathArray, "");

                // アーカイブのパスには, パスの頭は使わないので外す
                var archivePath = itemPathArray.slice(2, itemPathArray.length).reduce(joinPathArray, "");

                fs.readFile(itemPathFs, function(err, itemData) {
                    console.log("including " + itemPath);
                    if( err ) {
                        reject(err);
                        return;
                    }
                    zip.file(archivePath, itemData);
                    resolve();
                });
            });
        }))
            .then( function() {
                var dest = target + ".zip";
                return new Promise( function(resolve, reject) {
                    zip
                        .generateAsync({type:"nodebuffer"})
                        .then( function(content) {
                            fs.writeFile(dest, content, function(err) {
                                if( err ) {
                                    reject( err );
                                    return;
                                }
                                resolve(dest);
                            });
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                    });
            })
            .then( function(dest) {
                console.log(dest + " written.");
            })
            .catch( function(e) {
                console.error(e);
            });
    });
}