#!/bin/sh

# all ディレクトリ外からの実行は想定していません
# 実行例 GH_TOKEN=(略) WWAWING_VERSION=3.4.2 ./scripts/update-sites.sh
# 環境変数 GH_TOKEN に GitHub の Personal Access Token が必要です
# 環境変数 WWA_WING_VERSION にリリースするバージョン名 (vなし) が必要です

# 配布物 ZIP 生成
npm run make-zip
if [ $? -eq 1 ]; then
  echo "zip build error."
  exit 1
fi

# GitHub の Releases に 配布物 ZIP をアップロード
npm run upload-zip
if [ $? -eq 1 ]; then
  echo "release error."
  exit 1
fi

# sites の clone
rm -rf sites
git clone git@github.com:WWAWing/sites.git
if [ $? -eq 1 ]; then
  echo "clone error."
  exit 1
fi
cd sites

# sites で配布しているバージョンリストに リリースしようとしているバージョンを追記 して Push
git checkout "feature/append-version" # 開発中のためあるものです. あとでけす.
npm i && npx ts-node ./scripts/append-version.ts $WWA_WING_VERSION
cp ../../assets/html/manual.html ./wwawing.com/wing # マニュアルのコピー
export BRANCH_NAME="feature/update-to-v$WWA_WING_VERSION"
git checkout -b $BRANCH_NAME
git add -u
git commit -m "feat(releases): Release v$WWA_WING_VERSION"
git push origin $BRANCH_NAME
if [ $? -eq 1 ]; then
  echo "push error."
  exit 1
fi

# sites のローカルにあるリポジトリを削除
cd .. # escape directory "sites"
rm -rf sites

# push したブランチを master にマージする sites の PR を作成
npm run create-pr

