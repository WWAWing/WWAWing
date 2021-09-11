# WWALoader
WWA( http://wwajp.com )のマップデータを解析した結果をJavaScriptのオブジェクトとして返すプログラムです。

ブラウザ, Node.js で動作します。

## 重要なお知らせ
WWALoader は、他のnpm パッケージから依存されることを前提に開発されています。

WWALoader 単体では、ブラウザ間の実装差異を埋めるような構成にはなっていません。(例: IE11には対応していない `Promise` を利用するなど)

最終的なアプリケーション側で、必ずpolyfillの付加など適切な措置を行ってください。

## ライセンス
- MIT License (Expat)。詳しくは「LICENSE」ファイルを参照。

### 同梱物のライセンスについて
テスト用にスタンダードマップのデータ「wwamap.dat」を同梱していますが、このファイルの著作権の取り扱いについてはキャラバンサークル
( http://wwajp.com )で定める通りとします。

## とりあえず触りたい人へ
- 新しめの node.js (原則、最新LTS) をお手元にご用意ください.
- `npm run build` で 成果物が `./lib` 下に生成されます. 型定義ファイルも生成されます.
- `npm start` もしくは `npm run start:browser` でテスト用のマップデータをブラウザから読み込む動作確認ができます。 8080番ポートでテスト用のサーバが立ち上がりますので、 http://localhost:8080/ などで確認してください。
- `npm run start:node` で Node.js で動作させる場合の動作確認ができます。

## ディレクトリ構成
- `./src` ディレクトリにソースコードがあります。
- `./src/___debug-resources___` 下は、動作確認用のソースコードがあります。これらのコードは成果物には含まれません。
- 成果物は、 `./lib` (CommonJS), `./module` (ES Module) 下のディレクトリのファイル群です。

## その他
不具合を発見された場合は、issuesかPull Requestまで。Githubのアカウントを持っていない場合はバグ報告板( http://jbbs.shitaraba.net/netgame/14732/ )まで。

WWA Wing - https://wwawing.com
