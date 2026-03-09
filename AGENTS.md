# Tampermonkey 脚本管理项目

## 项目概述

这是一个 **Tampermonkey (油猴) 脚本的 Monorepo 管理项目**，采用 **pnpm + Lerna + Rollup** 技术栈，实现了**壳/核分离安全架构**。

### 核心特性

- **Monorepo 架构**：统一管理多个油猴脚本
- **独立版本控制**：每个脚本包独立发版
- **壳/核分离**：核心逻辑 (Core) 与敏感配置 (Shell) 分离，防止密钥泄露
- **CDN 分发**：构建产物通过 jsDelivr CDN 分发

### 目录结构

```
tamp-scripts/
├── package.json              # 根依赖与 Workspaces 配置
├── lerna.json                # Lerna 独立版本控制配置
├── pnpm-workspace.yaml       # pnpm 工作区配置
├── rollup.config.cjs         # 统一构建配置
└── packages/
    ├── utils/                # 公共工具库 (tm-utils)
    │   ├── index.js          # 统一导出
    │   └── modules/
    │       ├── api.js        # 云端数据 API 封装
    │       ├── cache.js      # 缓存工具
    │       ├── dom.js        # DOM 操作工具
    │       ├── general.js    # 通用工具 (Toast, URL 解析等)
    │       ├── gm.js         # GM_* API 封装
    │       └── sehuatang.js  # 色花堂专用工具
    └── scripts/              # 业务脚本集合
        ├── gemini/           # Gemini 脚本
        ├── hentai/           # Hentai 脚本
        ├── one/              # One 脚本
        ├── sehuatang/        # 色花堂脚本
        ├── sehuatang-detail/ # 色花堂详情脚本
        ├── sehuatang-list/   # 色花堂列表脚本
        ├── sehuatang-search/ # 色花堂搜索脚本
        └── twkan/            # 台湾看脚本
```

## 构建与运行

### 环境要求

- Node.js >= 16
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm run build` | 清理并构建所有脚本 (输出到各包的 `dist/bundle.js`) |
| `pnpm run watch` | 监听模式，文件变化自动重新构建 |
| `pnpm run clean` | 清理所有 `dist/` 目录 |
| `pnpm run release` | Lerna 发版 (自动更新版本号、CHANGELOG、打 Tag 并推送) |

### 发布流程

1. **构建产物**：`pnpm run build`
2. **Git 提交**：按模块分别提交
   ```bash
   git add <改动文件>
   git commit -m "<提交说明>"
   ```
3. **Lerna 发版**：`pnpm run release`
   - 自动根据 Conventional Commits 规范升级版本号
   - 自动生成/更新 CHANGELOG.md
   - 自动打 Tag 并推送到远程

### 开发流程 (Hot Reload)

1. 修改 `shell.js` 的 `@require` 为本地路径：
   ```javascript
   // @require file://本地路径/packages/scripts/xxx/dist/bundle.js
   ```
2. 启动监听：`pnpm run watch`
3. 修改代码后自动构建，浏览器刷新即生效

## 开发规范

### 包命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 公共库 | `tm-utils` | - |
| 脚本包 | `tm-<name>` | `tm-sehuatang`, `tm-gemini` |

### 代码组织

#### 公共库 (tm-utils)

```javascript
// 导入方式
import { api, showToast, gmFetch } from 'tm-utils'

// 模块说明
// - general.js: 通用工具 (Toast、URL解析、中文章节号转换)
// - dom.js: DOM 操作 (createElement)
// - cache.js: 缓存工具
// - gm.js: GM_* API 封装 (gmFetch, gmGetValue, gmSetValue)
// - api.js: 云端数据 API (initConfig, getCloudData, setCloudData)
// - sehuatang.js: 色花堂专用工具
```

#### 脚本包结构

```
packages/scripts/<name>/
├── index.js      # 核心逻辑 (Core) - 导出 main(config) 函数
├── package.json  # 包配置
├── CHANGELOG.md  # 更新日志 (Lerna 自动生成)
└── dist/
    └── bundle.js # 构建产物 (IIFE 格式)
```

### 脚本开发模式

```javascript
// index.js - 核心逻辑
import { api, showToast } from 'tm-utils'

export async function main(config = {}) {
  // 1. 初始化配置
  if (!config.BASE_API_URL) throw new Error('缺少配置项: BASE_API_URL')
  api.initConfig({ baseUrl: config.BASE_API_URL })

  // 2. 业务逻辑...
}
```

```javascript
// shell.js - 外壳脚本 (本地文件，被 Git 忽略)
// ==UserScript==
// @name         XXX 助手
// @require      https://cdn.jsdelivr.net/gh/user/repo@tm-xxx@1.0.0/packages/scripts/xxx/dist/bundle.js
// @grant        GM_setValue, GM_xmlhttpRequest
// ==/UserScript==

;(function () {
  const CONFIG = {
    BASE_API_URL: 'https://your-api.com/endpoint',
    secretKey: 'your-secret-key' // 敏感信息
  }
  if (window.MrXxx) window.MrXxx.main(CONFIG)
})()
```

### 全局变量命名

Rollup 构建时自动生成全局变量名：
- `sehuatang` → `MrSehuatang`
- `sehuatang-list` → `MrSehuatangList`

### 安全规范

1. **敏感信息隔离**：所有 `shell.js` 文件已加入 `.gitignore`
2. **壳/核分离**：
   - `index.js`：纯业务逻辑，可提交到 Git
   - `shell.js`：包含敏感配置，仅本地使用
3. **模板文件**：提供 `shell.template.js` 供参考

## 技术栈

| 类别 | 技术 |
|------|------|
| 包管理 | pnpm + Lerna |
| 构建 | Rollup (IIFE 格式) |
| 版本控制 | Lerna + Conventional Commits |
| CDN 分发 | jsDelivr |

## Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

| 类型 | 说明 | 版本影响 |
|------|------|----------|
| `feat:` | 新功能 | Minor |
| `fix:` | Bug 修复 | Patch |
| `feat!:` | 破坏性变更 | Major |
| `chore:` | 杂项 | 无 |
| `docs:` | 文档 | 无 |

## 常见问题

### Q: 如何新增一个脚本？

1. 在 `packages/scripts/` 下创建新目录
2. 添加 `package.json` 和 `index.js`
3. 在 `package.json` 中添加依赖：`"tm-utils": "workspace:*"`
4. 运行 `pnpm install`
5. Rollup 会自动扫描新包并构建

### Q: 如何调试？

使用 `pnpm run watch` 启动监听模式，配合本地 `@require` 路径实现热更新。

### Q: 如何更新 CDN 版本？

发版后更新 `shell.js` 中的 `@require` URL 版本号：
```
...@tm-xxx@1.0.1/packages/scripts/xxx/dist/bundle.js
```
