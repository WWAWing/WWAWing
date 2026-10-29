# WWAScriptとJavaScriptの違いについて
WWAScriptはJavaScript基本的な互換性はありますが、セキュリティの問題から一度WWAScriptを文字列として読み取り、構文解析をかけています。
この関係上、JavaScriptでは使えるがWWAScriptでは使えない機能があります。

## 変数宣言について
通常のjavaScriptではvar/let/constを使って変数宣言を行いますが、WWAScriptは変数宣言を行う必要はありません。その代わりユーザー定義変数である `v["x"]` の形式でしかユーザー定義変数を使えません。
また引数はnumber/stringのみ使用できて、Objectやnull/undefinedは利用できません。

これはOK
v[0] = 200;
v["hoge"] = "fuga";

これはNG
v[{hoge: 10}] = 20;
v[null] = undefined;

### ユーザー変数
ユーザーが扱える変数は2つあります
v[N] の形式でNは0から255までの自然数が使えます。
代入できる値は数値のみです。文字列やObjectは入れられません

## 名前付きユーザー変数
v["hoge"] のように引数に文字列を取る場合に適用されます。
値には数値・文字列・Objectは入れられます。

## スクリプトで使用可能な変数
HP	プレイヤーの生命力
HPMAX	プレイヤーの生命力最大値。0 は無制限を意味します。
AT	プレイヤーの攻撃力
DF	プレイヤーの防御力
GD	プレイヤーの所持金
STEP	プレイヤーの移動回数
TIME	ゲーム開始からのプレイ時間 (ミリ秒)
PX	プレイヤーがいるX座標
PY	プレイヤーがいるY座標
CX	プレイヤーがいる画面の一番左上のX座標
CY	プレイヤーがいる画面の一番左上のY座標
m[N][M]	座標 (N, M) にある背景パーツ番号
o[N][M]	座標 (N, M) にある物体パーツ番号
ITEM[N]	N = 0 の場合: 値を代入するとその物体パーツをアイテムボックス内の空き位置に配置します。値の読み取りはできません。1 ≤ N ≤ 12 の場合: アイテムボックス内にある物体パーツ番号。 空の場合は 0 となります。
X 	メッセージを出したパーツが存在する X 座標。イベント実行時は PX と同じ値
Y 	メッセージを出したパーツが存在する Y 座標。イベント実行時は PY と同じ値
ID	メッセージを出したパーツの番号イベント実行時は -1
TYPE	メッセージを出したパーツの種類0 で物体、1 で背景イベント実行時は -1
PDIR	プレイヤーが向いている方向。2: 下, 4: 左, 6: 右, 8: 上。テンキーを意識するとわかりやすいです。
LOOPLIMIT	for文内で繰り返し実行できる上限回数
ITEM_ID	CALL_GET_ITEM() CALL_USE_ITEM() CALL_GET_ITEM_FULL()内でのみ使えます。直前に取得・使用したアイテムのIDを得ることができます。その他の関数で呼ばれた場合は -1を得ます。
ITEM_POS 	CALL_GET_ITEM() CALL_USE_ITEM() CALL_GET_ITEM_FULL()内でのみ使えます。取得・使用したアイテムの位置 (1 ≤ ITEM_POS ≤ 12)を得ることができます。アイテムがいっぱいで取得できなかったときや、その他の関数で呼ばれた場合は -1を得ます。

## スクリプトで呼び出し可能な関数
RAND(V)	0 以上 V 未満の乱数値を返す
(言い換えると 0 以上 V - 1以下の乱数)を返す
JUMPGATE(X, Y)	座標（X,Y）にジャンプする
MESSAGE(STR)	引数で与えた文字列をメッセージとして表示
MSG(X)	引数で与えた文字列をメッセージとして表示
💡文字列中に \n を書くことで改行できます。
MSG(”ここで→\n←改行されます”)
SOUND(X)
実際にサウンド配置したパーツしか鳴りません	@$sound 

