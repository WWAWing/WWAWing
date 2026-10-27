# WWA Wing
最新のREADME は https://github.com/WWAWing/WWAWing?tab=readme-ov-file#wwa-wing をご覧ください。 v3 の README では v4 と異なる部分と、重要な部分のみ解説します。

v3 の変更差分を v4 に取り込む場合はマージではなく、手作業か cherry-pick でお願いします。 2025-10-30 以降、v3 と v4 の間で同期は実施しません。

## 準備 
- Git, **Git LFS** (通常の開発をする場合は不要ですが、wwa-server の生成をする場合に必要になります。) が必要です。
  - 必ず1度は `git lfs install` を実行する必要があります。詳しくは [Git LFS の Wiki 「Installation」](https://github.com/git-lfs/git-lfs/wiki/Installation) をご覧ください。

これ以外については、[mise-en-place](https://mise.jdx.dev/) （以下, mise）をご利用の方は、何も準備しなくても開発に必要なツールは用意されます。

以下は mise を使わない場合に必要なツールを用意する手順です。
1. [`.node-version`](./.node-version) に記述されたバージョンの [Node.js](https://nodejs.org/ja/download) をインストールしてください。
2. [pnpm](https://pnpm.io/ja/installation) の導入手順に従って、 pnpm をインストールしてください。
  - 実際に使われる pnpm のバージョンは [`package.json`](./package.json) の `packageManager` フィールドで決定されますが、実際に使われる pnpm のバージョンを自動で決定する機構が入っているため、 pnpm v10 以降であれば、インストールするバージョン不問です（なるべく新しいものの利用は推奨します）。
  - Corepack は使用しておりませんのでご注意ください。
3. `node -v`, `pnpm -v` などで、使われるバージョンを確認してください。

この `README.md` があるディレクトリで、

``` sh
git lfs pull
pnpm install
pnpm run build
```

することで、各パッケージが動作可能な状態になります。

## ライセンス
- ソースコード: MIT (Expat) 
- ドキュメント・画像・音源: CC-BY 4.0

## 行動規範
- Contributer Covenant Code of Conduct に従います。
  - [原文(英語)](./CODE_OF_CONDUCT.md)
  - [日本語訳](./CODE_OF_CONDUCT_ja.md)
