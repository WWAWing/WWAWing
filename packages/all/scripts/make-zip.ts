import JSZip from "jszip";
import glob from "glob";
import * as fs from "fs";
import * as path from "path";

const baseDir = "./dist";

async function getAllFiles(target: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(`${target}/**/*.*`, { cwd: baseDir }, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches);
      }
    });
  });
}

async function markAllFiles(files: string[]): Promise<JSZip> {
  const zip = new JSZip();
  await Promise.all(
    files.map(
      itemPath =>
        new Promise((resolve, reject) => {
          const itemPathFs = path.normalize(itemPath);
          const itemPathFsWithBase = path.join(baseDir, itemPathFs);
          fs.readFile(itemPathFsWithBase, (err, itemData) => {
            console.log(`including ${itemPath}`);
            if (err) {
              reject(err);
            } else {
              zip.file(itemPathFs, itemData);
              resolve();
            }
          });
        })
    )
  );
  return zip;
}

async function compress(target: string, zip: JSZip): Promise<void> {
  const dest = path.join(baseDir, `${target}.zip`);
  const content = await zip.generateAsync({ type: "nodebuffer" });
  await new Promise((resolve, reject) => {
    fs.writeFile(dest, content, err => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`${dest} was written.`);
      resolve();
    });
  });
}

export default async function(target: string): Promise<void> {
  const files = await getAllFiles(target);
  const zip = await markAllFiles(files);
  await compress(target, zip);
}