DEL_PLAYER(X)	@$delplayer 
ABLE_CHANGE_SPEED(x)
xはtrue/false
⚠️まつゆきメモ2023-07-08: 正式リリース時に名前が変わる可能性が高いです。
正式な名前が決定した後でも現在の関数名のままご利用いただけるようにする予定です。	@$game_speed 
SET_SPEED(x)	@$set_speed 
CHANGE_GAMEOVER_POS(x, y)	@$gameover 
SAVE(x)	@$save 
LOG(x)	@$console_log2 
HIDE_STATUS(KIND, HIDE)	@$hide_status 
PARTS(ID1,  ID2, TYPE, THISS_SIGHT)	@$parts 
FACE(X_DEST,Y_DEST,SRC_X,SRC_Y,W ,H)	@$face
PARTS_MOVE(NUM)	@$move 
EFFECT(WAIT_TIME,X1,Y1,X2,Y2,X3,Y3,X4,Y4)	@$effect 
CHANGE_PLAYER_IMAGE(SRC_X,SRC_Y)	@$imgplayer 
HAS_ITEM(X)	X番のアイテムを持っているならTRUE
REMOVE_ITEM(X, IS_ALL)	所持している物体番号X番のアイテムを削除する
IS_ALL=0 X番のアイテムを1つだけ削除する 
IS_ALL=1 X番のアイテムを全て削除する

GET_UNIXTIME()	現在のUNIXTIMEを取得する
GET_DATE_YEAR()	現在の年を取得する
GET_DATE_MONTH()	現在の月を取得する
GET_DATE_DAY()	現在の日を取得する
GET_DATE_HOUR()	現在の時を取得する
GET_DATE_MINUTES()	現在の分を取得する
GET_DATE_SECONDS()	現在の秒を取得する
GET_DATE_MILLISECONDS()	現在のミリ秒を取得する
GET_DATE_WEEKDAY()	現在の曜日を取得する
CHANGE_SYSMSG()	システムメッセージを変更する
第一引数はシステムメッセージコード (@$sysmsg参照), 第二引数はメッセージ。
システムメッセージコードを名前で与える場合は文字列として与えてください。
例: CHANGE_SYSMSG(”NO_ITEM”, “アイテムがない!”)
リセットする場合は第二引数を与えないでください。
SHOW_USER_DEF_VAR()	ユーザー定義変数の一覧をコンソール出力する
ABS(x)	絶対値を返す
GET_GAMEOVER_POS_X()	現在のゲームオーバー座標のX座標の値を返す
GET_GAMEOVER_POS_Y()	現在のゲームオーバー座標のY座標の値を返す
ABORT_BATTLE()	ダメージカスタマイズ関数内で使うと、戦闘を即座に打ち切る
それ以外の場合には何も起きない
v4.1.0-unstable.based-on.3.12.11.p.1 以降は、 ABORT_BATTLE() が呼ばれるとそれ以降のWWA Script の処理は実行されない (EXIT() 相当)。 
EXIT(x)	WWA Script の処理を途中で打ち切る。
（ステータスコードを引数で設定できるが、将来のためのもので、現在これを使える箇所はない。）
GET_IMG_POS_X(parts_id, is_object, is_first_motion)	指定したパーツ番号の物体/背景が属する画像ファイル上のX座標の値を返す
is_object=0: 物体
is_object=1: 背景
is_object 省略時には物体が指定される

is_first_motion は物体を指定したときのみ有効。

物体パーツは2つの画像で構成されているため、is_first_motion=0 で1つ目の画像のX座標を、is_first_motion=1 で2つ目の画像のX座標を取得する。

物体かつis_first_motion 省略時には1つ目の画像のX座標を取得する
GET_IMG_POS_Y(parts_id, is_object, is_first_motion)	指定したパーツ番号の物体/背景が属する画像ファイル上のY座標の値を返す
is_object=0: 物体
is_object=1: 背景
is_object 省略時には物体が指定される

is_first_motion は物体を指定したときのみ有効。

物体パーツは2つの画像で構成されているため、is_first_motion=0 で1つ目の画像のY座標を、is_first_motion=1 で2つ目の画像のY座標を取得する。

