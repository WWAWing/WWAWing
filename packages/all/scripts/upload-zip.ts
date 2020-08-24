import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

const GH_TOKEN = process.env.GH_TOKEN;
const WWA_WING_VERSION = process.env.WWA_WING_VERSION;
const REPO_CONFIG = { owner: "WWAWing", repo: "WWAWing" };
const DIST_FILE_NAME = "wwawing-dist.zip";
const UPDATE_FILE_NAME = "wwawing-update.zip";

const upload = async (releaseTag: string, distZipFile: Buffer, updateZipFile: Buffer) => {
  try {
    const octokit = new Octokit({ auth: GH_TOKEN, baseUrl: "https://api.github.com" });
    const releaseResponse = await octokit.repos.getReleaseByTag({ ...REPO_CONFIG, tag: releaseTag });
    const releaseId = releaseResponse.data.id;
    await Promise.all([
      octokit.repos.uploadReleaseAsset({
        ...REPO_CONFIG,
        release_id: releaseId,
        data: distZipFile,
        name: DIST_FILE_NAME
      }),
      octokit.repos.uploadReleaseAsset({
        ...REPO_CONFIG,
        release_id: releaseId,
        data: updateZipFile,
        name: UPDATE_FILE_NAME 
      })
    ]);
  } catch (error) {
    console.error("upload error!", error)
  }
};

const readFile = async (filePath: string) => new Promise<Buffer>((resolve, reject) =>
  fs.readFile(filePath, (error, data) => error ? reject(error) : resolve(data))
);

const main = async () => {
  try {
    const [dist, update] = await Promise.all([
      readFile(path.join(__dirname, "..", "dist", DIST_FILE_NAME)),
      readFile(path.join(__dirname, "..", "dist", UPDATE_FILE_NAME)),
    ]);
    await upload(`v${WWA_WING_VERSION}`, dist, update);
  } catch (error) {
    console.error(error);
  }
};

if (!GH_TOKEN) {
  throw new Error("GitHub Token がありません. 環境変数 GH_TOKEN を与えてください.");
}
if (!WWA_WING_VERSION) {
  throw new Error("WWA Wing のバージョンが指定されていません. 環境変数 WWA_WING_VERSION を与えてください.")
}

main();
