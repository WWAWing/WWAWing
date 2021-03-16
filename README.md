# WWA Wing
インターネット RPG 「[World Wide Adventure](http://wwajp.com/)」 の TypeScript / JavaScript 実装です。

このリポジトリは、 `packages` ディレクトリ下 にある複数の npm パッケージで管理されており、複数のリポジトリにまたがる操作などは lerna により自動化されています。

## 準備
この `README.md` があるディレクトリで、

``` sh
npm install
```

することで、各パッケージが動作可能な状態になります。

## サポートブラウザ
### PC
OSは不問です。

- Microsoft Internet Explorer 11
- Mozilla Firefox (最新版)
- Google Chrome/Chromium (最新版) ※ Microsoft Edge の最新版など Chromium ベースのブラウザを含む
- Safari (最新版)

### スマートフォン・タブレット
- Android 上の Google Chrome (最新版)
- iOS 上の Safari (最新版)

## ディレクトリ構成
```
├── getEngineVersion.sh                         ## WWA Wing 本体のバージョンを取得するためのシェルスクリプト (Travis CIで使用）
├── lerna.json                                  ## lerna の構成ファイル
├── netlify.toml                                ## Netlify によるテストファイル自動生成のための設定ファイル
├── tsconfig.json                               ## TypeScript のコンパイル設定ファイル
└── packages ================================== ## このディレクトリ以下に各 npm パッケージを格納しています
     ├── all ================================== ## WWA Wing の配布物すべてを含むパッケージ
     ├── assets =============================== ## 開発時や配布物の生成時に使う静的なファイル
     ├── common-interface ===================== ## WWA Wing で使用するデータ構造を定義したソースコードパッケージ
     ├── debug-server ========================= ## wwa-server (WWA作者向けのHTTPサーバ)
     ├── engine =============================== ## WWA Wing本体
     ├── loader =============================== ## WWALoader (WWAのマップデータを WWA Wing のデータに変換するプログラム)
     ├── page-generator ======================= ## WWA のHTMLファイルを生成するプログラム
     └── styles =============================== ## sassスタイルシートのファイル (scss形式)
```

## ローカルで動かしたい
[Wiki の Getting Started](https://github.com/WWAWing/WWAWing/wiki/GettingStarted) をご参照ください。

WWA Wing 本体のソースは `packages/engine/src` 下にあります。

## ブランチ戦略
- `develop` ブランチが最新です。
- 現在リリースされているWWA Wingは `master` ブランチの最新です。
- Pull Request を作成する場合は、 リポジトリのフォークを作成した上でこのリポジトリの `develop` ブランチに向けて作成してください。
- リリース作業は　WWA Wing Team のメンテナ(まつゆき @matsuyuki-a)が行います。(`develop` ブランチを `master` ブランチにマージします。)

詳細は [コントリビューションガイドライン](./CONTRIBUTING.md) に含まれています。

## ライセンス
- ソースコード: MIT (Expat) 
- ドキュメント・画像・音源: CC-BY 4.0