物体かつis_first_motion 省略時には1つ目の画像のY座標を取得する
IS_NUMBER(x) 	引数の値が数かを判定する
IS_NUMBER(LP[0]) のようにLoop Pointerが使用可能かを判定する目的で使う関数。
LENGTH(x)	指定した名前付きユーザー定義が配列・オブジェクトの場合に配列の長さまたはオブジェクトの要素数を返す。
CLONE(x) 	指定した値をクローンします。
※JavaScript 同様、配列やオブジェクトを代入するとその全体ではなく、それが「ある場所」の情報のみコピーされます。例えば、v["A"]=[  {"a":11,"b":12,"c":13},
{"a":21,"b":22,"c":23},
{"a":31,"b":32,"c":33}]
v["B"]=v["A"];
のような代入を行ったあと、 v[”A”][0].a を書き換えると、 v[”B”][0].a も全く同じものなので書き換わってしまいます。
これを防止するために、この関数では配列やオブジェクトの構造を丸ごとコピーします。
GET_OBJECT_TYPE(parts_id)	（定義策定中）

## スクリプト例
```
// 変数0番に100を代入します
v[0]=100;
// 生命力に1000を代入します
HP=1000;
// 攻撃力に0から100までの乱数を代入します
AT=RAND(100);
// 防御力に現在のプレイヤーX座標を入れます
DF=PX;
// 所持金に現在の歩数を入れます
GD=STEP;
// 現在の所持金を表示します
MSG("今の所持金は"+GD+"ゴールドです。");
// 座標(10, 20)にジャンプします
JUMPGATE(10, 20);
// 座標(10, 20)に物体パーツ1番を設置します
o[10][20] = 1;
// 座標(30, 50)に背景パーツ2番を設置します
o[30][50] = 2;
// 物体パーツ10番のアイテムを取得します
ITEM[0] = 10;

// 20番のアイテムを持っているときだけ扉を開きます
if(HAS_ITEM(20)) {
    REMOVE_ITEM(20);
    o[PX][PY-1] = 0;
    MSG("扉が開いた！")
}
else {
    MSG("鍵がないと扉は開かないようだ...")
}
```

## if-else if-elseステート
```
// HPが1000以上なら変数0に乱数の0から1000までを代入する
if(HP > 1000) {
  v[0] = RAND(1000);
}
else if(HP > 100) {
  v[0] = RAND(100);
}
else {
  v[0] = 0
}

if(v[0] > 20) {
	if(v[1] > 30) {
    v[2] = 20;
  }
}
```

## for-ステート
- 今のところ変数には `i/j/k` または `LOOP Pointer` しか使用できません
- 無限ループによるフリーズ対策のため、処理回数が10,000回を超えたら強制的に処理を終了するようになっています
- 処理回数の上限変更は`LOOPLIMIT` で変更できます

```
for(i=0; i<10; i++) {
    o[PX-5+i][PY+1]=RAND(100);
}

for(i=0; i<5; i++) {
    for(j=0; j<5; j++) {
        for(k=0; k<2; k++) {
            MSG("i:"+i+"/ j:"+j+"/k:"+k);
        }
    }
}
```

- `Loop Pointer` は4重ループ以上の深いネストのfor文を構築する際に利用できます。
    - `LP[x]` の形で利用出来、 `x` は自然数のみ入れられます。

```
for(LP[0]=0; LP[0]<2; LP[0]++) {
  for(LP[1]=0; LP[1]<2; LP[1]++) {
    for(LP[2]=0; LP[2]<2; LP[2]++) {
      for(LP[3]=0; LP[3]<2; LP[3]++) {
        for(LP[4]=0; LP[4]<2; LP[4]++) {
          for(LP[5]=0; LP[5]<2; LP[5]++) {
            LOG(LP);
          }
        }
      }
    }
  }
}
```

Loop Pointer が利用可能かを判定するために IS_NAN 関数が利用できます

