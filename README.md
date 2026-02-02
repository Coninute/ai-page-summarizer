# 网页内容总结助手 Chrome 插件

一个基于 Manifest V3 的 Chrome 浏览器插件，可以一键总结当前网页内容并导出为 Markdown 文件。

## 功能特点

- 📝 一键提取网页正文内容
- 🤖 智能生成文章总结（使用 mock 模拟 AI）
- 📥 导出为 Markdown 文件
- 🎨 简洁美观的界面设计
- ⚡ 遵循 Manifest V3 规范

## 安装方法

1. 下载或克隆本项目到本地
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目的文件夹

## 使用说明

1. 在任意网页上点击插件图标
2. 点击"总结当前网页内容"按钮
3. 等待插件提取网页内容并生成总结
4. 点击"下载为 .md 文件"按钮保存总结

## 项目结构

```
.
├── manifest.json    # 插件配置文件
├── popup.html       # 弹窗页面
├── popup.js         # 弹窗逻辑
├── content.js       # 内容脚本
└── README.md        # 说明文档
```

## 技术实现

- 使用纯 HTML/CSS/JavaScript，不依赖任何前端框架
- 遵循 Manifest V3 规范
- 权限仅申请必要的：["activeTab", "scripting"]
- 使用 heuristic 方法提取网页正文
- 使用 Blob + URL.createObjectURL 实现文件下载

## 注意事项

- 当前版本使用 mock 函数模拟 AI 总结功能
- 网页内容提取使用简单的 heuristic 方法，可能不适用于所有网站
- 插件宽度限制为 380px，符合 Chrome 插件设计规范

## 版本信息

- 版本：1.0.0
- Manifest 版本：3
