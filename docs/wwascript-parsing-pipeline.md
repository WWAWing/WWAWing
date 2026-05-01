# WWAScript 構文解析パイプライン 調査レポート

## 概要

WWAScript は JavaScript をベースにした独自言語で、セキュリティ上の理由から `eval()` を使わず、以下の 5 段階のパイプラインで実行されます。

```
テキスト文字列
    │
    ▼ (1) メッセージ前処理
分離されたスクリプト文字列
    │
    ▼ (2) Acorn によるパース
Acorn AST (標準 JavaScript AST)
    │
    ▼ (3) WWANode 変換
WWANode[] (WWA 独自中間表現)
    │
    ▼ (4) 検証・制約チェック
検証済み WWANode[]
    │
    ▼ (5) 評価・実行
ゲームへの副作用
```

---

## 各ステージの詳細

### (1) メッセージ前処理

**実装ファイル**: `packages/engine/src/wwa_message/_internal/index.ts`

パーツのメッセージテキストから、スクリプト部分を分離します。

#### `normalizeMessage()`

コメントの削除やページ区切りタグの正規化を行います。

- `<c>` / `//` によるコメント行を削除
- `<P>` タグ周辺の改行を統一

#### `splitMessageByTags()`

メッセージを `<script>` タグで分割します。

```
"こんにちは<P>さようなら<script>HP = 1000;"
                          ↓
pageContents: ["こんにちは", "さようなら"]
script:       "HP = 1000;"
```

`<script>` より前がメッセージ本文、後ろがスクリプト文字列として扱われます。スクリプトは最初のページの先頭ノードとして挿入され、メッセージ表示前に実行されます。

---

### (2) Acorn によるパース

**実装ファイル**: `packages/engine/src/wwa_expression2/index.ts`

```typescript
export function parse(rawMessage: string): Acorn.Node {
  return Acorn.parse(rawMessage, { ecmaVersion: 2020 });
}
```