```
if(!IS_NUMBER(LP[0])) {
  // これは出力される
  LOG("LP[0]は使えます")
}
for(LP[0]=0; LP[0]<2; LP[0]++) {
  if(!IS_NUMBER(LP[0])) {
    // これは出力されない
    LOG("LP[0]は使えます")
  }
  LOG(LP);
}
if(!IS_NUMBER(LP[0])) {
  // これは出力される
  LOG("LP[0]は使えます")
}
```

### for文使用上の注意事項

- 既に上の階層にて使用されている変数を使用するとエラーになります

```
// エラーになる例
for(i=0; i<5; i++) {
    for(i=0; i<5; i++) {
        MSG("i:"+i);
    }
}
// エラーになる例
for(LP[0]=0; LP[0]<2; LP[0]++) {
  for(LP[0]=0; LP[0]<2; LP[0]++) {
    LOG(LP);
  }
}
```

Loop Pointer を直接使用するとエラーになります

```
// エラーになる例
for(LP=0; LP<2; LP++) {
  LOG(LP);
}
```

Loop Pointer の添字には自然数のみ利用できます

```
// エラーになる例
for(LP["hoge"]=0; LP["hoge"]<2; LP["hoge"]++) {
  LOG(LP);
}
```

## 外部スクリプト対応

`./script` 配下に設置されたJavaScriptファイルを読み込み、定義された関数を `<script>` タグ内で使用できるようになります。

読み込むファイルの一覧は `./script/script_file_list.json` に記述してください

```jsx
[
  "./script/index.js",
  "./script/lib.js",
  "./script/defined.js"
]
```

読み込むファイルの一覧は data-wwa 属性 `data-wwa-user-defined-scripts-file` で変更できます。

ここで `./script/index.js` に以下のように記述し、 `<script>` タグの中で関数を呼ぶことが出来ます。

以下の例ですと `moveRand()` と書くだけでマップ上のランダムな地点に移動して、 `ジャンプしました。` とメッセージウィンドウを出すことが出来ます。

```
function moveRand() {
  JUMPGATE(RAND(100), RAND(100));
  MSG("ジャンプしました。")
}
```
<script>
moveRand();
```

```

### 外部スクリプトサンプル
- `./script/script_file_list.json`

```jsx
[
  "./script/index.js",
  "./script/lib.js",
  "./script/defined.js"
]
```

- `./script/index.js`

```jsx
function moveRand() {
  AT=RAND(1000);
  JUMPGATE(RAND(100), RAND(100));
}

function makeRandomParts() {
  for(i = 0; i < 5; i=i+1) {
    for(j = 0; j < 5; j=j+1) {
      o[PX-5+(i*2)][PY-5+(j*2)] = RAND(100);
    }
  }
}

function makeRandomPartsAllMaps() {
  for(i = 0; i < 60; i=i+1) {
    for(j = 0; j < 60; j=j+1) {
      if(RAND(3) > 1) {
        o[i][j] = RAND(200);
      }
      if(RAND(3) > 1) {
        m[i+1][j+1] = RAND(100);
      }
    }
  }
  MSG("配置完了");
}
```

- `./script/defined.js`

```jsx
/** セーブするごとに呼ばれる関数 */
function CALL_SAVE() {
  MSG("セーブしました")
}

/** 1フレームごとに呼ばれる関数 */
function CALL_FRAME() {
}

/** Cボタンを押した際に呼ばれる関数 */
function CALL_PUSH_C() {
  MSG("C keyが押されました")
}

/** WWAを開始した際に呼ばれる関数 */
function CALL_WWA_START() {
  MSG("ゲームを開始します")
}

/** クイックロード時に呼ばれる関数 */
function CALL_QUICKLOAD() {
  MSG("クイックロードされました")
}

/** リスタート時に呼ばれる関数 */
function CALL_RESTART() {
  MSG("リスタートされました")
}

/** パスワードロード時に呼ばれる関数 */
function CALL_PASSWORDLOAD() {
  MSG("パスワードロードされました")
}

/** ゲームオーバー時に呼ばれる関数 */
function CALL_GAMEOVER() {
  MSG("ゲームオーバーになりました")
}

/**
 * バトルレポートを見た時に呼ばれる関数
 * この関数内で MSG を呼ぶとウィンドウが二重で表示されるので注意してください
 **/
function CALL_BATTLE_REPORT() {
  MSG("Battle Reportを見ました")
}

/**
 * プレイヤーが動く度に呼ばれる関数
 */
function CALL_MOVE() {
}

/**
 * 速度変更時に呼ばれる関数
 */
function CALL_CHANGE_SPEED() {
  MSG("速度変更をしました")
}

/**
 * ジャンプゲートで移動した際に呼ばれる関数
 */
function CALL_JUMPGATE() {
  MSG("jumpgate移動しました")
}
```

