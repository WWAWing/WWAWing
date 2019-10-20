#!/bin.sh

# npm install 実行後、package.jsonの install コマンドが自動的に呼び出されるので、bootstrapやbuildの処理は不要
npm install
npm run deploy
