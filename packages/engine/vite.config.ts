import { defineConfig } from 'vite';
import { resolve } from 'node:path';
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
      target: 'es2020',
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
  };
});
