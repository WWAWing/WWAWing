# WWAScript に関数を追加する手順

このドキュメントは JavaScript / Node.js の基礎知識はあるものの、WWAWing プロジェクトに携わったことがないエンジニア向けに、WWAScript へ新しい組み込み関数を追加する手順を解説します。

---

## 前提知識：関数追加に関わる仕組みの全体像

WWAScript の「組み込み関数（`RAND`, `MSG`, `HAS_ITEM` など）」を追加するには、**2 つのファイルを編集する**だけです。

```
packages/engine/src/wwa_expression2/
├── converter.ts   ← ① 関数名を「認識リスト」に追加する
└── eval.ts        ← ② 関数の実際の処理を実装する
```

処理の流れを整理すると次のようになります。

```
ユーザーが書いたスクリプト文字列
   │  "MY_FUNC(100, 200)"
   ▼
【Acorn】JavaScript パーサーが文字列を AST (構文木) に変換
   │  CallExpression { callee: "MY_FUNC", arguments: [100, 200] }
   ▼
【converter.ts】convertCallExpression()
   │  関数名が認識リストにある → AnyFunction ノードに変換
   │  認識リストにない → CallDefinedFunction ノードに変換 (ユーザー定義関数扱い)
   ▼
【eval.ts】evalAnyFunction()
   │  switch(functionName) で処理を分岐
   └→ this.generator.wwa.〇〇() でゲームエンジンの機能を呼び出す
```

---

## ハンズオン：`CLAMP(value, min, max)` を追加してみる

具体的なイメージをつかむため、「値を指定範囲内に収める」 `CLAMP` 関数を例に解説します。

```javascript
// 使用イメージ
HP = CLAMP(HP, 0, 1000);  // HP を 0 〜 1000 の範囲に収める
```

---

### ステップ 1：`converter.ts` に関数名を登録する

**ファイル**: `packages/engine/src/wwa_expression2/converter.ts`

`convertCallExpression` 関数の中に、認識済み関数名を列挙した `switch` 文があります。

```typescript
function convertCallExpression(node: Acorn.CallExpression): Wwa.WWANode  {
  const functionName = node.callee.name;
  switch(functionName) {
    case "RAND":
      return execRandomFunction(node.arguments);
    case "JUMPGATE":
      return execJumpgateFunction(node.arguments);
    // ... 中略 ...
    case "IS_NUMBER":
      return execAnyFunction(node.arguments, functionName);  // ← ここまでが既存
    default:
      return {
        type: "CallDefinedFunction",
        functionName: functionName
      }
  }
}
```

**ほとんどの関数は `execAnyFunction` を呼ぶだけです。** 既存の `case` の末尾に追加します。

```diff
    case "IS_NUMBER":
+   case "CLAMP":          // ← 追加する
      return execAnyFunction(node.arguments, functionName);
```

> **なぜこの登録が必要か？**
>
> この `switch` に登録されていない関数名は `CallDefinedFunction`（ユーザー定義関数の呼び出し）として扱われます。ユーザー定義関数として処理されると、`eval.ts` の `callDefinedFunction` が実行されますが、対応する関数が登録されていないため「未定義の関数が呼び出されました」というエラーになります。

---

### ステップ 2：`eval.ts` に処理を実装する

**ファイル**: `packages/engine/src/wwa_expression2/eval.ts`

`evalAnyFunction` メソッドの `switch` 文に `case` を追加します。

```typescript
evalAnyFunction(node: Wwa.AnyFunction) {
  const game_status = this.generator.wwa.getGameStatus();
  switch(node.functionName) {
    case "SOUND": { ... }
    // ... 中略 ...
    case "IS_NUMBER": { ... }   // ← ここまでが既存

    // ↓ 追加する
    case "CLAMP": {
      // 引数の数チェック（最低でも3つ必要）
      this._checkArgsLength(3, node);

      // 引数を評価して JavaScript の値に変換する
      // evalWwaNode() を必ず通すこと。生の node.value[N] は使わない。
      const value = Number(this.evalWwaNode(node.value[0]));
      const min   = Number(this.evalWwaNode(node.value[1]));
      const max   = Number(this.evalWwaNode(node.value[2]));

      // 戻り値を return することでスクリプト上での式の値になる
      return Math.min(Math.max(value, min), max);
    }

    default:
      throw new Error("未定義の関数が指定されました: " + node.functionName);
  }
}
```

