# Webpack から Vite への移行方針

## 概要

WWA Wing Engine パッケージのビルドシステムを webpack から Vite に移行するための方針書。

## 現状分析

### 現在の webpack 構成

#### ファイル構成
- `webpack.config.ts`: 開発用設定
- `webpack.config.prod.ts`: プロダクション用設定
- `tsconfig.webpack.json`: webpack 用の TypeScript 設定

#### 主な設定内容

**開発ビルド (`webpack.config.ts`)**:
- エントリーポイント: `./src/wwa_main.ts`
- 出力: `lib/wwa.long.js`
- ターゲット: `browserslist:last 2 versions or IE 11` (**注**: この設定は古く、現在は不要)
- TypeScript コンパイル: `ts-loader` + `tsconfig.webpack.json` (module: ESNext)
- 環境変数注入: `VERSION_WWAJS` (package.json の version を注入)
- ライセンスバナー: WWA Wing Engine と crypto-js のライセンス
- fallback 設定:
  - `crypto`: false (CryptoJS の Node.js crypto モジュール対応)
  - `fs`: false (WWA Loader の Node.js 実装対応)

**プロダクションビルド (`webpack.config.prod.ts`)**:
- 出力: `lib/wwa.js`
- 最小化: Terser Plugin
- ライセンスコメント保持: `@license`, `@preserve`
- `pathinfo: false` で最適化

### ビルドフロー

```
npm run build
  ↓
npm run clean (lib ディレクトリ削除)
  ↓
npm run build:prod (webpack でビルド)
  ↓
lib/wwa.js 生成
```

### 開発フロー

```
npm start
  ↓
run-p (並列実行)
  - build:dev (webpack -w で監視ビルド)
  - deploy:dev (assets, styles, HTML などをコピー)
  - server (開発サーバー起動)
```

## Vite 移行の利点

1. **ビルド速度の向上**
   - esbuild ベースの高速なビルド
   - HMR (Hot Module Replacement) の高速化
   - 開発時の起動速度が劇的に向上

2. **設定のシンプル化**
   - webpack より少ない設定で同等の機能を実現
   - TypeScript のネイティブサポート

3. **モダンなツールチェーン**
   - ES モジュールネイティブ対応
   - より良いデバッグ体験
   - Baseline Widely Available 対応による最適化されたコード生成

4. **将来性**
   - webpack よりも活発な開発コミュニティ
   - 最新の Web 技術への対応が早い

5. **レガシーブラウザサポートの廃止による恩恵**
   - IE 11 などの古いブラウザのための polyfill が不要
   - ファイルサイズの削減とパフォーマンス向上
   - モダンな JavaScript 機能を活用可能

## 移行方針

### Phase 1: 基本的な Vite 設定の作成

#### 1.1 依存関係の追加

```json
// package.json の devDependencies に追加
{
  "vite": "^6.0.0",
  "vite-plugin-banner": "^0.8.0"  // ライセンスバナー用
}
```

**削除する依存関係**:
- `webpack`
- `webpack-cli`
- `ts-loader`
- `terser-webpack-plugin`
- `@types/webpack`
- `@types/terser-webpack-plugin`

**注**: `@vitejs/plugin-legacy` は不要。Baseline Widely Available をターゲットとするため、レガシーブラウザサポートは含めません。

#### 1.2 Vite 設定ファイルの作成

`packages/engine/vite.config.ts` を作成:

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import banner from 'vite-plugin-banner';
import pkg from './package.json';

