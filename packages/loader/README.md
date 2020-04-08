# WWALoader
WWA( http://wwajp.com )のマップデータを解析した結果をJavaScriptのオブジェクトとして返すプログラムです。

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
- 新しめの node.js (詳細なバージョンは `.node_version`参照) をお手元にご用意ください.
- `npm install` で依存しているライブラリをインストールできます.
- `npm run build` で 成果物が `./lib` 下に生成されます. 型定義ファイルも生成されます.
- 成果物がある状態で `npm start`すると、ブラウザが立ち上がり、サンプルとして同梱しているマップデータの中身を吸い取ってデータを表示します.
- src ディレクトリにすべての元になっているTypeScriptソースがあります。
- 成果物は、 `./lib/wwaload.js` (WebWorkers バージョン)と、`./lib/wwaload.noworker.js` です。
- uglifyがかかっていないバージョンもあります (ファイル名に `long` が含まれているものです。)

## その他
不具合を発見された場合は、issuesかPull Requestまで。Githubのアカウントを持っていない場合はバグ報告板( http://jbbs.shitaraba.net/netgame/14732/ )まで。

WWA Wing - http://wwawing.com
