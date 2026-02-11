const fs = require('node:fs')
const path = require('node:path')
const resolve = require('@rollup/plugin-node-resolve')

const SCRIPTS_DIR = path.resolve(__dirname, 'packages/scripts')

// 1. 扫描 packages/scripts 目录下的所有子目录
const scriptPackages = fs.readdirSync(SCRIPTS_DIR).filter((dir) => {
  return fs.statSync(path.resolve(SCRIPTS_DIR, dir)).isDirectory()
})

// 2. 为每个子目录生成一个 Rollup 配置项
module.exports = scriptPackages.map((pkgName) => {
  const fullPkgDir = path.resolve(SCRIPTS_DIR, pkgName)

  // a. 生成全局变量名，例如：sehuatang-thread-list => MrSehuatangThreadList
  const globalName = 'Mr' + pkgName.split('-').map((item) => item.charAt(0).toUpperCase() + item.slice(1)).join('')

  // b. 生成 Rollup 配置
  return {
    input: path.resolve(fullPkgDir, 'index.js'), // 入口文件
    output: {
      file: path.resolve(fullPkgDir, 'dist/bundle.js'), // 输出文件
      format: 'iife', // 输出格式
      name: globalName, // 全局变量名
      extend: true, // 如果全局变量已存在，则扩展它而不是覆盖
      sourcemap: false // 生成 source map
    },
    plugins: [
      resolve() // 解析 node_modules 中的依赖
    ]
  }
})