const cryptoJsLicenseComment = `crypto-js (c) Jeff Mott / Evan Vosberg / MIT License https://github.com/brix/crypto-js/blob/develop/LICENSE`;
const wwaWingEngineLicenseComment = `WWA Wing Engine (c) NAO / WWA Wing Team / MIT License https://github.com/WWAWing/WWAWing/blob/develop/packages/engine/LICENSE`;

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    // ライブラリモードでビルド
    build: {
      lib: {
        entry: resolve(__dirname, 'src/wwa_main.ts'),
        name: 'WWA',
        formats: ['iife'],
        fileName: () => isDev ? 'wwa.long.js' : 'wwa.js',
      },
      outDir: 'lib',
      emptyOutDir: false, // assets などが先にコピーされるため
      sourcemap: isDev,
      minify: isDev ? false : 'esbuild',
      target: 'es2020', // Baseline Widely Available (2020年頃の機能) に対応
      rollupOptions: {
        output: {
          // グローバル変数として公開しない (IIFE として自己実行)
          extend: false,
        },
      },
    },

    // TypeScript 設定
    resolve: {
      extensions: ['.ts', '.js'],
    },

    // 環境変数の定義
    define: {
      VERSION_WWAJS: JSON.stringify(pkg.version),
    },

    // プラグイン
    plugins: [
      // ライセンスバナーの追加
      banner({
        content: `@license ${wwaWingEngineLicenseComment}\n@license ${cryptoJsLicenseComment}`,
        outDir: './lib',
      }),
    ],

    // Node.js モジュールの polyfill 無効化
    resolve: {
      alias: {
        crypto: false,
        fs: false,
      },
    },
  };
});
```

**注意点**:
- Vite は `resolve.alias` で `false` を指定することで、webpack の `fallback` と同様の動作を実現
- `vite-plugin-banner` を使ってライセンスバナーを追加
- esbuild の minify は Terser より高速だが、ライセンスコメント保持のオプションが限定的なため、banner プラグインで対応
- `target: 'es2020'` により、Baseline Widely Available の機能を使用可能
  - Optional Chaining (`?.`)
  - Nullish Coalescing (`??`)
  - Dynamic Import
  - BigInt
  - Promise.allSettled など

#### 1.3 package.json のスクリプト更新

```json
{
  "scripts": {
    "test": "jest",
    "start": "run-p build:dev deploy:dev server",
    "build": "npm-run-all clean build:prod",
    "build:prod": "vite build --mode production",
    "build:dev": "vite build --mode development --watch",
    "deploy:prod": "shx mkdir -p lib && run-p deploy:common:* deploy:prod:*",
    "deploy:dev": "shx mkdir -p lib && run-p deploy:common:* deploy:dev:*",
    "deploy:common:audio": "shx cp -R ../../node_modules/@wwawing/assets/audio lib/",
    "deploy:common:images": "shx cp ../../node_modules/@wwawing/assets/images/*.* lib/",
    "deploy:common:mapdata": "shx cp ../../node_modules/@wwawing/assets/mapdata/*.* lib/",
    "deploy:common:defs": "shx cp ../../node_modules/@wwawing/assets/defs/*.* lib/",
    "deploy:common:style": "shx cp ../../node_modules/@wwawing/styles/output/*.* lib/ && shx cp ../../node_modules/@wwawing/assets/style/*.* lib/",
    "deploy:common:scripts": "shx mkdir -p lib/script && shx cp ../../node_modules/@wwawing/assets/script/*.* lib/script",
    "deploy:prod:html": "ts-node ./debug/make-debug-pages",
    "deploy:dev:html": "ts-node ./debug/make-debug-pages dev",
    "clean": "shx rm -rf lib",
    "server": "node ./launch-server lib"
  }
}
```

変更点:
- `build:prod`: `webpack --config webpack.config.prod.ts` → `vite build --mode production`
- `build:dev`: `webpack -w` → `vite build --mode development --watch`

### Phase 2: 検証とテスト

#### 2.1 ビルドの検証

1. **プロダクションビルドのテスト**
   ```bash
   npm run build
   ```
   - `lib/wwa.js` が正しく生成されるか確認
   - ファイルサイズが極端に変わっていないか確認
   - ライセンスバナーが正しく含まれているか確認

2. **開発ビルドのテスト**
   ```bash
   npm start
   ```
   - `lib/wwa.long.js` が正しく生成されるか確認
   - watch モードが正常に動作するか確認
   - ファイル変更時に自動再ビルドされるか確認

3. **実行テスト**
   - 開発サーバーでゲームが正常に動作するか確認
   - ブラウザのコンソールにエラーが出ていないか確認
   - すべての機能 (セーブ/ロード、マクロ、画像表示など) が正常に動作するか確認

#### 2.2 Jest との統合確認

- Vite への移行は Jest の設定に影響しないはず (SWC を使用しているため)
- 念のため `npm test` でテストが通ることを確認

#### 2.3 ブラウザターゲットの最適化

**方針**: Baseline Widely Available をターゲットとする

Baseline Widely Available は、主要なブラウザで安定してサポートされている機能セットを指します（おおよそ 2020 年以降の機能）。

**利用可能な ES2020+ の機能**:
- **Optional Chaining** (`?.`): オブジェクトのプロパティに安全にアクセス
- **Nullish Coalescing** (`??`): null/undefined のみをフォールバック
- **Dynamic Import**: コードスプリッティングとオンデマンドロード
- **BigInt**: 任意精度の整数演算
- **Promise.allSettled**: すべての Promise の結果を待機
- **globalThis**: 環境に依存しないグローバルオブジェクト

**対応ブラウザ** (CLAUDE.md に記載のサポートブラウザ):
- 最新版の Firefox
- 最新版の Chrome/Chromium (Edge を含む)
- 最新版の Safari (デスクトップ)
- Android の最新版 Chrome
- iOS の最新版 Safari

これらのブラウザはすべて ES2020 の機能をサポートしています。

**メリット**:
1. **ファイルサイズの削減**: レガシーブラウザ向けの polyfill や変換が不要
2. **パフォーマンス向上**: ネイティブのモダン JavaScript 機能を活用
3. **メンテナンスコストの削減**: 古いブラウザの特殊ケースを考慮不要
4. **開発体験の向上**: モダンな構文を直接使用可能

**Vite 設定**: `target: 'es2020'` を使用することで、Baseline Widely Available に対応

### Phase 3: クリーンアップ

#### 3.1 不要ファイルの削除

- `webpack.config.ts`
- `webpack.config.prod.ts`
- `tsconfig.webpack.json` (不要になった場合)

#### 3.2 tsconfig の見直し

`tsconfig.webpack.json` が他の用途で使われていないか確認:
- webpack 専用の設定 (`module: "ESNext"`) だった場合は削除
- Vite は自動的に適切な module 解決を行うため、通常の `tsconfig.json` で十分

### Phase 4: ドキュメント更新

#### 4.1 CLAUDE.md の更新

ビルドシステムのセクションを更新:

```markdown
### ビルドシステム

