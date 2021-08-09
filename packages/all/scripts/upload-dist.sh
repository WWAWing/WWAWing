#!/bin/sh

# GitHub Actions 以外からの実行 (特に, all パッケージ以外からの実行)は想定していません
# 環境変数 WWA_WING_RELEASE_TOKEN に GitHub の Personal Access Token が必要です
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
