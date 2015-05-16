# WWA Wing

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
