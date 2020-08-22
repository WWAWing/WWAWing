import { Octokit } from "@octokit/rest";

const GH_TOKEN = process.env.GH_TOKEN;
const WWA_WING_VERSION = process.env.WWA_WING_VERSION;
const BRANCH_NAME = process.env.BRANCH_NAME;

const createSitesPullRequest = async (branchName: string, version: string) => {
  try {
    const octokit = new Octokit({ auth: GH_TOKEN, baseUrl: "https://api.github.com" });
    octokit.pulls.create({
      owner: "WWAWing",
      repo: "sites",
      base: "master",
      head: branchName,
      title: `Release v${version}`
    })
  } catch (error) {

    console.error(error);
  }
  if (!GH_TOKEN) {
    throw new Error("GitHub Token がありません. 環境変数 GH_TOKEN を与えてください.");
  }
  if (!WWA_WING_VERSION) {
    throw new Error("WWA Wing のバージョンが指定されていません. 環境変数 WWA_WING_VERSION を与えてください.")
  }
  if (!BRANCH_NAME) {
    throw new Error("ブランチ名が指定さてていません. 環境変数 BRANCH_NAME を与えてください.")
  }
}

createSitesPullRequest(BRANCH_NAME, WWA_WING_VERSION);
