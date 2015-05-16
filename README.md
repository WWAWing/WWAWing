# WWA Wing
WWA( http://wwajp.com )のJavaScript実装です。
## とりあえず触りたい人へ
- src ディレクトリにすべての元になっているTypeScriptソースがあります。
- ビルドはこのREADMEがあるディレクトリで、端末等から<code>make</code>でできます。 
- TypeScriptのコンパイラとGoogle Closure Compilerが必要です。ディレクトリ「closure」にコンパイラのjarファイルを置いてください。
- 成果物は、TypeScriptでコンパイルした結果が「wwa.long.js」で、Closure Compilerで minify した結果が「wwa.js」です。
- 配布用ZIPを作りたい場合はディレクトリ「\_\_DISTRIBUTE\_\_」へ。

## ライセンス
MIT License。詳しくは「LICENSE」ファイルを参照。
ただし、マニュアル「manual.html」のみ CC BY 4.0。→<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="クリエイティブ・コモンズ・ライセンス" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/80x15.png" /></a>
### 同梱物のライセンスについて
同梱されているマップデータファイル「caves01.dat」「caves02.dat」 「island02.dat」「wwamap.dat」、 ゲーム中で使用される画像の内「caves01.gif」「caves02.gif」「island02.gif」「making.gif」「mapcg.gif」および WWA作成ツールに関しての著作権は原作者NAO氏が保持し、取り扱いについてはキャラバンサークル で定める通りとし、WWA Debuggerの実行ファイルおよびインストーラのバッチファイルに関しての著作権は、原作者Aruneko氏および アイコン制作者プチ氏が保持し、取り扱いについては同梱しているWWA Debuggerの説明文書によるものとします。

## 構成(W3.13b++)
### ディレクトリ
<pre>
.
├── __DISTRIBUTE__ - 配布用ファイル生成用ディレクトリ
├── audio - 音楽関連のディレクトリ
├── closure - Closure Compilerを配置するディレクトリ(コンパイラは同梱してません)
├── debugger - WWA Debugger 関連
├── dist_html - 配布用ZIPに入れるサンプルマップ用HTMLを含むディレクトリ
├── src - WWA WingのTypeScriptソースを含むディレクトリ
├── wwamk310 - WWA作成ツール関連
</pre>
### ファイル
.gitignore, マップデータ, WWAでロードされる画像ファイル, WWAを配置するHTMLファイル(_convert.htmlを除く)は省略
<pre>
├── Makefile - ビルド用Makefile
├── README.md - このファイル
├── _convert.html - WebWorker非使用版のテストページ
├── classictitle.gif - タイトル画像に使える画像の例
├── cover.gif - デフォルトのタイトル画像
├── cover.pdn - デフォルトのタイトル画像のPaint.NETファイル
├── index.html - テストページトップ
├── manual.html - マニュアル
├── style.css - 標準マップで使用している用CSS
├── wwa.css - WWAで使用するCSS
├── wwa.js - WWA Wing本体(minify済)
├── wwa.long.js - WWA Wing本体(minifyなし)
├── wwa.long.js.map - wwa.long.js のソースマップ
├── wwaload.js - WWA Loader(Worker版)
├── wwaload.noworker.js(Workerなし版)
└── wwawing-disp.png - バナー
</pre>