- **TypeScript**: ターゲット ES2020 (Baseline Widely Available)、CommonJS モジュールでコンパイル
- **Vite**: engine パッケージのバンドルに使用 (esbuild ベース、ES2020 ターゲット)
- **lerna-lite**: パッケージ間の操作を統括
- **ts-node with SWC**: ビルドスクリプトの高速な TypeScript 実行
- **Jest with SWC**: engine パッケージのテストフレームワーク
```

#### 4.2 README の更新 (必要に応じて)

パッケージの README にビルドシステム変更の情報を追加

## 移行時の注意点

### 1. 環境変数の注入

- webpack: `DefinePlugin` で `VERSION_WWAJS` を注入
- Vite: `define` オプションで同様に注入可能
- 既存コードの変更は不要

### 2. モジュール解決

- webpack: `fallback` で Node.js モジュールを無効化
- Vite: `resolve.alias` で同様に無効化可能
- CryptoJS と WWA Loader の動作に影響なし

### 3. ライセンスバナー

- webpack: `BannerPlugin` を使用
- Vite: `vite-plugin-banner` を使用
- 出力形式は同一

### 4. 開発サーバー

- 現在は独自の HTTP サーバー (`debug-server`) を使用
- Vite の dev server は使用せず、引き続き `launch-server` を使用
- Vite は watch ビルドのみを担当

### 5. Monorepo 環境

- `file:` プロトコルでの依存関係は Vite でも正常に動作
- パッケージ間の依存関係に変更は不要

## 移行スケジュール案

### Step 1: 準備 (0.5日)
- [ ] 依存関係のインストール
- [ ] Vite 設定ファイルの作成
- [ ] package.json の更新

### Step 2: 開発環境での検証 (1日)
- [ ] 開発ビルドのテスト
- [ ] watch モードの動作確認
- [ ] 開発サーバーでの動作確認
- [ ] デバッグ体験の確認

### Step 3: プロダクションビルドの検証 (0.5日)
- [ ] プロダクションビルドのテスト
- [ ] ファイルサイズの比較
- [ ] ライセンスバナーの確認
- [ ] ブラウザでの実行テスト

### Step 4: 統合テスト (0.5日)
- [ ] Jest テストの実行
- [ ] すべての機能の動作確認
- [ ] 複数ブラウザでのテスト

### Step 5: クリーンアップとドキュメント更新 (0.5日)
- [ ] webpack 関連ファイルの削除
- [ ] ドキュメントの更新
- [ ] commit とブランチ作成

**合計**: 約 3 日

## リスク管理

### 高リスク項目

1. **CryptoJS の動作**
   - リスク: Node.js モジュールの解決が変わることで動作しない可能性
   - 対策: 早期に動作確認を実施

2. **外部スクリプトのロード**
   - リスク: `load_script_file` モジュールが期待通りに動作しない可能性
   - 対策: 実際のマップデータでテスト

### 中リスク項目

1. **ファイルサイズの増加**
   - リスク: esbuild の minify が Terser より最適化が弱い可能性
   - 対策: ファイルサイズを比較し、許容範囲を超える場合は調整

2. **デバッグ体験の変化**
   - リスク: source map の形式が変わることで、デバッグがしにくくなる可能性
   - 対策: 開発ビルドでの動作を十分に確認

### 低リスク項目

1. **CI/CD への影響**
   - リスク: ビルドコマンドが変わることで CI が失敗する可能性
   - 対策: package.json のスクリプト名は維持しているため、影響は最小限

## ロールバック計画

万が一、Vite への移行で問題が発生した場合:

1. **ブランチ戦略**
   - フィーチャーブランチで作業
   - `develop` ブランチにマージする前に十分なテストを実施

2. **元の webpack 設定の保持**
   - 削除する前に、設定ファイルのバックアップを作成
   - または、別のブランチで保持

3. **段階的なロールバック**
   - package.json のスクリプトを戻すだけで webpack に戻せるようにする
   - 依存関係は一時的に両方を残すことも検討

## まとめ

Webpack から Vite への移行は、以下の理由から推奨されます:

1. **ビルド速度の大幅な向上** - 開発体験が改善
2. **設定のシンプル化** - メンテナンスが容易に
3. **将来性** - モダンなツールチェーンへの移行
4. **Baseline Widely Available 対応** - モダンブラウザ向けに最適化されたコード生成

移行は比較的リスクが低く、3 日程度で完了できる見込みです。段階的なアプローチとテストを十分に行うことで、安全に移行できます。

**注**: レガシーブラウザ（IE 11 など）のサポートは廃止され、Baseline Widely Available（ES2020 相当）をターゲットとします。これにより、ファイルサイズの削減とパフォーマンス向上が期待できます。

## 参考資料

- [Vite 公式ドキュメント](https://vitejs.dev/)
- [Vite ライブラリモードガイド](https://vitejs.dev/guide/build.html#library-mode)
- [vite-plugin-banner](https://github.com/chengpeiquan/vite-plugin-banner)
- [Baseline Widely Available](https://web.dev/baseline/)
- [ES2020 Features](https://www.proposals.es/proposals/Finished)
