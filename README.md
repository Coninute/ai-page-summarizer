## 网页内容总结助手 Chrome 插件（React + Vite 版）

基于 **React + Vite** 的 Manifest V3 Chrome 插件，可一键总结当前网页内容并导出为 Markdown，支持 **ModelScope + DeepSeek-V3.2** 或本地 mock 总结。

### 功能特点

- **一键提取网页正文并总结**
- **选择任意元素进行总结**（页面高亮选择模式）
- **多种输出类型**：总结 / 博客 / 文章 / 报告 / 要点列表
- **导出为 Markdown 文件**
- **设置持久化**：API Key、总结字数、内容类型等保存在 `chrome.storage.sync`，无后端
- **Manifest V3**

### 环境与构建

**依赖安装**（任选其一）：

```bash
pnpm install
# 或
npm install
```

**构建扩展**：

```bash
pnpm run build
# 或
npm run build
```

构建会执行两步：先打包 Popup（React），再单独打包 Content Script（IIFE）。产物在 **`dist`** 目录。  
在 Chrome 中加载扩展时，请选择 **`dist`** 作为「加载已解压的扩展程序」的目录。

**开发调试**（仅预览弹窗 UI，不跑扩展环境）：

```bash
pnpm run dev
# 或
npm run dev
```

浏览器访问 Vite 提供的地址（如 `http://localhost:5173`）即可调试弹窗界面。

### 安装步骤

1. 在项目根目录执行：`pnpm install`（或 `npm install`），再执行 `pnpm run build`（或 `npm run build`）。
2. 打开 Chrome，进入 `chrome://extensions/`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择项目下的 **`dist`** 目录。

### 首次使用与设置

1. 点击插件图标打开弹窗。
2. 点击「设置」，在 **ModelScope API Key** 中填入你的 API Key 并保存（密钥仅存于本地，不会上传）。
3. 未配置或密钥无效时，在总结前会提示「密钥未配置或不存在」或「密钥错误或已失效」，并自动打开设置页。
4. 可在设置中调整 **总结字数**（100–8000）、内容类型、是否使用 API、是否启用思考过程等，修改后点击保存即可生效。

### 使用说明

1. **总结当前网页**：在弹窗中点击「总结当前网页内容」，自动提取正文并调用 AI 或本地 mock 总结。
2. **选择元素总结**：点击「选择元素进行总结」，在页面上高亮点击要总结的区块，再在弹窗中确认即可。
3. 生成完成后可「预览总结结果」，或「下载为 .md 文件」保存。

### 项目结构

```text
.
├── public/
│   └── manifest.json          # 扩展配置（构建时复制到 dist）
├── src/
│   ├── content.js             # Content Script 源码（构建为 dist/content.js，IIFE）
│   ├── main.jsx               # 弹窗入口
│   └── popup/
│       ├── PopupApp.jsx       # 弹窗根组件
│       ├── components/        # 弹窗 UI 组件
│       ├── hooks/usePopupLogic.jsx
│       ├── services/          # 总结、设置、下载等
│       └── styles.css
├── index.html                 # 弹窗页面（Vite 入口）
├── vite.config.js             # Popup 构建配置（React，ESM）
├── vite.content.config.js     # Content Script 构建配置（IIFE，无顶层 import）
├── package.json
└── README.md
```

- **为何两个 Vite 配置？** Popup 以 `type="module"` 加载，可用 ESM；Content Script 由 Chrome 按普通脚本注入，不能含顶层 `import`，故用 `vite.content.config.js` 将 `src/content.js` 打成单文件 IIFE。

### 技术要点

- **UI**：React 函数组件 + 自定义 Hook。
- **总结**：`chrome.scripting.executeScript` 取正文；Content Script 负责元素选择与页面内预览；ModelScope Chat Completions（DeepSeek-V3.2）或本地 `mockSummarize`。
- **配置**：`chrome.storage.sync` 持久化 API Key、总结字数、内容类型等；设置页修改后立即写入，总结时读取并生效。

### 版本

- 插件版本：1.0.0  
- Manifest：3  

更多 API 说明见 **MODELSCOPE_API.md**。