[Acorn](https://github.com/acornjs/acorn) ライブラリに ECMAScript 2020 モードでスクリプト文字列を渡し、標準の JavaScript AST を生成します。このステップでは構文エラー（括弧の閉じ忘れなど）が検出されます。

---

### (3) Acorn AST → WWANode 変換

**実装ファイル**: `packages/engine/src/wwa_expression2/converter.ts`

`convertNodeAcornToWwaArray()` / `convertNodeAcornToWwa()` が Acorn の AST を WWA 独自の中間表現（WWANode）に変換します。

#### 対応している Acorn AST ノード

| Acorn ノード型 | 変換後の WWANode 型 | 説明 |
|---|---|---|
| `Program` | - | トップレベル。body を順に変換 |
| `ExpressionStatement` | - | 式文。内部の式に委譲 |
| `AssignmentExpression` | `PartsAssignment` / `ItemAssignment` / `UserVariableAssignment` / `SpecialParameterAssignment` / `LoopPointerAssignment` | 代入先の種類に応じて分類 |
| `MemberExpression` | `ArrayOrObject1D` / `ArrayOrObject2D` / `ArrayOrObject3DPlus` | `m[x][y]` / `v["key"]` などの配列アクセス |
| `Identifier` | `Symbol` / `Literal` | 予約語なら `Symbol`、未知なら `Literal` (関数名として扱う) |
| `Literal` | `Literal` | 数値・文字列リテラル |
| `CallExpression` | `Random` / `Jumpgate` / `Msg` / `AnyFunction` / `CallDefinedFunction` | 特殊関数は個別変換、組み込み関数は `AnyFunction`、ユーザー定義は `CallDefinedFunction` |
| `IfStatement` | `IfStatement` | if/else if/else |
| `BlockStatement` | `BlockStatement` | `{}` ブロック |
| `FunctionDeclaration` | `DefinedFunction` | 外部スクリプト内の関数定義 |
| `ForStatement` | `ForStatement` | for ループ |
| `UpdateExpression` | `UpdateExpression` | `i++` / `i--` |
| `LogicalExpression` | `LogicalExpression` | `&&` / `\|\|` |
| `BreakStatement` | `Break` | break |
| `ContinueStatement` | `Continue` | continue |
| `ReturnStatement` | `Return` | return |
| `TemplateLiteral` | `TemplateLiteral` | テンプレートリテラル `` `${HP}` `` |
| `TemplateElement` | `TemplateElement` | テンプレートリテラルの静的部分 |
| `ConditionalExpression` | `ConditionalExpression` | 三項演算子 `a ? b : c` |
| `BinaryExpression` | `BinaryOperation` | 二項演算 `+`, `-`, `*`, `/`, `%`, `>`, `<`, `>=`, `<=`, `==`, `!=` |
| `UnaryExpression` | `UnaryOperation` | 単項演算 `+`, `-`, `!` |
| `ObjectExpression` | `ObjectExpression` | オブジェクトリテラル `{ key: val }` |
| `ArrayExpression` | `ArrayExpression` | 配列リテラル `[1, 2, 3]` |
| `Property` | `Property` | オブジェクトのプロパティ |

#### 変換時の制約チェック（セキュリティ境界）

変換フェーズで以下の制約が強制されます。

**代入可能なシンボルの制限 (`convertAssignmentExpression`)**

```typescript
// 以下のシンボルへの代入はエラー
"m", "o", "v", "ITEM", "X", "Y", "ID", "TYPE", "CX", "CY",
"PICTURE", "PLAYER_PX", "PLAYER_PY", "MOVE_SPEED", "MOVE_FRAME_TIME",
"LP", "undefined",
"AT_TOTAL", "DF_TOTAL",          // 装備品込みステータス（読み取り専用）
"ENEMY_HP", "ENEMY_AT", "ENEMY_DF", "ENEMY_GD"  // 敵ステータス（読み取り専用）
```

**配列次元の制限 (`convertMemberExpression`)**

| 変数 | 最大次元 |
|---|---|
| `m[x][y]` | 2次元まで |
| `o[x][y]` | 2次元まで |
| `ITEM[N]` | 1次元まで |
| `v[...]` | 無制限（3次元以上は `ArrayOrObject3DPlus`） |
| `LP[N]` | 1次元まで |
| `PICTURE[...]` | 1次元まで |

**Objectキーの制限 (`convertProperty`)**

オブジェクトリテラルのキーに予約済みシンボル名（`HP`, `PX` など）は使用不可。

**許可された演算子のみ (`convertBinaryExpression`, `convertUnaryExpression`)**

- 二項演算子: `+`, `-`, `*`, `/`, `%`, `>`, `<`, `>=`, `<=`, `==`, `!=`
- 単項演算子: `+`, `-`, `!`
- `===` / `!==` など厳密等値演算子は未対応

---

### (4) WWANode 型定義

**実装ファイル**: `packages/engine/src/wwa_expression2/wwa.ts`

変換後の中間表現として以下の union 型が定義されています。

```typescript
export type WWANode =
  | PartsAssignment       // m[x][y] = val
  | ItemAssignment        // ITEM[N] = val
  | UserVariableAssignment // v[N] = val, v["key"] = val
  | SpecialParameterAssignment // HP = val, AT = val, ...
  | LoopPointerAssignment // LP[N] = val
  | UnaryOperation        // !x, -x, +x
  | BinaryOperation       // x + y, x > y, ...
  | ArrayOrObject1D       // v[N], ITEM[N], m[x], LP[N]
  | ArrayOrObject2D       // m[x][y], o[x][y]
  | ArrayOrObject3DPlus   // v[a][b][c]...
  | Literal               // 数値・文字列リテラル
  | Symbol                // HP, PX, v, m, i, j, k, ...
  | Random                // RAND(n)
  | Jumpgate              // JUMPGATE(x, y)
  | Msg                   // MSG("..."), MESSAGE("...")
  | IfStatement           // if (...) {...} else {...}
  | BlockStatement        // { ... }
  | ForStatement          // for (i=0; i<n; i++) { ... }
  | AnyFunction           // SOUND(n), LOG(x), ...
  | DefinedFunction       // function CALL_XXX() { ... }
  | CallDefinedFunction   // ユーザー定義関数呼び出し
  | Break                 // break
  | Continue              // continue
  | Return                // return val
  | UpdateExpression      // i++, i--
  | LogicalExpression     // a && b, a || b
  | TemplateLiteral       // `${HP}`
  | TemplateElement       // テンプレートの静的部分
  | ConditionalExpression // a ? b : c
  | Property              // { key: val }
  | ObjectExpression      // { key: val, ... }
  | ArrayExpression       // [a, b, c]
  | LoopPointerAssignment // LP[N] = val
```

---

### (5) 評価・実行

**実装ファイル**: `packages/engine/src/wwa_expression2/eval.ts`

#### `EvalCalcWwaNodeGenerator` クラス

WWA エンジン本体 (`WWA` クラス) への参照を持ち、実行コンテキストを管理します。

```typescript
class EvalCalcWwaNodeGenerator {
  wwa: WWA;                // ゲームエンジン本体
  loop_limit: number;      // for文の最大繰り返し回数 (デフォルト 100,000)
  state: {
    triggerParts?,         // 呼び出し元パーツの情報
    earnedItem?,           // アイテム取得情報 (ITEM_ID, ITEM_POS 用)
    battleDamageCalculation?, // 戦闘ダメージ計算モード
    messagePageAdditionalQueue, // FACE 関数のキュー
  }
}
```

#### `EvalCalcWwaNode` クラス

単一スクリプト実行の評価器です。`evalWwaNode()` が switch 文で各ノードを処理します。

**`for` 文の管理**

```typescript
private for_id: {
  i: number | null,      // ループ変数 i の現在値
  j: number | null,      // ループ変数 j の現在値
  k: number | null,      // ループ変数 k の現在値
  LP: number[],          // Loop Pointer 配列
  loopCount: number,     // 現在の総ループカウント
  break_flag: boolean,   // break が発火したか
  continue_flag: boolean // continue が発火したか
}
```

同名のループ変数が既に外側の `for` で使用されている場合はエラー、最大 `loop_limit` 回を超えるとエラーで強制終了します。

**`return` / `EXIT()` の制御フロー**

例外スローによって実装されています。

- `return val` → `ReturnedInformation` 例外をスロー
- `EXIT()` → `ExitInformation` 例外をスロー
- 呼び出し元 (`evalWwaNode` / `wrapCallFunction`) がこれをキャッチして処理を中断

**`AnyFunction` の実行 (`evalAnyFunction`)**

組み込み関数は `switch (functionName)` で処理が分岐し、`this.generator.wwa` を通じてゲームエンジンの API を呼び出します（例: `playSound()`, `setGameOverPosition()` など）。

---

## スクリプト実行のエントリーポイント

### インラインスクリプト（`<script>` タグ）

```
wwa_main.ts: _execEvalString(evalString, triggerParts?)
  │
  ├─ convertWwaNodes(evalString)
  │    ├─ ExpressionParser2.parse(evalString)       // Acorn パース
  │    └─ ExpressionParser2.convertNodeAcornToWwaArray(node) // WWANode 変換
  │
  ├─ evalCalcWwaNodeGenerator.setTriggerParts(...)  // パーツ情報をセット
  ├─ evalCalcWwaNodeGenerator.evalWwaNodes(nodes)   // 実行
  └─ evalCalcWwaNodeGenerator.clearTemporaryState() // 後片付け
```

### 外部スクリプト（`./script/*.js`）

```
wwa_main.ts: setUserScript(userScriptResponse)
  │
  ├─ convertWwaNodes(data)      // パース (インラインと同じ)
  │
  └─ nodes.forEach(node)
       └─ node.type === "DefinedFunction" の場合
            → userDefinedFunctions[functionName] = node.body
              // カスタムイベント関数を登録しておく
```

カスタムイベント発火時（`CALL_WWA_START`, `CALL_MOVE` など）:

```
wwa_main.ts: callXxxUserDefineFunction()
  └─ evalCalcWwaNodeGenerator.evalWwaNode(userDefinedFunctions["CALL_XXX"])
```

---

## 2つのパーサーモジュール

プロジェクトには現在 2 種類のパーサーモジュールが共存しています。

| モジュール | パス | 用途 | 状態 |
|---|---|---|---|
| `wwa_expression` (v1) | `packages/engine/src/wwa_expression/` | マクロ条件式 (`$if`, `$else_if`, `$show_str` など) | 廃止予定 |
| `wwa_expression2` (v2) | `packages/engine/src/wwa_expression2/` | `<script>` タグ内の完全な WWAScript | 現行・主要 |

v1 は Acorn を使わず独自の正規表現パーサーで `HP > 100` のような比較式を解析します（`parsers.ts`, `eval.ts`）。v2 への完全移行を目指しており、コード上にも `HACK: expressionParser 依存を打ち切りたい` というコメントが残っています。

---

## セキュリティ設計のポイント

1. **`eval()` を一切使用しない**: Acorn でパースした AST を独自 IR（WWANode）に変換し、変換された IR のみを実行します。
2. **ホワイトリスト方式の識別子**: `convertIdentifer()` で既知のシンボル名のみを `Symbol` ノードとして認識し、未知の識別子は単なる `Literal` か `CallDefinedFunction` として扱います。未知の `Identifier` がステータス変数として解釈されることはありません。
3. **未対応 AST ノードはエラー**: `var/let/const` による変数宣言（`VariableDeclaration` ノード）などは switch 文の `default` でエラーになります。
4. **無限ループ対策**: `for` 文のループ変数を `i/j/k` と `LP[N]` のみに制限し、ループ回数を上限（デフォルト 100,000 回）で打ち切ります。
5. **読み取り専用シンボルの保護**: 代入式の変換時に読み取り専用のシンボルへの代入を明示的にエラーとして弾きます。
