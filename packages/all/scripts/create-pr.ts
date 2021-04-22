import { Octokit } from "@octokit/rest";

const WWA_WING_RELEASE_TOKEN = process.env.WWA_WING_RELEASE_TOKEN;
const WWA_WING_VERSION = process.env.WWA_WING_VERSION;
const BRANCH_NAME = process.env.BRANCH_NAME;

const createSitesPullRequest = async (branchName: string, version: string) => {
  try {
    // TODO: upload-zip と設定共通化
    const octokit = new Octokit({ auth: WWA_WING_RELEASE_TOKEN, baseUrl: "https://api.github.com", request: { timeout: 5000 } });
    await octokit.pulls.create({
      owner: "WWAWing",
      repo: "sites",
      base: "master",
      head: branchName,
      title: `Release v${version}`
    })
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  if (!WWA_WING_RELEASE_TOKEN) {
    console.error("GitHub Token がありません. 環境変数 WWA_WING_RELEASE_TOKEN を与えてください.");
    process.exit(1);
  }
  if (!WWA_WING_VERSION) {
    console.error("WWA Wing のバージョンが指定されていません. 環境変数 WWA_WING_VERSION を与えてください.")
    process.exit(1);
  }
  if (!BRANCH_NAME) {
    console.error("ブランチ名が指定さてていません. 環境変数 BRANCH_NAME を与えてください.")
    process.exit(1);
  }
}

createSitesPullRequest(BRANCH_NAME, WWA_WING_VERSION);
