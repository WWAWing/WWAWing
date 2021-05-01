import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

const WWA_WING_RELEASE_TOKEN = process.env.WWA_WING_RELEASE_TOKEN;
const WWA_WING_VERSION = process.env.WWA_WING_VERSION;
const REPO_CONFIG = { owner: "WWAWing", repo: "WWAWing" };
const DIST_FILE_NAME = "wwawing-dist.zip";
const UPDATE_FILE_NAME = "wwawing-update.zip";

const upload = async (releaseTag: string, distZipFile: Buffer, updateZipFile: Buffer) => {
  try {
    // TODO: create-pr と設定共通化
    const octokit = new Octokit({ auth: WWA_WING_RELEASE_TOKEN, baseUrl: "https://api.github.com", request: { timeout: 30000 } });
    const releaseResponse = await octokit.repos.getReleaseByTag({ ...REPO_CONFIG, tag: releaseTag });
    const releaseId = releaseResponse.data.id;
    await Promise.all([
      octokit.repos.uploadReleaseAsset({
        ...REPO_CONFIG,
        release_id: releaseId,
        data: distZipFile as unknown as string, // TODO: 型調整
        name: DIST_FILE_NAME
      }),
      octokit.repos.uploadReleaseAsset({
        ...REPO_CONFIG,
        release_id: releaseId,
        data: updateZipFile as unknown as string, // TODO: 型調整
        name: UPDATE_FILE_NAME,
      })
    ]);
  } catch (error) {
    console.error("upload error!", error)
    throw error;
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
    process.exit(1);
  }
};

if (!WWA_WING_RELEASE_TOKEN) {
  console.error("GitHub Token がありません. 環境変数 WWA_WING_RELEASE_TOKEN を与えてください.");
  process.exit(1);
}
if (!WWA_WING_VERSION) {
  console.log("WWA Wing のバージョンが指定されていません. 環境変数 WWA_WING_VERSION を与えてください.")
  process.exit(1);
}

main();
