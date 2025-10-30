import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// 本 vite.config.ts は @wwawing/loader をブラウザから読み込んで動作確認するためのものです。
// src/___debug-resources___ 以下のデバッグ用リソースをビルドします。
// @wwawing/engine のビルドには関係ありませんのでご注意ください。

export default defineConfig({
  root: 'src/___debug-resources___',

  build: {
    outDir: resolve(__dirname, 'debug/browser'),
    emptyOutDir: true,
    target: 'es2020', // Baseline Widely Available
    rollupOptions: {
      input: resolve(__dirname, 'src/___debug-resources___/index.html'),
    },
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // monorepo 内の依存パッケージのソースを直接参照して HMR を有効化
      '@wwawing/event-emitter': resolve(__dirname, '../event-emitter/src/index.ts'),
      '@wwawing/common-interface': resolve(__dirname, '../common-interface/src/index.ts'),
    },
  },

  server: {
    open: true,
  },
});
