# WWAScript 言語仕様書（AI コード生成用）

このドキュメントは、生成 AI が WWAScript のコードを正確に生成するための言語仕様書です。

WWAScript は、HTML5 版 WWA（World Wide Adventure）ゲームエンジン「WWA Wing」向けの独自スクリプト言語です。JavaScript の構文をベースとしていますが、セキュリティ上の理由からサンドボックス内で実行されるため、**JavaScript とは異なる制約が数多く存在します**。

---

## 目次

1. [スクリプトの記述場所](#1-スクリプトの記述場所)
2. [基本的な構文ルール](#2-基本的な構文ルール)
3. [データ型](#3-データ型)
4. [変数システム](#4-変数システム)
5. [演算子](#5-演算子)
6. [制御構文](#6-制御構文)
7. [組み込み関数](#7-組み込み関数)
8. [カスタムイベント関数](#8-カスタムイベント関数)
9. [外部スクリプトファイル](#9-外部スクリプトファイル)
10. [禁止事項一覧](#10-禁止事項一覧)
11. [コード例集](#11-コード例集)

---

## 1. スクリプトの記述場所

### 1-A. パーツのメッセージ内（`<script>` タグ）

WWA Wing のパーツに設定したメッセージテキストの末尾に `<script>` タグを置き、その後にスクリプトを記述します。

```
アイテムを取得した！
<script>
HP += 50;
MSG("体力が 50 回復した！");
```

- `<script>` タグより前の内容がメッセージ表示テキストになります。
- `<script>` タグより後の内容がスクリプトとして実行されます。
- スクリプトはメッセージ表示の**前**に実行されます。
- `<P>` タグでメッセージを複数ページに分けた場合でも、スクリプトは最初のページの前に一度だけ実行されます。

### 1-B. 外部スクリプトファイル（`./script/*.js`）

ゲームディレクトリの `./script/` フォルダに `.js` ファイルを配置し、`./script/script_file_list.json` にパスを列挙することで読み込まれます。外部スクリプトファイルでは**関数の定義のみ**が有効です。

---

## 2. 基本的な構文ルール

### 2-1. JavaScript との共通点

- 文の末尾にはセミコロン `;` を付ける（なくても動作するが推奨）。
- ブロックは `{` `}` で囲む。
- コメントは `//` で行末まで、または `/* */` でブロック単位で記述する。
- 文字列はシングルクォート `'` またはダブルクォート `"` で囲む。
- テンプレートリテラル `` `${式}` `` が使用可能。

### 2-2. JavaScript とは異なる制約

| 禁止事項 | 代わりの方法 |
|---|---|
| `var` / `let` / `const` による変数宣言 | `v[N]` または `v["name"]` を使う |
| `function` によるインラインの関数定義 | 外部スクリプトファイルに記述する |
| `===` / `!==`（厳密等値） | `==` / `!=` を使う |
| `typeof` / `instanceof` 演算子 | `IS_NUMBER()` を使う |
| `new` キーワード | 使用不可 |
| `try` / `catch` / `throw` | 使用不可 |
| `class` / `import` / `export` | 使用不可 |
| `while` / `do-while` ループ | `for` ループを使う |
| `switch` 文 | `if / else if / else` を使う |

---

## 3. データ型

WWAScript で扱える値の型は以下の通りです。

| 型 | 使用可能な場所 | 説明 |
|---|---|---|
| `number`（数値） | 全ての変数・引数 | 整数・小数どちらも使用可能 |
| `string`（文字列） | `v["name"]`、関数引数 | シングル/ダブルクォート、テンプレートリテラル |
| `boolean`（真偽値） | 条件式の結果 | `true` / `false`。`v[N]` には代入不可 |
| `Array`（配列） | `v["name"]` のみ | `[1, 2, 3]` のようなリテラルで代入 |
| `Object`（連想配列） | `v["name"]` のみ | `{ key: value }` のようなリテラルで代入 |
| `null` / `undefined` | 関数の戻り値のみ | 変数・引数に直接書くことはできない |

**重要**: `v[N]`（数値添字のユーザー変数）には**数値のみ**代入できます。文字列・配列・オブジェクトは `v["name"]` を使ってください。

---

## 4. 変数システム

### 4-1. 組み込みシンボル（ゲーム状態変数）

以下の変数はゲームエンジンと直結したグローバル変数です。宣言不要で使用できます。

#### 読み書き可能なシンボル

| シンボル | 型 | 説明 | 備考 |
|---|---|---|---|
| `HP` | number | プレイヤーの現在生命力 | |
| `HPMAX` | number | プレイヤーの生命力最大値 | 0 は無制限を意味する |
| `AT` | number | プレイヤーの攻撃力（素） | 装備品の値を含まない |
| `DF` | number | プレイヤーの防御力（素） | 装備品の値を含まない |
| `GD` | number | プレイヤーの所持金 | |
| `PX` | number | プレイヤーの X 座標（マップ単位） | 代入するとその座標にテレポート |
| `PY` | number | プレイヤーの Y 座標（マップ単位） | 代入するとその座標にテレポート |
| `LOOPLIMIT` | number | `for` 文の最大繰り返し回数 | デフォルト 100,000 |

#### 読み取り専用のシンボル

| シンボル | 型 | 説明 |
|---|---|---|
| `AT_TOTAL` | number | 攻撃力（装備品込み合計） |
| `DF_TOTAL` | number | 防御力（装備品込み合計） |
| `STEP` | number | プレイヤーの移動回数（歩数） |
| `TIME` | number | ゲーム開始からの経過時間（ミリ秒） |
| `PDIR` | number | プレイヤーの向き（2:下 / 4:左 / 6:右 / 8:上） |
| `X` | number | スクリプト実行パーツの X 座標。イベント実行時はプレイヤーの X 座標と同じ |
| `Y` | number | スクリプト実行パーツの Y 座標。イベント実行時はプレイヤーの Y 座標と同じ |
| `ID` | number | スクリプト実行パーツのパーツ番号。イベント実行時は `-1` |
| `TYPE` | number | スクリプト実行パーツの種類（0:物体 / 1:背景）。イベント実行時は `-1` |
| `CX` | number | 画面左上のカメラ X 座標（マップ単位） |
| `CY` | number | 画面左上のカメラ Y 座標（マップ単位） |
| `PLAYER_PX` | number | プレイヤーの画面上のピクセル X 座標 |
| `PLAYER_PY` | number | プレイヤーの画面上のピクセル Y 座標 |
| `MOVE_SPEED` | number | プレイヤーの移動速度（ピクセル/フレーム） |
| `MOVE_FRAME_TIME` | number | 1 マス移動にかかるフレーム数 |
| `ITEM_ID` | number | `CALL_GET_ITEM` / `CALL_USE_ITEM` 内でのみ有効。取得・使用アイテムのパーツ ID。それ以外では `-1` |
| `ITEM_POS` | number | `CALL_GET_ITEM` / `CALL_USE_ITEM` 内でのみ有効。アイテムボックスの位置（1〜12）。それ以外では `-1` |

#### 戦闘専用シンボル（読み取り専用）

`CALC_PLAYER_TO_ENEMY_DAMAGE` / `CALC_ENEMY_TO_PLAYER_DAMAGE` 関数の内部でのみ意味を持ちます。これらへの代入はエラーになります。

| シンボル | 型 | 説明 |
|---|---|---|
| `ENEMY_HP` | number | 敵の生命力 |
| `ENEMY_AT` | number | 敵の攻撃力 |
| `ENEMY_DF` | number | 敵の防御力 |
| `ENEMY_GD` | number | 敵の所持金 |

### 4-2. ユーザー定義変数 `v`

ユーザーが自由に値を保持できる変数です。2 種類の記法があります。

#### `v[N]`：数値添字ユーザー変数

```javascript
v[0] = 100;       // 0〜255 の整数が添字として使える
v[255] = AT + DF; // 式も使える
```

- 添字 `N` は `0` 〜 `255` の整数。
- 格納できる値は**数値のみ**。文字列・配列・オブジェクトは代入不可。
- 初期値は `0`。

#### `v["name"]`：名前付きユーザー変数

```javascript
v["playerName"] = "マサト";   // 文字列を格納
v["score"] = 0;               // 数値も格納可能
v["items"] = [10, 20, 30];    // 配列も格納可能
v["status"] = { atk: 10, def: 5 };  // オブジェクトも格納可能
```

- キーは文字列。
- 数値・文字列・配列・オブジェクトを格納できる。
- 複数次元のアクセスが可能（例: `v["status"]["atk"]`）。
- HP など予約済みシンボル名はキーとして使用不可。

### 4-3. マップ変数

```javascript
m[x][y]  // 座標 (x, y) の背景パーツ番号（読み書き可能）
o[x][y]  // 座標 (x, y) の物体パーツ番号（読み書き可能）
```

```javascript
// 例：プレイヤーの前方のパーツを消す
o[PX][PY - 1] = 0;

// 例：特定座標のパーツを取得して条件分岐
if (m[10][5] == 3) {
    MSG("ここは草原だ");
}
```

### 4-4. アイテムボックス変数

```javascript
ITEM[0] = 10;       // 物体パーツ 10 番のアイテムを空きスロットに追加（書き込み専用）
ITEM[1]             // アイテムスロット 1 番のパーツ番号を取得（1〜12 が有効な添字）
```

- `ITEM[0]` は「アイテムを追加する」特殊な書き込み専用スロット。値の読み取りは不可。
- `ITEM[1]` 〜 `ITEM[12]` は読み取り可能。空スロットは `0`。

### 4-5. ループポインタ `LP[N]`

`for` 文を 4 重以上にネストする際に使用する特殊な配列型ループ変数。

```javascript
for (LP[0] = 0; LP[0] < 5; LP[0]++) {
    for (LP[1] = 0; LP[1] < 5; LP[1]++) {
        // LP[0], LP[1] はここで使える
        o[LP[0]][LP[1]] = 0;
    }
}
```

- `LP[N]` の `N` は 0 以上の整数。
- 上位の `for` で使用中の `LP[N]` を内側の `for` で再利用するとエラー。
- `IS_NUMBER(LP[N])` で LP の初期化状態を確認できる（`for` 外では `false`、`for` 内では `true`）。

---

## 5. 演算子

### 算術演算子

| 演算子 | 説明 | 例 |
|---|---|---|
| `+` | 加算（数値）または文字列結合 | `AT + 10`, `"HP:" + HP` |
| `-` | 減算 | `HP - 50` |
| `*` | 乗算 | `AT * 2` |
| `/` | 除算（小数点以下あり） | `HP / 2` |
| `%` | 剰余（余り） | `STEP % 10` |

**注意**: `+` は数値と文字列で挙動が変わります。`"HP: " + 10 + 5` は `"HP: 105"` になります。数値計算を先にしたい場合は括弧を使ってください: `"HP: " + (10 + 5)`

### 比較演算子

| 演算子 | 説明 | 例 |
|---|---|---|
| `==` | 等値（型変換あり） | `HP == 0` |
| `!=` | 非等値 | `ID != -1` |
| `>` | より大きい | `AT > ENEMY_DF` |
| `<` | より小さい | `HP < 100` |
| `>=` | 以上 | `GD >= 1000` |
| `<=` | 以下 | `v[0] <= 255` |

**注意**: `===` / `!==`（厳密等値）は使用できません。必ず `==` / `!=` を使ってください。

### 論理演算子

| 演算子 | 説明 | 例 |
|---|---|---|
| `&&` | 論理 AND | `HP > 0 && AT > 10` |
| `\|\|` | 論理 OR | `HP <= 0 \|\| GD < 100` |
| `!` | 論理 NOT | `!HAS_ITEM(5)` |

### 代入演算子

| 演算子 | 説明 | 例 |
|---|---|---|
| `=` | 代入 | `HP = 1000` |
| `+=` | 加算代入 | `HP += 50` |
| `-=` | 減算代入 | `GD -= 100` |
| `*=` | 乗算代入 | `AT *= 2` |
| `/=` | 除算代入 | `HP /= 2` |

### インクリメント・デクリメント

後置のみサポートしています。

```javascript
i++   // i を 1 増やす（後置）
i--   // i を 1 減らす（後置）
```

**注意**: 前置（`++i`）は使用できません。

### 三項演算子

```javascript
条件 ? 真の値 : 偽の値

// 例
HP = HP > HPMAX ? HPMAX : HP;   // HP が上限を超えたら上限に丸める
```

### テンプレートリテラル

```javascript
MSG(`HPは${HP}です。ATは${AT}です。`);
MSG(`${v["name"]}の攻撃！ダメージ: ${AT - ENEMY_DF}`);
```

---

## 6. 制御構文

### 6-1. `if` / `else if` / `else`

```javascript
if (HP <= 0) {
    MSG("ゲームオーバー");
} else if (HP <= 100) {
    MSG("ピンチだ！");
} else {
    MSG("まだまだ戦える！");
}
```

- ネストは自由に可能。
- `else if` は何段でも連結できる。

### 6-2. `for` 文

**ループ変数は `i`、`j`、`k`、または `LP[N]` のみ使用できます。それ以外の変数は使用不可です。**

```javascript
// 基本的な for ループ（変数は i, j, k のみ）
for (i = 0; i < 10; i++) {
    o[PX - 5 + i][PY + 1] = RAND(100);
}

// 二重ループ（i と j を組み合わせる）
for (i = 0; i < 5; i++) {
    for (j = 0; j < 5; j++) {
        m[i][j] = 0;
    }
}

// 三重ループ（i, j, k を使う）
for (i = 0; i < 3; i++) {
    for (j = 0; j < 3; j++) {
        for (k = 0; k < 3; k++) {
            // 三重まで可能
        }
    }
}

// 4重以上は LP[N] を使う
for (LP[0] = 0; LP[0] < 2; LP[0]++) {
    for (LP[1] = 0; LP[1] < 2; LP[1]++) {
        for (LP[2] = 0; LP[2] < 2; LP[2]++) {
            for (LP[3] = 0; LP[3] < 2; LP[3]++) {
                // 4重以上も可能
            }
        }
    }
}
```

**制約と注意点**:

- ループ変数 `i`, `j`, `k`, `LP[N]` は同じ変数を外側と内側の両方で使うとエラーになります。
- ループ回数の合計が `LOOPLIMIT`（デフォルト 100,000）を超えると強制終了します。
- 上限を変更したい場合は `for` 文の前に `LOOPLIMIT = 1000000;` のように設定します。
- i++ のみサポート（前置インクリメント `++i` は不可）。`i = i + 2` のような記述も可能です。

#### `break` と `continue`

```javascript
for (i = 0; i < 100; i++) {
    if (o[i][0] == 5) {
        break;     // ループを終了
    }
    if (o[i][0] == 0) {
        continue;  // 次の繰り返しへ
    }
    MSG("パーツ番号: " + o[i][0]);
}
```

### 6-3. 関数定義と呼び出し（外部スクリプトのみ）

`<script>` タグ内では関数を定義できません。**外部スクリプトファイル**（`./script/*.js`）にのみ記述できます。

```javascript
// ./script/index.js 内に定義
function healPlayer(amount) {
    HP += amount;
    if (HP > HPMAX) {
        HP = HPMAX;
    }
    MSG(`${amount}回復した！ HP: ${HP} / ${HPMAX}`);
}
```

```javascript
// パーツのメッセージ内の <script> タグから呼び出す
<script>
healPlayer(100);
```

関数内での `return` は値を返すために使用できます。

```javascript
function calcDamage(atk, def) {
    if (atk > def) {
        return atk - def;
    }
    return 1;  // 最低 1 ダメージ
}
```

---

## 7. 組み込み関数

### 7-1. 基本出力・ゲーム制御

#### `MSG(str)` / `MESSAGE(str)`

メッセージウィンドウを表示します。

```javascript
MSG("こんにちは！");
MSG("HPは" + HP + "です");
MSG(`現在地: (${PX}, ${PY})`);
MSG("1行目\n2行目");    // \n で改行
```

- 引数: 文字列（必須・1つ）
- 戻り値: なし
- `MSG` と `MESSAGE` は同じ動作です。

#### `LOG(value)`

ブラウザの開発者コンソールに値を出力します。デバッグ用。

```javascript
LOG(HP);
LOG("現在のv[0]: " + v[0]);
LOG(v["playerData"]);    // オブジェクトや配列も出力可能
```

- 引数: 任意の値（必須・1つ）
- 戻り値: なし

#### `SHOW_USER_DEF_VAR()`

名前付きユーザー定義変数の一覧をコンソール出力します。デバッグ用。

- 引数: なし
- 戻り値: なし

### 7-2. 乱数

#### `RAND(max)`

0 以上 `max` 未満の整数乱数を返します（`max` は含まない）。

```javascript
v[0] = RAND(10);     // 0〜9 の乱数
AT = RAND(100) + 1;  // 1〜100 の乱数
```

- 引数: 最大値（必須・1つ）
- 戻り値: number（0 以上 max 未満の整数）

### 7-3. プレイヤー操作

#### `JUMPGATE(x, y)`

プレイヤーを指定座標にワープさせます。

```javascript
JUMPGATE(10, 20);
JUMPGATE(PX, PY - 5);  // 式も使用可能
```

- 引数: x 座標（必須）、y 座標（必須）
- 戻り値: なし

#### `CHANGE_PLAYER_IMAGE(srcX, srcY)`

プレイヤーの画像を変更します。引数は画像ファイル上のパーツ座標（パーツ単位）です。

```javascript
CHANGE_PLAYER_IMAGE(2, 0);  // 画像上の x=2, y=0 のパーツ画像に変更
```

- 引数: 画像上の x 座標（必須）、y 座標（必須）
- 戻り値: なし

#### `MOVE(direction)`

プレイヤーを 1 マス移動させます。

```javascript
MOVE(2);  // 下
MOVE(4);  // 左
MOVE(6);  // 右
MOVE(8);  // 上
```

- 引数: 移動方向（2/4/6/8 のいずれか）
- 戻り値: 0

### 7-4. マップ・パーツ操作

#### `PARTS(srcID, destID, type, onlyThisSight)`

マップ上のパーツ番号を一括置換します。

```javascript
PARTS(10, 0, 0);          // 物体パーツ 10 番を全てパーツ 0 番（消去）に変換
PARTS(5, 6, 1);           // 背景パーツ 5 番を背景パーツ 6 番に変換
PARTS(10, 0, 0, true);    // 画面に見えている範囲のみ変換
```

- 引数:
  - `srcID`: 置換元のパーツ番号（必須）
  - `destID`: 置換先のパーツ番号（必須）
  - `type`: パーツ種別（省略可、デフォルト 0）。0 = 物体、1 = 背景
  - `onlyThisSight`: 画面表示範囲のみ対象にするか（省略可、デフォルト false）
- 戻り値: なし

#### `PARTS_MOVE(num)`

パーツの移動マクロを設定します。

- 引数: 移動番号（必須・1つ）
- 戻り値: 0

#### `GET_IMG_POS_X(partsId, isObject, isFirstMotion)`

指定パーツが使用している画像ファイル上の X 座標を返します。

```javascript
v[0] = GET_IMG_POS_X(5);          // 物体パーツ 5 番の画像 X 座標
v[0] = GET_IMG_POS_X(5, 0, 0);    // 物体パーツ 5 番の1つ目の画像
v[0] = GET_IMG_POS_X(5, 0, 1);    // 物体パーツ 5 番の2つ目の画像（モーション）
v[0] = GET_IMG_POS_X(3, 1);       // 背景パーツ 3 番の画像 X 座標
```

- 引数:
  - `partsId`: パーツ番号（必須）
  - `isObject`: パーツ種別（省略可、デフォルト 0）。0 = 物体、1 = 背景
  - `isFirstMotion`: モーション指定（省略可、物体時のみ有効）。0 = 1つ目、1 = 2つ目
- 戻り値: number（パーツ単位の座標）

#### `GET_IMG_POS_Y(partsId, isObject, isFirstMotion)`

指定パーツが使用している画像ファイル上の Y 座標を返します。引数と動作は `GET_IMG_POS_X` と同じです。

### 7-5. アイテム操作

#### `HAS_ITEM(partsId)`

指定したパーツ番号のアイテムをアイテムボックスに所持しているかを返します。

```javascript
if (HAS_ITEM(20)) {
    MSG("鍵を持っている！");
}
```

- 引数: パーツ番号（必須・1つ）
- 戻り値: boolean（所持している場合 true）

#### `REMOVE_ITEM(partsId, isAll)`

アイテムボックスから指定パーツのアイテムを削除します。

```javascript
REMOVE_ITEM(20);        // パーツ 20 番のアイテムを 1 つ削除
REMOVE_ITEM(20, 0);     // 同上
REMOVE_ITEM(20, 1);     // パーツ 20 番のアイテムを全て削除
```

- 引数:
  - `partsId`: 削除するパーツ番号（必須）
  - `isAll`: 0 で 1 つだけ削除、1 で全削除（省略可、デフォルト 0）
- 戻り値: number（削除したアイテム数）

### 7-6. サウンド

#### `SOUND(soundNumber)`

指定番号のサウンドを再生します。そのサウンド番号を配置したパーツが存在する場合のみ鳴ります。

```javascript
SOUND(3);
```

- 引数: サウンド番号（必須・1つ）
- 戻り値: number（指定した番号）

### 7-7. 視覚エフェクト

#### `FACE(destX, destY, srcX, srcY, width, height)`

メッセージウィンドウに顔画像を表示します。全引数が必須で 0 以上の整数です。

```javascript
FACE(0, 0, 4, 2, 2, 2);  // 画面上の (0,0) に、画像上 (4,2) から 2x2 パーツの範囲を表示
```

- 引数: 6 つ（全て必須）
- 戻り値: なし

#### `EFFECT(waitTime, x1, y1, x2, y2, ...)`

エフェクトを表示します。`waitTime = 0` でエフェクトを停止します。

```javascript
EFFECT(6, 0, 0, 1, 0, 2, 0);  // 6フレーム間隔で、(0,0), (1,0), (2,0) の画像をアニメーション
EFFECT(0);                     // エフェクト停止
```

- 引数: `waitTime`（必須）、以降 x/y 座標のペアを繰り返す
- 戻り値: なし

#### `PICTURE(layerNumber, propertyDefinition)`

画面上に任意の画像やテキストを表示するピクチャ機能です。

```javascript
PICTURE(0);                       // レイヤー 0 のピクチャを削除
PICTURE(0, "マップ名");           // 文字列でテキスト表示
PICTURE(0, { pos: [100, 50], text: "HP残量", opacity: 0.8 });  // オブジェクト指定
```

- 引数: レイヤー番号（必須）、プロパティ定義（省略すると削除）
- 戻り値: なし

#### `PICTURE_FROM_PARTS(layerNumber, partsId, partsType)`

パーツのピクチャ設定からピクチャを表示します。

```javascript
PICTURE_FROM_PARTS(0, 10);      // 物体パーツ 10 番のピクチャ設定を使って表示
PICTURE_FROM_PARTS(0, 10, 1);   // 背景パーツ 10 番のピクチャ設定を使って表示
PICTURE_FROM_PARTS(0, 0);       // レイヤー 0 のピクチャを削除
```

- 引数: レイヤー番号（必須）、パーツ番号（必須）、パーツ種別（省略可、デフォルト 0 = 物体）
- 戻り値: なし

#### `CLEAR_ALL_PICTURES()`

全てのレイヤーのピクチャを削除します。

- 引数: なし
- 戻り値: なし

#### `HAS_PICTURE(layerNumber)`

指定レイヤーにピクチャが存在するか返します。

- 引数: レイヤー番号（必須）
- 戻り値: boolean

### 7-8. ゲーム設定

#### `SAVE(isDisable)`

セーブ機能の有効・無効を切り替えます。

```javascript
SAVE(true);   // セーブを無効にする
SAVE(false);  // セーブを有効にする
```

- 引数: boolean（必須・1つ）
- 戻り値: boolean

#### `CHANGE_GAMEOVER_POS(x, y)`

ゲームオーバー時の復帰座標を変更します。

```javascript
CHANGE_GAMEOVER_POS(5, 10);
```

- 引数: x 座標（必須）、y 座標（必須）
- 戻り値: なし

#### `GET_GAMEOVER_POS_X()` / `GET_GAMEOVER_POS_Y()`

現在のゲームオーバー復帰座標を返します。

```javascript
v[0] = GET_GAMEOVER_POS_X();
v[1] = GET_GAMEOVER_POS_Y();
```

- 引数: なし
- 戻り値: number

#### `ABLE_CHANGE_SPEED(isAble)`

プレイヤーによる移動速度変更の可否を設定します。

```javascript
ABLE_CHANGE_SPEED(true);   // 速度変更を許可
ABLE_CHANGE_SPEED(false);  // 速度変更を禁止
```

- 引数: boolean（必須・1つ）
- 戻り値: boolean

#### `SET_SPEED(speedIndex)`

移動速度を設定します。

- 引数: 速度インデックス（必須・1つ）
- 戻り値: なし

#### `HIDE_STATUS(target, isHide)`

ステータス表示を隠す・見せるを制御します。

```javascript
HIDE_STATUS(0, true);   // HP を非表示にする
HIDE_STATUS(0, false);  // HP を表示する
```

- 引数: 対象（必須）、非表示フラグ（必須）
- 戻り値: なし

#### `CHANGE_SYSMSG(code, message)`

システムメッセージを変更します。

```javascript
CHANGE_SYSMSG("NO_ITEM", "アイテムがない！");  // 文字列コードで指定
CHANGE_SYSMSG(1, "アイテムがない！");           // 数値コードで指定
CHANGE_SYSMSG("NO_ITEM");                      // 第 2 引数省略でリセット
```

- 引数: システムメッセージコード（必須）、メッセージ（省略するとリセット）
- 戻り値: なし

#### `DEL_PLAYER(isDelete)`

プレイヤーを削除・復帰させます。

- 引数: boolean（必須・1つ）
- 戻り値: なし

#### `RESTART_GAME()`

ゲームを再スタートします。

- 引数: なし
- 戻り値: なし

#### `IS_PLAYER_WAITING_MESSAGE()`

プレイヤーがメッセージウィンドウの入力待ちかどうかを返します。

- 引数: なし
- 戻り値: boolean

### 7-9. 日時・時間

```javascript
GET_UNIXTIME()          // 現在の UNIX タイム（秒）
GET_DATE_YEAR()         // 現在の年
GET_DATE_MONTH()        // 現在の月（1〜12）
GET_DATE_DAY()          // 現在の日（1〜31）
GET_DATE_HOUR()         // 現在の時（0〜23）
GET_DATE_MINUTES()      // 現在の分（0〜59）
GET_DATE_SECONDS()      // 現在の秒（0〜59）
GET_DATE_MILLISECONDS() // 現在のミリ秒（0〜999）
GET_DATE_WEEKDAY()      // 現在の曜日（0:日〜6:土）
```

全て引数なし、戻り値 number です。

### 7-10. 計算ユーティリティ

#### `ABS(value)`

絶対値を返します。

```javascript
v[0] = ABS(AT - ENEMY_AT);
```

- 引数: 数値（必須・1つ）
- 戻り値: number

#### `LENGTH(value)`

配列の要素数、オブジェクトのキー数、または文字列の文字数を返します。

```javascript
v[0] = LENGTH(v["items"]);       // 配列の要素数
v[0] = LENGTH(v["status"]);      // オブジェクトのキー数
v[0] = LENGTH("hello");          // 文字列の長さ → 5
```

- 引数: 配列・オブジェクト・文字列（必須・1つ）。数値・null に使うとエラー。
- 戻り値: number

#### `IS_NUMBER(value)`

値が数値型かどうかを返します。主にループポインタ `LP[N]` の使用可能判定に使います。

```javascript
if (IS_NUMBER(LP[0])) {
    // LP[0] が for ループ内で使用中の場合 true
}
```

- 引数: 任意の値（必須・1つ）
- 戻り値: boolean

### 7-11. スクリプト制御

#### `EXIT(statusCode)`

スクリプトの実行を即座に中断します。

```javascript
if (HP <= 0) {
    MSG("体力が足りない");
    EXIT(0);  // ここで処理を中断
}
AT += 100;  // EXIT() が呼ばれると、これ以降は実行されない
```

- 引数: ステータスコード（現在は使用されていないが記述する。0 推奨）
- 戻り値: なし（例外スロー）

#### `ABORT_BATTLE()`

`CALC_PLAYER_TO_ENEMY_DAMAGE` / `CALC_ENEMY_TO_PLAYER_DAMAGE` 関数内で使用すると戦闘を即座に中断します。それ以外の場所で呼んだ場合も `EXIT()` 相当の動作をします。

---

## 8. カスタムイベント関数

外部スクリプトファイル内に以下の関数名で定義すると、特定のゲームイベント発生時に自動で呼び出されます。

### 8-1. ゲームライフサイクル

| 関数名 | 呼び出されるタイミング |
|---|---|
| `CALL_WWA_START()` | ゲーム開始時（最初の一度のみ） |
| `CALL_RESTART()` | リスタート時 |
| `CALL_GAMEOVER()` | ゲームオーバー時 |
| `CALL_FRAME()` | 毎フレーム（約 16ms ごと） |

### 8-2. プレイヤーアクション

| 関数名 | 呼び出されるタイミング |
|---|---|
| `CALL_MOVE()` | プレイヤーが 1 マス移動するたび |
| `CALL_CAMERA_MOVE()` | 移動操作でマップ画面が切り替わった時 |
| `CALL_JUMPGATE()` | ジャンプゲートで移動した時 |
| `CALL_CHANGE_SPEED()` | 移動速度を変更した時 |

### 8-3. アイテム操作

| 関数名 | 呼び出されるタイミング | 利用可能な特殊変数 |
|---|---|---|
| `CALL_GET_ITEM()` | アイテムを取得した時 | `ITEM_ID`, `ITEM_POS` |
| `CALL_USE_ITEM()` | アイテムを使用した時 | `ITEM_ID`, `ITEM_POS` |
| `CALL_GET_ITEM_FULL()` | アイテムがいっぱいで取得できなかった時 | `ITEM_ID`, `ITEM_POS` |

### 8-4. セーブ・ロード

| 関数名 | 呼び出されるタイミング |
|---|---|
| `CALL_SAVE()` | セーブ時 |
| `CALL_QUICKLOAD()` | クイックロード時 |
| `CALL_PASSWORDLOAD()` | パスワードロード時 |
| `CALL_BATTLE_REPORT()` | バトルレポートを見た時 |

### 8-5. キー入力

`CALL_PUSH_A()` 〜 `CALL_PUSH_Z()`、`CALL_PUSH_ENTER()`、`CALL_PUSH_ESC()`、`CALL_PUSH_SPACE()`、`CALL_PUSH_LEFT()`、`CALL_PUSH_RIGHT()`、`CALL_PUSH_UP()`、`CALL_PUSH_DOWN()`

### 8-6. 戦闘ダメージカスタム

```javascript
// プレイヤーから敵へのダメージ計算（return 値がダメージ量）
function CALC_PLAYER_TO_ENEMY_DAMAGE() {
    if (AT > ENEMY_DF) {
        return AT - ENEMY_DF;
    }
    return 0;
}

// 敵からプレイヤーへのダメージ計算（return 値がダメージ量）
function CALC_ENEMY_TO_PLAYER_DAMAGE() {
    if (ENEMY_AT > DF) {
        return ENEMY_AT - DF;
    }
    return 0;
}
```

**重要**: `CALC_PLAYER_TO_ENEMY_DAMAGE` / `CALC_ENEMY_TO_PLAYER_DAMAGE` の内部では、`HP`, `AT`, `DF`, `GD` などの**変数を書き換えないでください**。これらの関数は戦闘予測画面でも内部的に呼び出されるため、変数を書き換えると意図しない動作が発生します。

---

## 9. 外部スクリプトファイル

### ファイル構成

```
game/
├── game.dat              （マップデータ）
└── script/
    ├── script_file_list.json  （読み込みリスト）
    ├── index.js               （メインスクリプト）
    └── lib.js                 （ライブラリ）
```

### `script_file_list.json`

```json
[
    "./script/index.js",
    "./script/lib.js"
]
```

### 外部スクリプトでできること・できないこと

| できること | できないこと |
|---|---|
| 関数の定義 | トップレベルでの即時実行コード |
| カスタムイベント関数の定義 | `var`/`let`/`const` を使った変数宣言（関数の引数は除く） |
| WWAScript の組み込み関数の呼び出し | |
| 他の外部スクリプトの関数の呼び出し | |

**注意**: 外部スクリプトの関数内でも、`var`/`let`/`const` による変数宣言は**できません**。ローカル変数が必要な場合は `v[N]` や `v["name"]` を使ってください。関数の**引数**はそのまま使用できます。

---

## 10. 禁止事項一覧

WWAScript では以下の JavaScript 構文・機能は使用できません。これらを記述するとパースエラーまたは実行時エラーになります。

### 絶対に使えない構文

```javascript
// NG: 変数宣言
var x = 10;
let name = "test";
const MAX = 100;

// NG: 関数定義（<script>タグ内）
function myFunc() { ... }

// NG: アロー関数
const fn = () => { ... };

// NG: while / do-while
while (HP > 0) { ... }
do { ... } while (i < 10);

// NG: switch 文
switch (PDIR) { case 2: ...; }

// NG: 厳密等値演算子
if (x === 0) { ... }
if (y !== null) { ... }

// NG: typeof / instanceof
typeof HP

// NG: new キーワード
new Date()

// NG: try / catch / throw
try { ... } catch (e) { ... }

// NG: class
class MyClass { ... }

// NG: import / export
import x from "./module.js"

// NG: 前置インクリメント
++i

// NG: void 演算子
void someFunc()
```

### 代入できない変数

```javascript
// NG: 読み取り専用シンボルへの代入
AT_TOTAL = 100;
DF_TOTAL = 50;
ENEMY_HP = 0;
ENEMY_AT = 0;
ENEMY_DF = 0;
ENEMY_GD = 0;
X = 10;
Y = 10;
ID = 5;
TYPE = 0;
CX = 0;
CY = 0;
PLAYER_PX = 0;
PLAYER_PY = 0;
MOVE_SPEED = 1;
MOVE_FRAME_TIME = 10;
LP = 0;      // LP は直接使用不可（LP[N] を使う）

// NG: v[N] に数値以外を代入
v[0] = "hello";
v[0] = [1, 2, 3];
v[0] = { key: "value" };

// NG: v[N] のキーに不正な値
v[{key: "x"}] = 10;
v[null] = 10;
```

### for 文の制約

```javascript
// NG: i, j, k, LP[N] 以外のループ変数
for (v[0] = 0; v[0] < 10; v[0]++) { ... }

// NG: 同じ変数を重複使用
for (i = 0; i < 5; i++) {
    for (i = 0; i < 3; i++) { ... }  // 外側でiを使っているのでエラー
}

// NG: LP を直接使用（LP[N] を使う）
for (LP = 0; LP < 5; LP++) { ... }

// NG: LP の添字に文字列
for (LP["hoge"] = 0; LP["hoge"] < 5; LP["hoge"]++) { ... }
```

---

## 11. コード例集

### 例 1：条件によってアイテムで扉を開ける

```javascript
if (HAS_ITEM(20)) {
    REMOVE_ITEM(20);
    o[PX][PY - 1] = 0;
    MSG("扉が開いた！");
} else {
    MSG("鍵がないと扉は開かないようだ...");
}
```

### 例 2：ランダムなボーナスを与える

```javascript
v[0] = RAND(3);
if (v[0] == 0) {
    HP += 100;
    MSG("HPが100回復した！");
} else if (v[0] == 1) {
    AT += 10;
    MSG("ATが10上がった！");
} else {
    GD += 500;
    MSG("500ゴールド手に入れた！");
}
```

### 例 3：マップ範囲をまとめて書き換える

```javascript
for (i = 0; i < 10; i++) {
    for (j = 0; j < 10; j++) {
        o[PX - 5 + i][PY - 5 + j] = 0;  // 周囲 10x10 の物体パーツを消す
    }
}
```

### 例 4：名前付き変数でデータ管理

```javascript
// 複雑なデータをオブジェクトで管理
v["questLog"] = {
    "forest": false,
    "cave": false,
    "castle": false
};

// クエスト完了フラグを立てる
v["questLog"]["forest"] = true;

// 全クエスト完了判定
if (v["questLog"]["forest"] == true &&
    v["questLog"]["cave"] == true &&
    v["questLog"]["castle"] == true) {
    MSG("全てのクエストをクリアした！");
}
```

### 例 5：外部スクリプトの関数定義とカスタムイベント

```javascript
// ./script/index.js

// ゲーム開始時の初期化
function CALL_WWA_START() {
    v["visitCount"] = 0;
    v["totalGold"] = 0;
    LOG("ゲーム開始！初期化完了");
}

// 移動ごとにカウント
function CALL_MOVE() {
    v["visitCount"] += 1;
}

// アイテム取得時の処理
function CALL_GET_ITEM() {
    LOG(`アイテム取得: ID=${ITEM_ID}, スロット=${ITEM_POS}`);
}

// 汎用的なヒール関数（パーツから呼び出す用）
function heal(amount) {
    HP += amount;
    if (HP > HPMAX) {
        HP = HPMAX;
    }
    MSG(`${amount}回復した！ HP: ${HP} / ${HPMAX}`);
}
```

### 例 6：ループポインタで深いネスト

```javascript
// 4重ループで3D配列を初期化するイメージ
for (LP[0] = 0; LP[0] < 4; LP[0]++) {
    for (LP[1] = 0; LP[1] < 4; LP[1]++) {
        for (LP[2] = 0; LP[2] < 4; LP[2]++) {
            for (LP[3] = 0; LP[3] < 4; LP[3]++) {
                // LP[N] は for ブロック内のみで有効
                LOG(`[${LP[0]}][${LP[1]}][${LP[2]}][${LP[3]}]`);
            }
        }
    }
}
```

### 例 7：テンプレートリテラルを使ったメッセージ

```javascript
MSG(`現在地: (${PX}, ${PY})
HP: ${HP} / ${HPMAX}
AT: ${AT}  DF: ${DF}
所持金: ${GD}G`);
```

### 例 8：カスタムダメージ計算

```javascript
// ./script/index.js

// プレイヤー → 敵のダメージ（2乗補正版）
function CALC_PLAYER_TO_ENEMY_DAMAGE() {
    if (AT > ENEMY_DF) {
        return AT - ENEMY_DF;
    }
    return 1;  // 最低 1 ダメージ
}

// 敵 → プレイヤーのダメージ（HPが低いと被ダメ軽減）
function CALC_ENEMY_TO_PLAYER_DAMAGE() {
    v[100] = ENEMY_AT - DF;
    if (v[100] <= 0) {
        return 0;
    }
    // HP が低いと被ダメが半減
    if (HP < HPMAX / 2) {
        return v[100] / 2;
    }
    return v[100];
}
```

---

## 付録：コード生成時のチェックリスト

生成したコードが正しいか確認するためのリストです。

- [ ] `var` / `let` / `const` を使っていないか
- [ ] `for` ループの変数が `i`, `j`, `k`, `LP[N]` のいずれかになっているか
- [ ] `===` / `!==` ではなく `==` / `!=` を使っているか
- [ ] `v[N]` に数値以外を代入していないか（数値以外は `v["name"]` を使う）
- [ ] `<script>` タグ内で関数定義をしていないか（関数定義は外部スクリプトファイルのみ）
- [ ] `++i`（前置インクリメント）ではなく `i++`（後置）または `i = i + 1` を使っているか
- [ ] `ENEMY_HP` / `AT_TOTAL` などの読み取り専用シンボルに代入していないか
- [ ] `while` / `do-while` / `switch` を使っていないか
- [ ] ループが終了条件を持っており、`LOOPLIMIT` を超えないか
- [ ] `MSG()` の引数が文字列型になっているか（数値や変数は文字列に変換するか結合する）
