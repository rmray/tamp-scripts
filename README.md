# Tampermonkey 脚本管理

这是一套经过深思熟虑、结合了 **Monorepo (Lerna)**、**独立版本控制**、**Rollup 打包** 以及 **壳/核分离安全架构** 的完整油猴脚本管理方案。

我们将构建一个名为 `tamp-scripts` 的项目。

## 项目目录结构

~~项目目录结构概览~~:

首先，明确我们的目标结构。我们将代码分为 `packages/utils` (公共库) 和 `packages/scripts/*` (具体业务脚本)。

```text
tamp-scripts/
├── package.json              # 根依赖与 Workspaces 配置
├── lerna.json                # Lerna 独立版本控制配置
├── rollup.config.js          # 统一构建配置
├── .gitignore                # Git 忽略配置 (关键安全防线)
└── packages/
    ├── utils/                # [公共工具库]
    │   ├── package.json      # name: @my/utils
    │   └── index.js
    └── scripts/              # [业务脚本集合]
        ├── google/           # [Google 脚本]
        │   ├── package.json  # name: @my/google-script
        │   ├── index.js      # 核心逻辑 (Core)
        │   ├── shell.js      # [本地] 真实外壳 (含 Key，被 Git 忽略)
        │   ├── shell.template.js # [远程] 模板外壳 (无 Key，提交 Git)
        │   └── dist/         # [产物] 包含 bundle.js (提交 Git)
        └── bilibili/         # [Bilibili 脚本]
            ├── ...           # 结构同上
```

## 环境初始化

### 初始化项目与安装依赖

~~初始化项目与安装依赖~~:

在终端中执行：

```bash
mkdir tamp-scripst && cd tamp-scripts
pnpm init
pnpm install lerna rollup @rollup/plugin-node-resolve rimraf -D
pnpm exec lerna init
```

### 配置 repomono 工作区

1. ==注意：pnpm 只支持独立的 `pnpm-workspace.yaml` 配置==：

   如果使用 pnpm 作为包管理工具，必须创建独立的 `pnpm-workspace.yaml` 文件来定义工作区，它**不支持**像 npm 或 Yarn 那样通过 `package.json` 中的 `"workspaces"` 字段来配置。pnpm 会直接忽略 `package.json` 中的 `"workspaces"` 字段。

   ```yaml
   packages:
     - 'packages/*'
     - 'packages/scripts/*'
   ```

2. ==最佳实践：配置共存==

   该方案可以同时兼容 pnpm 和 npm，可以做到**无缝切换**。

   你可以在根目录下同时保留两份配置。它们互不冲突，不同的包管理器会读取各自对应的文件：

   - **`package.json`**：加入 `workspaces` 字段（给 `npm` 或 `yarn` 看）。
   - **`pnpm-workspace.yaml`**：保持现状（给 `pnpm` 看）。

   ```yaml {5}
   // package.json
   {
     "name": "my-monorepo",
     "private": true,
     "workspaces": [ "packages/*", "packages/scripts/*" ]
   }
   ```

   ```yaml
   // pnpm-workspace.yaml
   packages:
     - 'packages/*'
     - 'packages/scripts/*'
   ```

### 配置根目录 `package.json`

~~配置根目录 `package.json`~~:

```json {9}
{
  "name": "tamp-scripts",
  "private": true,
  "workspaces": ["packages/*", "packages/scripts/*"],
  "scripts": {
    "clean": "rimraf --glob packages/**/dist",
    "build": "rollup -c",
    "watch": "rollup -c -w",
    "release": "npm run build && git add . && git commit -m 'chore: update builds' && lerna version --conventional-commits --yes && git push --follow-tags"
  },
  "devDependencies": {
    "lerna": "^8.0.0",
    "rollup": "^4.0.0",
    "@rollup/plugin-node-resolve": "^15.0.0",
    "rimraf": "^5.0.0"
  }
}
```

