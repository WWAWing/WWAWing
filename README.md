# WWA Wing
インターネット RPG 「[World Wide Adventure](http://wwajp.com/)」 の TypeScript / JavaScript 実装です。

このリポジトリは、 `packages` ディレクトリ下 にある複数の npm パッケージで管理されており、複数のリポジトリにまたがる操作などは lerna により自動化されています。

## サポートブラウザ
### PC
OSは不問です。

- Microsoft Internet Explorer 11
- Microsoft Edge (最新版)
- Mozilla Firefox (最新版)
- Google Chrome/Chromium (最新版)
- Safari (最新版)

### スマートフォン・タブレット
- Android 上の Google Chrome (最新版)
- iOS 上の Safari (最新版)

## ディレクトリ構成
```
├── .travis.yml                                 ## Travis CIによる配布物自動生成のための設定ファイル
├── getEngineVersion.sh                         ## WWA Wing 本体のバージョンを取得するためのシェルスクリプト (Travis CIで使用）
├── wwa_helper.enc                              ## Travis CIによる配布物自動公開に使用するSSH公開鍵（暗号化済）
└── packages ================================== ## このディレクトリ以下に各 npm パッケージを格納しています
     ├── assets =============================== ## 開発時や配布物の生成時に使う静的なファイル
     ├── build-utils ========================== ## 配布物を生成するためのWWAパッケージ
     ├── debug-server ========================= ## WWA作者向けのHTTPサーバ
     ├── engine =============================== ## WWA Wing本体
     └── loader =============================== ## WWALoader
```

## ローカルで動かしたい
``` sh
# リポジトリをクローンしてください
$ git clone git@github.com:WWAWing/WWAWing.git
## クローンしたリポジトリのディレクトリに入ります
$ cd WWAWing
## 依存しているライブラリをインストールします
$ npm install
$ npm run bootstrap ## 内部的に lerna bootstrap が呼ばれます
$ npm run build ## 各種ソースをコンパイルします
## 開発用のサーバを起動します (内部的にengine ディレクトリ下での npm startが呼び出されます。)
$ npm start
```

WWA Wing 本体のソースは `packages/engine/src` 下にあります。

## ブランチ戦略
- `develop` ブランチが最新です。
- 現在リリースされているWWA Wingは `master` ブランチの最新です。
- Pull Request を作成する場合は、 リポジトリのフォークを作成した上でこのリポジトリの `develop` ブランチに向けて作成してください。
- リリース作業は　WWA Wing Team のメンテナ(まつゆき @matsuyuki-a)が行います。(`develop` ブランチを `master` ブランチにマージします。)

## ライセンス
- ソースコード: MIT (Expat) 
- ドキュメント・画像・音源: CC-BY 4.0