## カスタムイベント関数
ゲーム開始時・フレーム毎・クイックセーブ時など、特定のイベントが発生した際に、ユーザーが定義した関数を呼び出すことが出来ます。

例えば `CALL_WWA_START()`関数はゲーム開始時に自動的に呼ばれる関数で、外部スクリプトに以下のように書くことでゲーム開始時に `ゲームを開始します` とメッセージを出すことが出来るようになります。

ゲーム開始時の変数初期化などは今までプレイヤー開始座標にパーツを置いてマクロ文で処理していましたが、こちらのカスタムイベント関数で置き換えることが出来ます。

```
function CALL_WWA_START() {
  MSG("ゲームを開始します")
}
```
### カスタムイベント関数一覧
関数名	説明
CALL_SAVE()	セーブ時に呼ばれるカスタム関数
CALL_CHANGE_SPEED()	速度変更時に呼ばれるカスタム関数
CALL_QUICKLOAD()	クイックロード時に呼ばれるカスタム関数
CALL_RESTART()	リスタート時に呼ばれるカスタム関数
CALL_PASSWORDLOAD()	パスワードロード時に呼ばれるカスタム関数
CALL_GAMEOVER()	ゲームオーバー時に呼ばれるカスタム関数
CALL_WWA_START()	ゲーム開始時に呼ばれるカスタム関数
CALL_BATTLE_REPORT()	バトルレポートを見た際に呼ばれるカスタム関数
CALL_MOVE()	移動時に呼ばれるカスタム関数
CALL_CAMERA_MOVE()	プレイヤーの移動操作でマップ画面が切り替わった際に呼ばれるカスタム関数
CALL_JUMPGATE()	ジャンプゲートで移動した際に呼ばれるカスタム関数
CALL_FRAME()	1フレームごとに呼ばれるカスタム関数
CALL_GET_ITEM()	アイテムを取得した際に呼ばれる
⚠️物体パーツ 0 を取得した場合（アイテムが削除された場合）にも呼ばれますが、この仕様は正式リリースまでに変更される可能性が高いです。
現状、物体パーツ 0 を読み飛ばしたい場合は if 文で ITEM_ID を読むなどして制御をお願いします。
CALL_USE_ITEM()	アイテムを使用した際に呼ばれる
CALL_GET_ITEM_FULL()	アイテムを取得したが、アイテムボックスがいっぱいの時に呼ばれる
CALC_PLAYER_TO_ENEMY_DAMAGE()	戦闘時にプレイヤーから敵に与えるダメージを定義する関数
戻り値がダメージ量になります。
※この関数内で変数を書き換えないでください！戦闘予測を出すときにも内部的に使用されるため意図しない挙動になる可能性があります！
CALC_ENEMY_TO_PLAYER_DAMAGE()	戦闘時に敵からプレイヤーに与えるダメージを定義する
戻り値がダメージ量になります。
※この関数内で変数を書き換えないでください！戦闘予測を出すときにも内部的に使用されるため意図しない挙動になる可能性があります！
CALL_PUSH_A()	Aボタンが押された時に呼ばれる
CALL_PUSH_B()	Bボタンが押された時に呼ばれる
CALL_PUSH_C()	Cボタンが押された時に呼ばれる
CALL_PUSH_D()	Dボタンが押された時に呼ばれる
CALL_PUSH_E()	Eボタンが押された時に呼ばれる
CALL_PUSH_F()	Fボタンが押された時に呼ばれる
CALL_PUSH_G()	Gボタンが押された時に呼ばれる
CALL_PUSH_H()	Hボタンが押された時に呼ばれる
CALL_PUSH_I()	Iボタンが押された時に呼ばれる
CALL_PUSH_J()	Jボタンが押された時に呼ばれる
CALL_PUSH_K()	Kボタンが押された時に呼ばれる
CALL_PUSH_L()	Lボタンが押された時に呼ばれる
CALL_PUSH_M()	Mボタンが押された時に呼ばれる
CALL_PUSH_N()	Nボタンが押された時に呼ばれる
CALL_PUSH_O()	Oボタンが押された時に呼ばれる
CALL_PUSH_P()	Pボタンが押された時に呼ばれる
CALL_PUSH_Q()	Qボタンが押された時に呼ばれる
CALL_PUSH_R()	Rボタンが押された時に呼ばれる
CALL_PUSH_S()	Sボタンが押された時に呼ばれる
CALL_PUSH_T()	Tボタンが押された時に呼ばれる
CALL_PUSH_U()	Uボタンが押された時に呼ばれる
CALL_PUSH_V()	Vボタンが押された時に呼ばれる
CALL_PUSH_W()	Wボタンが押された時に呼ばれる
CALL_PUSH_X()	Xボタンが押された時に呼ばれる
CALL_PUSH_Y()	Yボタンが押された時に呼ばれる
CALL_PUSH_Z()	Zボタンが押された時に呼ばれる
CALL_PUSH_ENTER()	ENTERキーが押された時に呼ばれる
CALL_PUSH_ESC()	ESCキーが押された時に呼ばれる
CALL_PUSH_SPACE()	スペースキーが押された時に呼ばれる
CALL_PUSH_LEFT()	カーソルキー左（←）が押された時に呼ばれる
CALL_PUSH_RIGHT()	カーソルキー右（→）が押された時に呼ばれる
CALL_PUSH_UP()	カーソルキー上（↑）が押された時に呼ばれる
CALL_PUSH_DOWN()	カーソルキー下（↓）が押された時に呼ばれる


