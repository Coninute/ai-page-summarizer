## 网页内容总结助手 Chrome 插件（React + Vite 版）

一个基于 **React + Vite** 构建的 Manifest V3 Chrome 插件，可以一键总结当前网页内容并导出为 Markdown 文件，支持调用 **ModelScope + DeepSeek-V3.2** 或本地 mock 总结。

### 功能特点

- **一键提取网页正文内容**
- **支持选择任意元素进行总结（页面高亮选择模式）**
- **智能生成总结 / 博客 / 文章 / 报告 / 要点列表**
- **导出为 Markdown 文件**
- **弹窗 UI 使用 React 组件 + 模块化服务层**
- **遵循 Manifest V3 规范**

### 运行与构建（React + Vite）

1. 在项目根目录安装依赖：

   ```bash
   npm install
   ```

2. 打包构建（用于 Chrome 扩展）：

   ```bash
   npm run build
   ```

3. 构建完成后，会生成 `dist` 目录。  
   **Chrome 扩展加载时请选择 `dist` 目录作为“已解压的扩展程序”根目录。**

### 开发调试（可选）

在开发阶段，如果你只想在普通浏览器窗口中调试 React 弹窗 UI（不依赖 Chrome 扩展环境），可以：

```bash
npm run dev
```

然后在浏览器中访问 Vite 给出的本地地址（通常是 `http://localhost:5173`），可以单独预览和调试弹窗界面与交互逻辑。

### 安装方法（开发者模式）

1. 先执行 `npm install && npm run build`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角的“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择 `dist` 目录

### 使用说明

1. 在任意网页点击插件图标打开弹窗（React UI）
2. 可选择：
   - **“总结当前网页内容”**：自动提取正文并总结
   - **“选择元素进行总结”**：进入页面高亮选择模式，点击任意元素进行总结
3. 等待 AI 或本地 mock 生成总结
4. 通过“预览选中内容 / 总结结果”在页面内查看弹窗
5. 点击“下载为 .md 文件”保存到本地

### 项目结构（简化）

```text
.
├── public/
│   ├── manifest.json     # 插件配置（构建时复制到 dist 使用）
│   └── content.js        # 内容脚本（原生 JS，直接注入页面）
├── src/
│   └── popup/
│       ├── PopupApp.jsx          # 弹窗根组件
│       ├── components/           # UI 组件（Header、Buttons、SettingsModal、StatusBar 等）
│       ├── hooks/usePopupLogic.jsx   # 业务状态与 Chrome API 调用
│       ├── services/             # 总结、设置、下载等模块化服务
│       └── styles.css            # 弹窗样式
├── index.html            # 弹窗入口（由 Vite 处理）
├── vite.config.js        # Vite 配置（React + 相对 base，输出 dist）
├── package.json          # NPM 脚本与依赖
├── .gitignore            # Git 忽略规则（dist、node_modules 等）
└── README.md
```

### Git 忽略说明

仓库内已添加 `.gitignore` 文件，主要规则包括：

- **不提交依赖与构建产物**：忽略 `node_modules/`、`dist/`
- **不提交本地环境和编辑器文件**：忽略 `.vscode/`、`.idea/`、`.DS_Store`、日志文件等
- **预留环境变量支持**：默认忽略 `.env` 及 `.env.*.local`，如果后续你要把 API Key 放到环境变量，可以直接复用这些规则

### 技术实现概览

- **UI 层**：React 函数组件 + 自定义 Hook 管理状态
- **业务逻辑**：
  - 通过 `chrome.scripting.executeScript` 提取整页正文
  - 通过 `content.js` + `chrome.runtime.sendMessage` 实现元素选择和页面级弹窗预览
  - 使用 ModelScope Chat Completions + DeepSeek-V3.2 或本地 `mockSummarize`
- **数据与配置**：
  - 使用 `chrome.storage.sync` 持久化 API Key、总结长度、内容类型等
  - 模块化拆分为 `settings`、`summarize`、`download` 等服务

### 版本信息

- **插件版本**：1.0.0
- **Manifest 版本**：3
