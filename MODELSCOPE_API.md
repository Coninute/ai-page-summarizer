# ModelScope API 配置说明

本插件已配置为使用 ModelScope API（基于 DeepSeek 模型）进行文章总结。

## 当前配置

### API 配置
- **API 地址**: `https://api-inference.modelscope.cn/v1/chat/completions`
- **API 密钥**: 已配置 ModelScope Token
- **模型**: `deepseek-ai/DeepSeek-V3.2`
- **思考过程**: 已启用
- **超时时间**: 60 秒

### 权限配置
- `host_permissions` 已添加 `https://api-inference.modelscope.cn/*`

## 使用方法

1. **重新加载插件**
   - 访问 `chrome://extensions/`
   - 找到"网页内容总结助手"
   - 点击刷新按钮

2. **使用插件**
   - 打开任意网页
   - 点击插件图标
   - 点击"总结当前网页内容"按钮
   - 等待 ModelScope API 返回总结结果

## 功能特点

✅ **智能总结**: 使用 DeepSeek-V3.2 模型进行高质量文章总结
✅ **思考过程**: 启用 AI 思考过程，提高总结质量
✅ **结构化输出**: 生成包含标题、摘要、要点的 Markdown 文件
✅ **自动降级**: API 调用失败时自动使用本地模拟
✅ **错误处理**: 完善的错误提示和日志记录

## API 请求格式

```javascript
{
  model: 'deepseek-ai/DeepSeek-V3.2',
  messages: [
    {
      role: 'system',
      content: '你是一个专业的文章总结助手...'
    },
    {
      role: 'user',
      content: '请总结以下文章内容：...'
    }
  ],
  stream: false,
  extra_body: {
    enable_thinking: true
  }
}
```

## 注意事项

⚠️ **API 密钥**: 当前已配置 ModelScope Token，请勿泄露
⚠️ **网络连接**: 需要稳定的网络连接访问 ModelScope API
⚠️ **内容长度**: 限制为 4000 字符，超出部分会被截断
⚠️ **响应时间**: API 响应时间可能较长，请耐心等待

## 故障排除

**问题 1：API 调用失败**
- 检查网络连接是否正常
- 查看 Chrome 控制台的错误信息（F12 → Console）
- 确认 API 密钥是否有效

**问题 2：总结质量不佳**
- 尝试使用不同类型的网页
- 检查网页内容是否完整提取
- 查看控制台日志了解 API 返回的数据

**问题 3：响应超时**
- 当前超时设置为 60 秒
- 可以在 `API_CONFIG.timeout` 中调整超时时间

## 自定义配置

如果需要修改 API 配置，编辑 `popup.js` 文件中的 `API_CONFIG` 对象：

```javascript
const API_CONFIG = {
  useAPI: true,                    // 是否使用 API
  apiUrl: '...',                   // API 地址
  apiKey: '...',                   // API 密钥
  model: '...',                    // 模型名称
  enableThinking: true,            // 是否启用思考过程
  timeout: 60000                   // 超时时间（毫秒）
};
```

## 技术支持

如有问题，请查看：
- Chrome 控制台的错误日志
- API 返回的详细错误信息
- ModelScope API 文档
