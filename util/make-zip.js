/*
 * assumed call by npm scripts. 
 */

var JSZip = require("jszip");
var fs = require("fs");
var path = require("path");
var glob = require("glob");
var zip = new JSZip();
var dest = "test.zip";
/*
function addFileToArchive(zip, baseDir, dirName, fileName) {
    var content = fs.readFileSync(path.join(baseDir, dirName, fileName));
    zip.folder(dirName).file(fileName,content);
    return zip;
}
*/
var dirName = "__DISTRIBUTE__";
var baseDir = ".";

glob(baseDir + "/" + dirName + "/wwawing-dist/**", function(error, matches) {
    matches.forEach(function(item) {
        
        var rStream = fs.createReadStream(item);
        console.log(item);
        rStream.on("data", (data)=>{
            console.log(item, data);
        });
        zip.file(item, rStream);
    });
});
  
zip
    .generateNodeStream({type:"nodebuffer", streamFiles:true})
    .pipe(fs.createWriteStream(dest))
    .on("finish", function() {
        console.log(dest + " written");
    });
