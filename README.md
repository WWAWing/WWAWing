# WWA Wing
インターネット RPG 「[World Wide Adventure](http://wwajp.com/)」 の TypeScript / JavaScript 実装です。

このリポジトリは、 `packages` ディレクトリ下 にある複数の npm パッケージで管理されており、複数のリポジトリにまたがる操作などは lerna-lite により自動化されています。

## 準備
- Node.js 22系
- npm 11系
- **Git LFS** (通常の開発をする場合は不要ですが、wwa-server の生成をする場合に必要になります。)
  - 必ず1度は `git lfs install` を実行する必要があります。詳しくは [Git LFS の Wiki 「Installation」](https://github.com/git-lfs/git-lfs/wiki/Installation) をご覧ください。

を準備してください。

この `README.md` があるディレクトリで、

``` sh
git lfs pull
npm install
npm run build
```

することで、各パッケージが動作可能な状態になります。

## サポートブラウザ
### PC
OSは不問です。

- Mozilla Firefox (最新版)
- Google Chrome/Chromium (最新版) ※ Microsoft Edge の最新版など Chromium ベースのブラウザを含む
- Safari (最新版)

### スマートフォン・タブレット
- Android 上の Google Chrome (最新版)
- iOS 上の Safari (最新版)

## ディレクトリ構成
```
├── lerna.json                                  ## lerna-lite の構成ファイル
├── netlify.toml                                ## Netlify によるテストファイル自動生成のための設定ファイル
├── tsconfig.json                               ## TypeScript のコンパイル設定ファイル
└── packages ================================== ## このディレクトリ以下に各 npm パッケージを格納しています
     ├── all ================================== ## WWA Wing の配布物すべてを含むパッケージ
     ├── assets =============================== ## 開発時や配布物の生成時に使う静的なファイル
     ├── common-interface ===================== ## WWA Wing で使用するデータ構造を定義したソースコードパッケージ
     ├── debug-server ========================= ## wwa-server (WWA作者向けのHTTPサーバ)
     ├── engine =============================== ## WWA Wing本体
     ├── event-emitter ======================== ## Node.js でもブラウザでも動作する EventEmitter ライブラリ
     ├── loader =============================== ## WWALoader (WWAのマップデータを WWA Wing のデータに変換するプログラム)
     ├── page-generator ======================= ## WWA のHTMLファイルを生成するプログラム
     └── styles =============================== ## sassスタイルシートのファイル (scss形式)
```

## ローカルで動かしたい
[Wiki の Getting Started](https://github.com/WWAWing/WWAWing/wiki/GettingStarted) をご参照ください。

WWA Wing 本体のソースは `packages/engine/src` 下にあります。

## ブランチ戦略
- `v4` ブランチが現在開発中の最新です。 `v4` ブランチの内容が不安定版としてリリースされます。不安定版は、後方互換性のない変更がリリースされる可能性があります。
- `v3` ブランチは安定版の最新です。原則として、致命的な不具合やセキュリティ上の対応が必要な場合のみ更新されます。
- Pull Request を作成する場合は、 リポジトリのフォークを作成した上でこのリポジトリの `v4` ブランチに向けて作成してください。
- リリース作業は　WWA Wing Team のメンテナ （@matsuyuki-a, @aokashi, @hirarira）が行います。
- `v3` ブランチに新しい変更が入った場合でも、 `v4` ブランチは `v3` ブランチに追従しません。 `v3`, `v4` 双方に適用すべき差分がある場合は、 `v3` で対応後、 `v4` に cherry-pick してください。

### ブランチ戦略変更に伴う変更点について
- 2025-10-30 より、ブランチ戦略が見直されました。 旧 `develop`, `feat/picture-feature-with-wwa-script` ブランチは `v4` ブランチ, 旧 `master` ブランチは `v3` ブランチ相当になっています。
- `v4` 系は 2025-10-30 現在すべて不安定版です。以前はバージョン名に `unstable` が入っていましたが、入っていなくとも不安定版ですのでご注意願います。

詳細は [コントリビューションガイドライン](./CONTRIBUTING.md) に含まれています。

## ライセンス
- ソースコード: MIT (Expat) 
- ドキュメント・画像・音源: CC-BY 4.0

## 行動規範
- Contributer Covenant Code of Conduct に従います。
  - [原文(英語)](./CODE_OF_CONDUCT.md)
  - [日本語訳](./CODE_OF_CONDUCT_ja.md)
