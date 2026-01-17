# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

WWA Wing は、インターネット RPG 「World Wide Adventure」の TypeScript / JavaScript 実装です。このリポジトリは lerna-lite で管理される monorepo であり、`packages/` ディレクトリ下に複数の npm パッケージが含まれています。

## 必要な環境

- Node.js 24系
- npm 11系
- Git LFS (wwa-server の生成時のみ必要)
  - 開発前に一度 `git lfs install` を実行する必要があります

## 基本的なコマンド

### 初期セットアップ
```sh
git lfs pull
npm install
npm run build
```

### 開発コマンド
```sh
# すべてのパッケージをビルド
npm run build

# engine の開発サーバーを起動 (変更を監視してローカルでサーブ)
npm run start

# テストを実行 (engine と serve-index パッケージ)
npm run test

# すべてのビルド成果物をクリーン
npm run clean
```

### パッケージ別コマンド

**Engine パッケージ** (`packages/engine`):
```sh
# テストを実行
npm run test

# 開発サーバーを起動 (watch モード)
npm run start

# プロダクションビルド
npm run build

# 開発ビルド (watch モード)
npm run build:dev

# プロダクションファイルのデプロイ
npm run deploy:prod
```

**Loader パッケージ** (`packages/loader`):
```sh
# CommonJS と ES モジュール両方をビルド
npm run build

# ブラウザデモを起動
npm run start
```

**Styles パッケージ** (`packages/styles`):
```sh
# SCSS を CSS にコンパイル
npm run build
```

### テストの実行

ルートディレクトリから特定のパッケージのテストを実行:
```sh
npm test -- --scope @wwawing/engine
```

または、パッケージディレクトリに移動して `npm test` を実行。

## Monorepo アーキテクチャ

### 主要パッケージ

- **`engine`**: WWA Wing のコアゲームエンジン。メインのソースコードは `packages/engine/src/` にあり、エントリーポイントは `wwa_main.ts` です。
- **`loader`**: WWALoader - WWA のマップデータ (`.dat` ファイル) を WWA Wing のデータ構造に変換します。
- **`common-interface`**: パッケージ間で共有される TypeScript のインターフェースとデータ構造の定義。
- **`page-generator`**: Pug テンプレートを使用して WWA ゲーム用の HTML ファイルを生成します。
- **`assets`**: 開発時や配布物の生成時に使用する静的ファイル (画像、音声、マップデータ、スクリプト)。
- **`styles`**: CSS にコンパイルされる SCSS スタイルシート。
- **`debug-server`**: WWA 作者向けの HTTP サーバー (wwa-server)。
- **`event-emitter`**: Node.js とブラウザの両方で動作する EventEmitter ライブラリ。
- **`virtual-pad`**: モバイルデバイス用の仮想ゲームパッド。
- **`serve-index`**: ディレクトリリスティングミドルウェア。
- **`util`**: 共有ユーティリティ関数。
- **`all`**: すべての WWA Wing アセットを含む配布パッケージ。

### パッケージ間の依存関係

パッケージは `file:` プロトコルを使用して兄弟パッケージを参照します。主な依存関係:
- `engine` の依存先: `common-interface`, `loader`, `event-emitter`, `assets`, `styles`, `page-generator`, `debug-server`, `virtual-pad`, `util`
- `loader` の依存先: `common-interface`, `event-emitter`
- ほとんどのパッケージが共有型のために `common-interface` に依存

### ビルドシステム

- **TypeScript**: ターゲット ES2018、CommonJS モジュールでコンパイル
- **Webpack**: engine パッケージのバンドルに使用
- **lerna-lite**: パッケージ間の操作を統括
- **ts-node with SWC**: ビルドスクリプトの高速な TypeScript 実行
- **Jest with SWC**: engine パッケージのテストフレームワーク

## ブランチ戦略

- **`v4`**: 最新の開発ブランチ (PR のデフォルトターゲット)
- **`v3`**: 現在の安定版リリース
- **フィーチャーブランチ**: `v4` から作成し、`v4` にマージ

**コントリビューター向け**: リポジトリをフォークし、`v4` ブランチに向けて PR を作成してください。

## コードアーキテクチャ

### Engine のコア構造

メインエンジン (`packages/engine/src/`) は機能別モジュールで構成されています:

- **`wwa_main.ts`**: メインゲームループ、状態管理、コアエンジンロジック (~350KB、最大のファイル)
- **`wwa_data.ts`**: ゲームデータ構造、定数、enum、インターフェース
- **`wwa_cgmanager.ts`**: グラフィックレンダリングとキャンバス管理
- **`wwa_parts_player.ts`**: プレイヤーキャラクターのロジック
- **`wwa_macro.ts`**: マクロコマンドの解析と実行
- **`wwa_input.ts`**: キーボード、マウス、ゲームパッド入力の処理
- **`wwa_window.ts`**: メッセージウィンドウ、モンスター情報、スコア表示
- **`wwa_message/`**: メッセージ解析とレンダリングシステム
- **`wwa_save/`**: ゲーム状態の保存/ロード
- **`wwa_camera.ts`**: カメラ位置制御
- **`wwa_sound.ts`**: オーディオ再生
- **`wwa_monster.ts`**: モンスターエンティティ
- **`wwa_motion.ts`**: オブジェクトアニメーションと移動
- **`wwa_expression/` と `wwa_expression2/`**: 式評価システム
- **`wwa_picture/`**: 画像表示機能 (開発中)
- **`load_script_file/`**: スクリプトローディングユーティリティ

### WWA のデータフロー

1. **マップ読み込み**: `.dat` ファイル → `loader` パッケージ → 構造化されたゲームデータ
2. **エンジン初期化**: パース済みデータ → `wwa_main.ts` がゲーム状態を初期化
3. **ゲームループ**: 入力 → 状態更新 → レンダリング → 表示
4. **マクロシステム**: ゲームイベントがマクロをトリガー → `wwa_macro.ts` がコマンドを実行

### テストのパターン

テストはパッケージ内の `__tests__/` ディレクトリに配置されます。engine は Jest と jsdom を使用してブラウザ環境をシミュレートします。

## バージョニング

### 安定版
形式: `X.Y.Z`
- `Z` (パッチ): 軽微なバグ修正
- `Y` (マイナー): 新機能追加
- `X` (メジャー): 破壊的変更や大規模な UX 更新

### 不安定版
形式: `X.Y.Z-unstable.based-on.A.B.C` または `X.Y.Z-unstable.based-on.A.B.C.p.n`
- `X.Y.Z`: リリース予定のバージョン
- `A.B.C`: ベースとなる安定版バージョン
- `p.n`: プレリリースの増分番号

## 重要な注意事項

### サポートブラウザ
- **デスクトップ**: 最新版の Firefox、Chrome/Chromium (Edge を含む)、Safari
- **モバイル**: Android の最新版 Chrome、iOS の最新版 Safari

### Git LFS
通常の開発には Git LFS は不要ですが、wwa-server の生成には必要です。マップデータと大きなアセットは LFS に保存されています。

### 開発ワークフロー
1. `packages/engine/src/` や他のパッケージで変更を行う
2. ルートから `npm run build` を実行してすべてのパッケージをビルド
3. `npm start` を実行して開発サーバーを起動しテスト
4. `__tests__/` ディレクトリにテストを作成
5. コミット前に `npm test` を実行

### Monorepo の考慮事項
- `common-interface` への変更は複数のパッケージに影響します
- 適切な依存関係解決のため、常にルートからビルドしてください
- すべてのパッケージでスクリプトを実行するには `lerna run <command>` を使用します
