import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    dts: {
      tsgo: true,
    },
    exports: true,
    // ...config options
    format: ['esm', 'cjs'],
    target: 'es2020',
  },
  {
    // iife 供浏览器 <script> 直接引入：必须指定全局变量名，且要内联 alien-signals
    //（它只提供 ESM/CJS，没有 UMD/IIFE 产物，无法作为外部全局变量使用）。
    // 单独一份配置，保证 esm/cjs 仍是外部依赖，避免使用方自己安装的 alien-signals 被复制成两份运行时。
    format: 'iife',
    minify: true,
    globalName: 'byou',
    deps: { alwaysBundle: ['alien-signals'] },
    target: 'es2020',
  },
])
