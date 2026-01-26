import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],

  // 'cjs' -> CommonJS (Node 默认)
  // 'esm' -> ES Module (现代标准)
  // 如果是普通 Node 应用，只留 'cjs' 也行；如果是写库，建议两个都保留
  format: ['esm'],

  // 输出目录
  outDir: 'dist',

  // 每次打包前清空目录
  clean: true,

  // 生成 sourcemap 方便生产环境报错定位
  sourcemap: true,

  // ⚠️ 关键设置：
  // true: 把所有依赖打包进一个文件 (适合 Serverless/Docker 极简部署)
  // false: 不打包 node_modules，保留 require/import (适合常规 Node 应用)
  // 建议常规 Node 应用设为 false
  noExternal: [],

  // 是否生成 .d.ts 类型声明文件？
  // 写库要设为 true，写业务应用设为 false (省时间)
  dts: false,

  // 压缩代码 (生产环境可以开)
  minify: false,
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
})