#### 実装時の重要ポイント

| ポイント | 説明 |
|---|---|
| **引数取得は必ず `this.evalWwaNode(node.value[N])` で** | 引数には変数 (`HP`) や式 (`AT + 10`) が来る場合があるため、評価を通さないと正しい値になりません |
| **`this._checkArgsLength(N, node)`** | 最低限必要な引数の数をチェックします。不足している場合は自動でエラーが出ます |
| **型変換は明示的に** | `evalWwaNode` の戻り値は `any` なので `Number()`, `String()`, `Boolean()` で型を合わせてください |
| **値を返す関数は `return`** | `HP = CLAMP(...)` のように代入に使われる関数は必ず値を返します |
| **副作用だけの関数は `return undefined`** | `MSG("...")` のようにゲームを操作するだけの関数は明示的に `return undefined` します |
| **エラーは `throw new Error()`** | 引数が不正な場合は `throw new Error("...")` で弾いてください。エラーメッセージはゲーム画面に表示されます |

---

### ステップ 3：動作確認

ビルドして開発サーバーを起動します。

```sh
# プロジェクトのルートから
npm run build
npm run start
```

ゲーム内のデバッグコンソール（もしくはパーツに `<script>` タグで記述）で動作を確認します。

```javascript
// デバッグコンソールや <script> タグ内で試す
v[0] = CLAMP(500, 0, 100);  // → 100 が v[0] に入るはず
MSG("v[0]=" + v[0]);
```

---

### ステップ 4：テストを書く（推奨）

純粋な計算ロジックは、ゲームエンジンから独立したファイルに切り出してテストを書くことができます。

#### ロジックを関数ファイルに切り出す

**新規ファイル**: `packages/engine/src/wwa_expression2/functions/clamp.ts`

```typescript
export function evalClampFunction(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
```

**`eval.ts` からインポートして使う:**

```typescript
// eval.ts の先頭のインポート部分に追加
import { evalClampFunction } from "./functions/clamp";

// evalAnyFunction の中
case "CLAMP": {
  this._checkArgsLength(3, node);
  const value = Number(this.evalWwaNode(node.value[0]));
  const min   = Number(this.evalWwaNode(node.value[1]));
  const max   = Number(this.evalWwaNode(node.value[2]));
  return evalClampFunction(value, min, max);
}
```

#### テストファイルを書く

**新規ファイル**: `packages/engine/src/wwa_expression2/__tests__/functions.ts`（既存ファイルに追記、または新規作成）

```typescript
import { evalClampFunction } from "../functions/clamp";

describe("CLAMP 関数", () => {
  it("値が範囲内ならそのまま返す", () => {
    expect(evalClampFunction(50, 0, 100)).toBe(50);
  });
  it("値が最小値より小さければ最小値を返す", () => {
    expect(evalClampFunction(-10, 0, 100)).toBe(0);
  });
  it("値が最大値より大きければ最大値を返す", () => {
    expect(evalClampFunction(200, 0, 100)).toBe(100);
  });
});
```

テストはパッケージディレクトリから実行します。

```sh
cd packages/engine
npm test
```

---

## パターン別：実装の参考例

### パターン A：計算して値を返す関数

`ABS`, `RAND`, `GET_UNIXTIME` などのパターンです。

```typescript
case "MY_FUNC": {
  this._checkArgsLength(1, node);
  const value = Number(this.evalWwaNode(node.value[0]));
  // 計算して値を返す
  return someCalculation(value);
}
```

### パターン B：ゲームエンジンを操作する関数（副作用のみ）

`JUMPGATE`, `SOUND`, `PARTS` などのパターンです。`this.generator.wwa` を通じてゲームの状態を変更します。

```typescript
case "MY_GAME_ACTION": {
  this._checkArgsLength(2, node);
  const x = Number(this.evalWwaNode(node.value[0]));
  const y = Number(this.evalWwaNode(node.value[1]));
  // ゲームエンジンのメソッドを呼び出す
  this.generator.wwa.someGameAction(x, y);
  return undefined;  // 副作用だけの関数は undefined を返す
}
```

