# WWA Wing

## フォルダ構成(W3.13b++)
> .
> ├── Makefile - ビルド用Makefile
> ├── README.md - このファイル
> ├── __DISTRIBUTE__ - 配布用ファイル生成用ディレクトリ
> │   ├── Makefile - (主に*nix用)配布用zipの作成用Makefile
> │   ├── all.bat - (Windows用)clean.bat を実行して build.bat を実行するbat
> │   ├── build.bat - (Windows用)配布用ディレクトリ作成bat(zip圧縮はしない)
> │   └── clean.bat - (Windows用)配布用ディレクトリ削除bat
> ├── _convert.html - WebWorker非使用版のテストページ
> ├── audio - 音楽関連のディレクトリ
> │   ├── [1-4].mp3 - システム効果音
> │   ├── [10-19].mp3 - その他の効果音
> │   ├── [70-72].mp3 - BGM
> │   ├── LICENSE.txt - audio.js のライセンス情報
> │   ├── audio.min.js - 効果音, BGM再生用ライブラリ「audio.js」のminify版
> │   ├── audiojs.swf - audio.jsがaudio要素での再生に失敗した時のためのFlash
> │   ├── player-graphics.gif - audio.jsが使う画像ファイル
> │   └── サウンド番号.txt - サウンド番号の詳細情報
> ├── caves01.[dat, html, gif] - Cave Dungeon Level 1の関連ファイル
> ├── caves02.[dat, html, gif] - Cave Dungeon Level 2の関連ファイル
> ├── classictitle.gif - タイトル画像に使える画像の例
> ├── closure - Closure Compilerを配置するディレクトリ(同梱してません)
> │   └── ここにcompiler.jarを配置.md
> ├── cover.gif - デフォルトのタイトル画像
> ├── cover.pdn - デフォルトのタイトル画像のPaint.NETファイル
> ├── debugger - WWA Debugger 関連
> ├── dist_html - 配布用ZIPに入れるサンプルマップ用HTMLを含むディレクトリ
> ├── index.html - テストページトップ
> ├── island02.[dat, gif, html] - Fantasy Island 2の関連ファイル
> ├── making.gif - Standard Map用画像
> ├── manual.html - マニュアル
> ├── mapcg.gif - Standard Map用画像
> ├── style.css - 標準マップで使用している用CSS
> ├── test.[dat, html] - テストマップデータ関連ファイル
> ├── wwa.css - WWAで使用するCSS
> ├── wwa.js - WWA Wing本体(minify済)
> ├── wwa.long.js - WWA Wing本体(minifyなし)
> ├── wwa.long.js.map - wwa.long.js のソースマップ
> ├── wwa_camera.ts - WWA Wingソース: カメラ(画面表示範囲を決める)
> ├── wwa_cgmanager.ts - WWA Wingソース: 画像関連
> ├── wwa_data.ts - WWA Wingソース: 関連データの定義
> ├── wwa_estimate_battle.ts - WWA Wingソース: 戦闘結果予測
> ├── wwa_inject_html.ts - WWA Wingソース: 最初に挿入するHTML
> ├── wwa_input.ts - WWA Wingソース: キー, マウス, タッチ入力の状態管理
> ├── wwa_main.ts - WWA Wingソース: メイン
> ├── wwa_message.ts - WWA Wingソース: メッセージボックス, スコア表示, 戦闘
> ├── wwa_monster.ts - WWA Wingソース: モンスター
> ├── wwa_motion.ts - WWA Wingソース: 動く物体関連
> ├── wwa_parts_player.ts - WWA Wingソース: プレイヤー関連
> ├── wwa_util.ts - WWA Wingソース: あると便利な関数定義
> ├── wwaload.js - WWA Loader(Worker版)
> ├── wwaload.noworker.js(Workerなし版)
> ├── wwamap.[dat, html] - Standard Mapの関連ファイル
> ├── wwamk310 - WWA作成ツール関連
> └── wwawing-disp.png - バナー
