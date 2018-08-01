# WWA Wing [![Build Status](https://travis-ci.org/WWAWing/WWAWing.svg?branch=master)](https://travis-ci.org/WWAWing/WWAWing)
WWA( http://wwajp.com )のJavaScript実装です。

## forkされる方へ
- `.travis.yml` の取り扱いにご注意ください.

## このリポジトリで開発される方へ
- `master` にコミットすると, Travis CI が動き出します。開発は `develop` の派生ブランチでお願いいたします。
- `develop` からブランチを作って、 `develop` に対する Pull Request を作ってくれると喜びます。

## ブランチについて
- `master`: リリース用のブランチです。
- `develop`: 開発用のブランチです。 このリポジトリ内で開発される方はここから分岐させたブランチで開発し, よさ気なら `develop` へのPull Request を作成してください.
- `distribute-all`: 完全版の配布物です。 Travis CIにより `master` のコミットごとに自動生成されます。
- `distribute-update`: 更新版の配布物です。Travis CIにより `master` のコミットごとに自動生成されます。


## とりあえず触りたい人へ
- src ディレクトリにすべての元になっているTypeScriptソースがあります。
- 下記の手順でビルドができます。 [node.js](https://nodejs.org) が必要です。

## ビルド手順
``` sh
$ npm install
$ npm run build
```

## ビルドにより生成されるファイルとディレクトリ
- wwawing-dist: WWA Wing 完全版配布物
- wwawing-update: WWA Wing 更新版配布物
- wwawing-dist.zip: WWA Wing 完全版配布物 (zip圧縮)
- wwawing-update.zip: WWA Wing 更新版配布物 (zip圧縮)
- wwa.long.js: WWA Wing 本体のJavaScriptへのコンパイル結果 (CryptoJSリンクなし)
- wwa.long.js.map: WWA Wing本体のTypeScriptからJavaScriptへのソースマップ
- wwa-nolink.js: WWA Wing本体のminify結果 (CryptoJSリンクなし)
- wwa-nolink.js.map: WWA Wing本体のTypeScriptからminify結果へのソースマップ
- wwa.js: WWA Wing本体

## 注意
- wwaload.js と wwaload.noworker は WWALoader( https://github.com/WWAWing/WWALoader )により生成されたものです。

## ライセンス
- MIT License (Expat)。詳しくは「LICENSE」ファイルを参照。
- ただし、マニュアル「manual.html」のみ CC BY 4.0。→<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="クリエイティブ・コモンズ・ライセンス" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/80x15.png" /></a>

### 同梱物のライセンスについて
同梱されているマップデータファイル「caves01.dat」「caves02.dat」 「island02.dat」「wwamap.dat」、 ゲーム中で使用される画像の内「caves01.gif」「caves02.gif」「island02.gif」「making.gif」「mapcg.gif」および WWA作成ツールに関しての著作権は原作者NAO氏が保持し、取り扱いについてはキャラバンサークル( http://wwajp.com )で定める通りとし、WWA Debuggerの実行ファイルおよびインストーラのバッチファイルに関しての著作権は、原作者Aruneko氏および アイコン制作者プチ氏が保持し、取り扱いについては同梱しているWWA Debuggerの説明文書によるものとします。

## 構成
### ディレクトリ
<pre>
.
├── audio - 音楽関連のディレクトリ
├── cryptojs - パスワードセーブの生成に使っている [crypto-js](https://www.npmjs.com/package/crypto-js) の一部が入っています。
├── debugger - WWA Debugger 関連
├── dist_html - 配布用ZIPに入れるサンプルマップ用HTMLを含むディレクトリ
├── src - WWA WingのTypeScriptソースを含むディレクトリ
├── wwamk310 - WWA作成ツール関連
├── node_modules - 依存しているライブラリなどが入るディレクトリ ( `npm install` で作成されます)
</pre>
### ファイル
.gitignore, マップデータ, WWAでロードされる画像ファイル, WWAを配置するHTMLファイル(_convert.htmlを除く), 先に紹介した生成物は省略
<pre>
├── package.json - node.jsのパッケージ設定。ビルド手順やバージョン情報、依存ライブラリの情報が書かれています。
├── README.md - このファイル
├── _convert.html - WebWorker非使用版のテストページ
├── classictitle.gif - タイトル画像に使える画像の例
├── cover.gif - デフォルトのタイトル画像
├── cover.pdn - デフォルトのタイトル画像のPaint.NETファイル
├── index.html - テストページトップ
├── manual.html - マニュアル
├── style.css - 標準マップで使用している用CSS
├── wwa.css - WWAで使用するCSS
├── wwa_classic.css - WWAで使用するCSS(本家再現版)
├── wwaload.js - WWA Loader(Worker版)
├── wwaload.noworker.js(Workerなし版)
└── wwawing-disp.png - バナー
</pre>

## その他
不具合を発見された場合は、issuesかPull Requestまで。Githubのアカウントを持っていない場合はバグ報告板( http://jbbs.shitaraba.net/netgame/14732/ )まで。

WWA Wing - http://wwawing.com