### カスタムダメージ定義関数
`CALC_PLAYER_TO_ENEMY_DAMAGE`, `CALC_ENEMY_TO_PLAYER_DAMAGE` 関数を定義することで、モンスターパーツと接触して戦闘になった時のダメージ計算式を変更することができます。関数の戻り値にダメージ量を与えてください。

<aside>
⚠️ ダメージ量が負値にならないように注意してください。

</aside>

例えば、ダメージ量を 攻撃力 - 防御力 x 防御力に変更するには次のように定義します。

```jsx
/**
 * プレイヤーから敵に与えるダメージ計算式
 */
function CALC_PLAYER_TO_ENEMY_DAMAGE() {
  if (AT > ENEMY_DF) {
    return AT - ENEMY_DF * ENEMY_DF;
  }
  return 0;
}
/**
 * 敵からプレイヤーに与えるダメージ計算式
 */
function CALC_ENEMY_TO_PLAYER_DAMAGE() {
  if (ENEMY_AT > DF) {
    return ENEMY_AT - DF * DF;
  }
  return 0;
}
```

<aside>
🚫 **`CALC_PLAYER_TO_ENEMY_DAMAGE`, `CALC_ENEMY_TO_PLAYER_DAMAGE` 関数内で変数を書き換えないでください！戦闘予測を出すときにも、この関数をWWA Wing がシステム内部的で使用するため、戦闘予測画面を開いた時に意図しない挙動が発生する可能性があります！**

</aside>

### カスタムダメージ定義関数内で使用可能な変数

スクリプトで使用可能な値も参照してください。