### パターン C：ゲームの状態を読み取って返す関数

`HAS_ITEM`, `GET_GAMEOVER_POS_X`, `IS_PLAYER_WAITING_MESSAGE` などのパターンです。

```typescript
case "MY_QUERY": {
  // getGameStatus() でゲームの現在状態を取得できる
  const gameStatus = this.generator.wwa.getGameStatus();
  // 必要な値を取り出して返す
  return gameStatus.someProperty;
}
```

### パターン D：引数の一部がオプションの関数

`PARTS(ID1, ID2, TYPE, THIS_SIGHT)` の `TYPE`, `THIS_SIGHT` のように省略可能な引数のパターンです。

```typescript
case "MY_OPTIONAL_FUNC": {
  this._checkArgsLength(1, node);  // 必須引数の数だけチェック
  const required = Number(this.evalWwaNode(node.value[0]));
  // node.value[N] が undefined でないか確認してから評価する
  const optional = node.value[1] ? Number(this.evalWwaNode(node.value[1])) : 0;
  return doSomething(required, optional);
}
```

---

## 変更が必要なファイルの一覧（まとめ）

| ファイル | 変更内容 | 必須 |
|---|---|---|
| `wwa_expression2/converter.ts` | `convertCallExpression` の `switch` に関数名を追加 | ✅ |
| `wwa_expression2/eval.ts` | `evalAnyFunction` の `switch` に処理を実装 | ✅ |
| `wwa_expression2/functions/xxx.ts` | ロジックを切り出したい場合に新規作成 | 任意 |
| `wwa_expression2/__tests__/functions.ts` | 切り出したロジックのテストを追加 | 任意（推奨） |

---

## よくある実装ミス

### ❌ `node.value[N]` を直接使ってしまう

```typescript
// NG: 引数が変数や式だと正しい値にならない
case "MY_FUNC": {
  const value = node.value[0];  // これは WWANode オブジェクトそのもの
  return value + 1;             // 意図した動作にならない
}
```

```typescript
// OK: evalWwaNode を通すことで JavaScript の値になる
case "MY_FUNC": {
  const value = Number(this.evalWwaNode(node.value[0]));
  return value + 1;
}
```

### ❌ `converter.ts` の登録を忘れる

`eval.ts` だけに実装を追加しても、`converter.ts` の登録がなければ `CallDefinedFunction`（ユーザー定義関数の呼び出し）として処理されるため「未定義の関数が呼び出されました」エラーになります。

### ❌ 戻り値を返し忘れる

```typescript
// NG: return がないと代入式 (v[0] = MY_FUNC()) が undefined になる
case "MY_FUNC": {
  const result = someCalculation();
  // return を忘れた！
}
```

```typescript
// OK
case "MY_FUNC": {
  const result = someCalculation();
  return result;
}
```

---

## ゲームエンジンの主要な API

`this.generator.wwa` から呼び出せる主要メソッドの参考です。詳細は `packages/engine/src/wwa_main.ts` を参照してください。

| メソッド | 説明 |
|---|---|
| `this.generator.wwa.getGameStatus()` | HP・座標・アイテム等、ゲームの現在状態を取得 |
| `this.generator.wwa.getEnemyStatus()` | 現在戦闘中の敵ステータスを取得 |
| `this.generator.wwa.forcedJumpGate(x, y)` | 指定座標にプレイヤーをワープ |
| `this.generator.wwa.playSound(n)` | サウンドを再生 |
| `this.generator.wwa.replaceParts(src, dest, type, sight)` | マップ上のパーツを置換 |
| `this.generator.wwa.appearPartsEval(coord, x, y, id, type)` | 指定座標のパーツを変更 |
| `this.generator.wwa.handleMsgFunction({ message, additionalItems })` | メッセージウィンドウを表示 |
| `this.generator.wwa.getUserVar(index)` | ユーザー変数 `v[N]` の値を取得 |
| `this.generator.wwa.setUserVar(index, value, operator)` | ユーザー変数 `v[N]` に値をセット |
| `this.generator.wwa.getUserNameVar(key)` | 名前付きユーザー変数 `v["key"]` の値を取得 |
| `this.generator.loop_limit` | for 文の最大ループ回数 (デフォルト 100,000) |