- `lerna version --conventional-commits --yes`：让 Lerna 根据你的**Git 提交记录（Commit Message）** 来自动决定版本号怎么升，并且过程中不需要人工确认。

  - `lerna version`：lerna **基本命令**。它的工作流程是：

    1. **检测变化**：检查自上次发布以来，哪些 `packages` 下的代码发生了变动。
    2. **更新版本**：修改 `package.json` 中的 `version` 字段。
    3. **Git 操作**：创建一个包含所有变化的 Git Commit，并打上对应的 Git Tag（例如 `v1.0.1`）。
    4. **推送**：将代码和 Tag 推送到远程仓库（GitHub）。

  - `--conventional-commits`：告诉 Lerna：“不要问我要升大版本还是小版本，去读我的 Git 提交记录，你自己判断。”

    它遵循 **[Conventional Commits 规范](https://www.conventionalcommits.org/)**。Lerna 会分析你两次发布之间的 Commit Message：

    - **如果你提交了 `fix: 修复了一个bug`**

      - Lerna 判定为 **Patch** 更新 (补丁)。
      - 版本号变化：`1.0.0` -> **`1.0.1`**

    - **如果你提交了 `feat: 增加了一个新功能`**

      - Lerna 判定为 **Minor** 更新 (次版本)。
      - 版本号变化：`1.0.0` -> **`1.1.0`**

    - **如果你提交了 `feat!: 重构代码，接口不兼容`** (注意那个感叹号或写了 `BREAKING CHANGE`)

      - Lerna 判定为 **Major** 更新 (主版本)。
      - 版本号变化：`1.0.0` -> **`2.0.0`**

    - **其他类型** (`chore:`, `docs:`, `style:`)

      - 通常不会触发版本升级，或者只触发 Patch（取决于配置）。

    - **额外福利**：

      使用这个参数后，Lerna 还会自动为每个 Package 生成/更新 **`CHANGELOG.md`** 文件，把你的 Commit 记录整理成漂亮的更新日志。

  - `--yes`：**免打扰模式**：

    - **不加 `--yes`**：Lerna 算好版本号后，会暂停并问你：“我准备把 google 脚本从 1.0.0 升到 1.0.1，你确定吗？(y/N)”
    - **加上 `--yes`**：Lerna 默认你已经同意，**跳过所有确认步骤**，直接修改文件、提交、打标签、推送。

- `git push --follow-tags`：把我的提交（Commits）推送到远程，**同时把跟这些提交相关的、有注释的标签（Tags）也顺便推上去**。

==问题==：**rimraf 在 Windows 上不支持 glob 通配符**

rimraf v6 默认不启用 glob 模式，需要加 `--glob` 参数：

```yaml /--glob/
{
  "scripts": {
    "clean": "rimraf --glob packages/**/dist",
  },
}
```

### 配置 `lerna.json`

~~配置 `lerna.json`~~:

启用独立版本模式 (`independent`)。

```json
{
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "version": {
      "message": "chore(release): publish %s",
      "allowBranch": "main"
    }
  }
}
```

## 配置安全性 (.gitignore)

~~配置安全性 (.gitignore)~~:

这是最重要的一步，确保你的敏感 Key 不会被上传。

**`.gitignore` 内容：**

```gitignore
node_modules/
.DS_Store
.env

# 忽略所有包中的 shell.js (含有敏感 Key)
**/shell.js
**/shell.ts

# 注意：不要忽略 dist/，因为我们需要上传构建产物给 jsDelivr 使用
# dist/
```

## 编写 Rollup 配置

~~编写 Rollup 配置~~:

创建一个能动态打包所有脚本的 `rollup.config.js`。它会将 `utils` 打包进每个脚本的 Core 中。

**`rollup.config.js` 内容：**

```javascript
import fs from 'fs'
import path from 'path'
import resolve from '@rollup/plugin-node-resolve'

const SCRIPTS_DIR = path.resolve(__dirname, 'packages/scripts')

// 扫描 packages/scripts 下的所有子文件夹
const scriptPackages = fs.readdirSync(SCRIPTS_DIR).filter((dir) => {
  return fs.statSync(path.join(SCRIPTS_DIR, dir)).isDirectory()
})

export default scriptPackages.map((pkgName) => {
  const packageDir = path.join(SCRIPTS_DIR, pkgName)

  // 生成全局变量名，例如 google -> MyScript_Google
  const globalName = `MyScript_${pkgName.charAt(0).toUpperCase() + pkgName.slice(1)}`

  return {
    input: path.join(packageDir, 'index.js'),
    output: {
      // 产物输出到各子包的 dist 目录
      file: path.join(packageDir, 'dist/bundle.js'),
      format: 'iife', // 立即执行函数
      name: globalName,
      extend: true,
      sourcemap: false
    },
    plugins: [
      // 关键：将 @my/utils 等依赖解析并打包进 bundle.js
      resolve()
    ]
  }
})
```

## 编写代码实现

### 公共库 (packages/utils)

~~公共库 (packages/utils)~~:

- `packages/utils/package.json`:

  ```json
  { "name": "@my/utils", "version": "1.0.0", "main": "index.js" }
  ```

- `packages/utils/index.js`:

  ```javascript
  export function log(msg) {
    console.log(`[MyUtils] ${msg}`)
  }
  ```

### 业务脚本核心 (packages/scripts/google)

~~业务脚本核心 (packages/scripts/google)~~:

- `packages/scripts/google/package.json`:

  ```json
  {
    "name": "@my/google-script",
    "version": "1.0.0",
    "dependencies": { "@my/utils": "*" }
  }
  ```

- `packages/scripts/google/index.js` (核心逻辑):

  ```javascript
  import { log } from '@my/utils'
  
  // 导出一个启动函数，接收配置
  export function start(config) {
    log('Google 脚本核心已加载')
    if (config.secretKey) {
      log(`使用密钥: ${config.secretKey} 运行中...`)
      // 业务逻辑...
    } else {
      console.error('未检测到密钥')
    }
  }
  ```

### 业务脚本外壳 (Shell)

~~业务脚本外壳 (Shell)~~:

在 `packages/scripts/google/` 下创建两个文件：

**文件 A: `shell.template.js` (提交到 Git)**

_这是给别人或者未来的自己看的模板。_

```javascript
// ==UserScript==
// @name         Google 助手 (Shell)
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  外壳脚本
// @author       You
// @match        https://www.google.com/*
//
// 引用 CDN 核心 (注意：这里的版本号 1.0.0 需要随发布更新)
// @require      https://cdn.jsdelivr.net/gh/你的GitHub名/仓库名@my/google-script@1.0.0/packages/scripts/google/dist/bundle.js
//
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

;(function () {
  'use strict'

  // 模板配置（留空）
  const CONFIG = {
    secretKey: '',
    userId: ''
  }

  if (window.MyScript_Google) {
    window.MyScript_Google.start(CONFIG)
  }
})()
```

**文件 B: `shell.js` (本地新建，被 Git 忽略)**

_这是你安装到浏览器的真实文件。_

```javascript
// ... 头部元数据同上 ...
;(function () {
  'use strict'

  // 真实配置
  const CONFIG = {
    secretKey: 'sk-real-secret-key-123456',
    userId: 'admin'
  }

  if (window.MyScript_Google) {
    window.MyScript_Google.start(CONFIG)
  }
})()
```

## 工作流操作指南

### 开发阶段 (Hot Reload)

~~开发阶段 (Hot Reload)~~:

1. 修改 `shell.js` 的 `@require` 为本地路径：

   `// @require file://你的本地路径/packages/scripts/google/dist/bundle.js`

2. 启动监听：

   ```bash
   npm run watch

   ```

3. 修改 `index.js` 或 `utils` 代码，Rollup 会自动重新打包，浏览器刷新即生效。

### 发布阶段 (Release)

~~发布阶段 (Release)~~:

假设你修改了 Google 脚本的代码。

1. **构建产物**：

   ```bash
   npm run build
   
   ```

_(此时 packages/scripts/google/dist/bundle.js 更新了)_

2. **Lerna 发版**：

   ```bash
   npx lerna version
   
   ```

   - Lerna 会检测到 `@my/google-script` 变了。
   - 选择版本号（例如从 1.0.0 -> 1.0.1）。
   - Lerna 会自动打 Git Tag: `@my/google-script@1.0.1`。
   - Lerna 会推送代码和 Tags 到 GitHub。

### 使用阶段 (Update Shell)

~~使用阶段 (Update Shell)~~:

1. GitHub 收到 Tag 后，jsDelivr 会自动生效。

2. 你需要**手动**（或写脚本辅助）更新你本地 Tampermonkey 里 `shell.js` 的 `@require` 链接：

   `.../gh/User/Repo@my/google-script@1.0.1/...`

3. 保存脚本，刷新网页，新功能即生效。Bilibili 的脚本因为没有发版，依然使用旧版本，互不干扰。