[スクリプトで使用可能な値](https://www.notion.so/395668eb7ee443baae00467020f42d10?pvs=21) 

全て左辺値代入は出来ません

| 値の名前 | 説明 |
| --- | --- |
| `ENEMY_HP` | 敵のHP |
| `ENEMY_AT` | 敵の攻撃力 |
| `ENEMY_DF` | 敵の防御力 |

### カスタムダメージ定義関数内で使用可能な関数

| 関数名 | 説明 | 不安定版対応 |
| --- | --- | --- |
| `ABORT_BATTLE()` | ダメージカスタマイズ関数内で使うと、戦闘を即座に打ち切る。
ダメージカスタマイズ関数外で使用した場合には何も起きない | 未 |

### カスタムダメージ定義関数を利用した例

- 従来のアルテリオス計算式

```jsx
/**
 * プレイヤーから敵に与えるダメージ計算式
 */
function CALC_PLAYER_TO_ENEMY_DAMAGE() {
  if (AT >= ENEMY_DF) {
    return AT - ENEMY_DF;
  } else {
    return 0;
  }
}

/**
 * 敵からプレイヤーに与えるダメージ計算式
 */
function CALC_ENEMY_TO_PLAYER_DAMAGE() {
  if (ENEMY_AT >= DF) {
    return ENEMY_AT - DF;
  } else {
    return 0;
  }
}
```

- 条件によって戦闘を打ち切りたい場合

```jsx
/**
 * プレイヤーから敵に与えるダメージ計算式
 */
function CALC_PLAYER_TO_ENEMY_DAMAGE() {
  // HPが低くなると即座に戦闘を打ち切る
  if (HP < 100) {
    ABORT_BATTLE();
  }
  if (AT >= ENEMY_DF) {
    return AT - ENEMY_DF;
  } else {
    return 0;
  }
}
```

## 既知の不具合

- ステータス変化パーツや外部スクリプトで `o[PX][PY]` に対する代入で物体パーツが配置されない
    - スクリプトが即時実行され、その後WWA側で実行しないといけないパーツ処理に配置された物体パーツが巻き込まれてしまうため。
    - 修正したいのですが、これを修正してしまうと WWAコンテスト2023で不安定版を使用している作品に支障が出てしまうため修正を見送っております。（コンテスト終了後に修正を予定しております）
    - ステータス変化パーツの代わりにメッセージパーツをご利用いただくことで回避が可能な場合があります。
    - Discord のWWAコミュニティに詳細情報があります。
        - https://discord.com/channels/400604468644937729/1119816899245650021
        
## よくある質問と答え

Q1. MSGがうまく動きません！数字が並んで表示されてしまいます！

A1.例えば、以下のようなスクリプトがあったとします。

 

```jsx
MSG("100+200は" + 100 +200 + "です")
```

動作結果は想像できましたか？実は以下のようになります。

```
100+200は100200です
```

なぜでしょうか？実は `+` 演算子には2つの役割があります。それは、数値と数値の足し算をする役割、もう一つは文字列と何かを連結した文字列を作る役割です。そして、両者の優先順位は同じです。

優先順位が同じ場合は左から計算しますから、 “100+200は” という文字列に 100が連結され、”100+200は100”という文字列が生成されます。次に200が処理され、”100+200は100200”という文字列が生成されます。最後に、”です”が連結され、先ほど述べた結果になるわけです。

これを防ぐには 100 + 200 が先に計算される必要があります。例えば、

```jsx
MSG("100+200は" + (100 +200) + "です")
```

のようにすれば、意図した結果になるでしょう。

### 名前付きユーザ変数への配列・オブジェクトの代入

名前付きユーザ変数に限り、配列・オブジェクトを代入することが出来ます。

```jsx
v["test"] = [1, 2, 3];
MSG(v["test"][0])
```

こちらを実行すると `1` とメッセージが表示されます。

```jsx
v["player"] = {"name": "マサト","age": 19}
MSG(`僕の名前は${v["player"]["name"]}だ。`)
```

こちらを実行すると `僕の名前はマサトだ。` とメッセージが表示されます

```jsx
v["players"] = [
  {"name": "マサト","age": 19},
  {"name": "ヤツロウ","age": 21}
]

for(i=0; i<LENGTH(v["players"]); i++) {
  MSG(`${v["players"][i]["name"]}: ${v["players"][i]["age"]}歳`)
}
```

こちらを実行すると `マサト: 19歳` `ヤツロウ: 21歳` とメッセージが表示されます