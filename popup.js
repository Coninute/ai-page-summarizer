// 存储总结内容
let summaryContent = '';

// API 配置
const API_CONFIG = {
  // 是否使用 API（false 则使用 mock 模拟）
  useAPI: true,
  // API 地址（ModelScope API）
  apiUrl: 'https://api-inference.modelscope.cn/v1/chat/completions',
  // API 密钥（ModelScope Token）
  apiKey: 'ms-fdef09ef-0e3a-4e86-ab5e-53e7a5a1296c',
  // 模型名称
  model: 'deepseek-ai/DeepSeek-V3.2',
  // 是否启用思考过程
  enableThinking: true,
  // 请求超时时间（毫秒）
  timeout: 60000
};

// 全局设置
let summaryLength = 500;

// 获取 DOM 元素
const selectElementBtn = document.getElementById('selectElementBtn');
const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
const summarizeBtn = document.getElementById('summarizeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewSelectedBtn = document.getElementById('previewSelectedBtn');
const previewSummaryBtn = document.getElementById('previewSummaryBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statusEl = document.getElementById('status');

// Modal 元素
const selectedContentModal = document.getElementById('selectedContentModal');
const summaryModal = document.getElementById('summaryModal');
const settingsModal = document.getElementById('settingsModal');
const selectedContentText = document.getElementById('selectedContentText');
const summaryContentEl = document.getElementById('summaryContent');
const closeSelectedModal = document.getElementById('closeSelectedModal');
const closeSummaryModal = document.getElementById('closeSummaryModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');

// 设置表单元素
const settingsForm = document.getElementById('settingsForm');
const apiKeyInput = document.getElementById('apiKey');
const summaryLengthInput = document.getElementById('summaryLength');
const enableThinkingCheckbox = document.getElementById('enableThinking');
const useAPICheckbox = document.getElementById('useAPI');
const cancelSettingsBtn = document.getElementById('cancelSettings');
const saveSettingsBtn = document.getElementById('saveSettings');

// 存储预览内容
let selectedContent = '';
let summaryResult = '';

// 标记是否在选择模式
let isSelectionMode = false;

// 存储选中的元素内容
let selectedElementContent = '';

// 显示状态信息
function showStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';

  if (type === 'info') {
    statusEl.innerHTML = `<span class="loading"></span>${message}`;
  }
}

// 隐藏状态信息
function hideStatus() {
  statusEl.style.display = 'none';
}

// 打开选中的内容弹框
function openSelectedContentModal() {
  selectedContentText.textContent = selectedContent;
  selectedContentModal.style.display = 'flex';
}

// 关闭选中的内容弹框
function closeSelectedContentModalFn() {
  selectedContentModal.style.display = 'none';
}

// 打开总结结果弹框
function openSummaryModal() {
  summaryContentEl.textContent = summaryResult;
  summaryModal.style.display = 'flex';
}

// 关闭总结结果弹框
function closeSummaryModalFn() {
  summaryModal.style.display = 'none';
}

// 设置相关函数
function loadSettings() {
  chrome.storage.sync.get({
    apiKey: API_CONFIG.apiKey,
    summaryLength: 500,
    enableThinking: API_CONFIG.enableThinking,
    useAPI: API_CONFIG.useAPI
  }, function(items) {
    apiKeyInput.value = items.apiKey;
    summaryLengthInput.value = items.summaryLength;
    enableThinkingCheckbox.checked = items.enableThinking;
    useAPICheckbox.checked = items.useAPI;
    // 更新内存中的配置
    API_CONFIG.apiKey = items.apiKey;
    API_CONFIG.enableThinking = items.enableThinking;
    API_CONFIG.useAPI = items.useAPI;
    // 更新全局总结字数
    summaryLength = items.summaryLength;
  });
}

function saveSettings() {
  const settings = {
    apiKey: apiKeyInput.value.trim(),
    summaryLength: parseInt(summaryLengthInput.value) || 500,
    enableThinking: enableThinkingCheckbox.checked,
    useAPI: useAPICheckbox.checked
  };
  chrome.storage.sync.set(settings, function() {
    // 更新内存中的配置
    API_CONFIG.apiKey = settings.apiKey;
    API_CONFIG.enableThinking = settings.enableThinking;
    API_CONFIG.useAPI = settings.useAPI;
    // 更新全局总结字数
    summaryLength = settings.summaryLength;
    showStatus('设置已保存', 'success');
    setTimeout(hideStatus, 2000);
    closeSettingsModalFn();
  });
}

function openSettingsModal() {
  console.log('打开设置弹窗，settingsModal:', settingsModal);
  if (!settingsModal) {
    console.error('settingsModal 元素未找到！');
    return;
  }
  loadSettings();
  settingsModal.style.display = 'flex';
  console.log('设置弹窗已显示');
}

function closeSettingsModalFn() {
  settingsModal.style.display = 'none';
}

// 模拟 AI 总结功能
function mockSummarize(text) {
  // 提取前200个字符作为标题
  const title = text.substring(0, 200).replace(/\n/g, ' ').trim();

  // 生成摘要（使用文本的前summaryLength个字符）
  const summary = text.substring(0, summaryLength).replace(/\n/g, ' ').trim();

  // 生成要点列表（按句子分割）
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
  const keyPoints = sentences.slice(0, 5).map(s => s.trim());

  return {
    title: title,
    summary: summary,
    keyPoints: keyPoints
  };
}

// 格式化为 Markdown
function formatToMarkdown(summaryData) {
  let markdown = `# ${summaryData.title}\n\n`;
  markdown += `## 摘要\n${summaryData.summary}\n\n`;
  markdown += `## 要点\n`;
  summaryData.keyPoints.forEach(point => {
    markdown += `- ${point}\n`;
  });
  return markdown;
}

// 下载 Markdown 文件
function downloadMarkdown(content) {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `summary_${timestamp}.md`;

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: false
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('下载失败:', chrome.runtime.lastError);
      showStatus('下载失败，请重试', 'error');
    } else {
      showStatus('文件已下载', 'success');
      setTimeout(hideStatus, 2000);
    }
  });
}

// 从全局变量下载
function downloadCurrentSummary() {
  if (summaryResult) {
    downloadMarkdown(summaryResult);
  } else {
    showStatus('请先生成总结内容', 'error');
    setTimeout(hideStatus, 2000);
  }
}

// 调用 API 进行总结
async function callAPISummarize(text) {
  try {
    // 构建请求体
    const requestBody = {
      model: API_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的文章总结助手。请将用户提供的文章内容总结为结构化的格式，包括标题、摘要和要点列表。请使用 Markdown 格式输出，标题用 #，摘要用 ## 摘要，要点用 ## 要点，每个要点用 - 开头。总结的摘要部分请控制在约${summaryLength}字左右。`
        },
        {
          role: 'user',
          content: `请总结以下文章内容：\n\n${text.substring(0, 4000)}`
        }
      ],
      stream: false
    };

    // 如果启用思考过程，添加 extra_body
    if (API_CONFIG.enableThinking) {
      requestBody.extra_body = {
        enable_thinking: true
      };
    }

    const response = await fetch(API_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 错误响应:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API 返回数据:', data);

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API 返回的数据格式不正确');
    }

    // 获取内容（如果有 reasoning_content，则使用 content）
    const choice = data.choices[0];
    const content = choice.message.content || choice.delta?.content || '';

    // 解析 API 返回的内容
    const lines = content.split('\n');
    let title = '';
    let summary = '';
    const keyPoints = [];

    let currentSection = '';
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        title = line.replace('# ', '').trim();
      } else if (line.startsWith('## 摘要') || line.startsWith('## Summary')) {
        currentSection = 'summary';
      } else if (line.startsWith('## 要点') || line.startsWith('## Key Points')) {
        currentSection = 'points';
      } else if (line.startsWith('- ')) {
        if (currentSection === 'points') {
          keyPoints.push(line.replace('- ', '').trim());
        }
      } else if (currentSection === 'summary' && line.trim()) {
        summary += line.trim() + ' ';
      }
    });

    // 如果解析失败，使用整个内容作为摘要
    if (!title) {
      title = text.substring(0, 200).replace(/\n/g, ' ').trim();
    }
    if (!summary) {
      summary = content.substring(0, 500).replace(/\n/g, ' ').trim();
    }

    return {
      title: title,
      summary: summary.trim(),
      keyPoints: keyPoints.length > 0 ? keyPoints : [content.substring(0, 200).trim()]
    };

  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}

// 总结选中的元素
async function summarizeSelectedElement(content) {
  try {
    console.log('========== summarizeSelectedElement 开始 ==========');
    console.log('接收到的内容长度:', content ? content.length : 0);
    console.log('API 配置:', {
      useAPI: API_CONFIG.useAPI,
      hasApiKey: API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE'
    });

    if (!content || content.length < 10) {
      throw new Error('选中的内容太短，无法进行总结');
    }

    // 存储选中的内容
    selectedContent = content;
    previewSelectedBtn.style.display = 'block';

    // 根据配置选择使用 API 或 mock
    let summaryData;
    if (API_CONFIG.useAPI && API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
      console.log('使用 API 进行总结');
      showStatus('正在使用 AI 生成总结...', 'info');
      try {
        summaryData = await callAPISummarize(content);
        console.log('API 总结成功');
      } catch (apiError) {
        console.error('API 调用失败，使用 mock 模拟:', apiError);
        showStatus('API 调用失败，使用本地总结...', 'info');
        summaryData = mockSummarize(content);
      }
    } else {
      console.log('使用 mock 进行总结');
      showStatus('正在生成本地总结...', 'info');
      summaryData = mockSummarize(content);
    }

    console.log('总结数据:', summaryData);

    // 生成 Markdown
    const markdown = formatToMarkdown(summaryData);
    console.log('Markdown 内容生成完成，长度:', markdown.length);

    // 存储总结结果
    summaryResult = markdown;
    previewSummaryBtn.style.display = 'block';

    // 两个预览按钮同行显示
    previewSelectedBtn.style.gridColumn = 'span 1';

    // 保存到全局变量供下载使用
    window.summaryContent = markdown;

    // 显示下载按钮
    downloadBtn.style.display = 'block';
    showStatus('总结生成成功！', 'success');

    // 3秒后隐藏状态
    setTimeout(hideStatus, 3000);

  } catch (error) {
    console.error('总结过程中出错:', error);
    showStatus(error.message || '总结失败，请重试', 'error');
    setTimeout(hideStatus, 3000);
  }
}

// 选择元素按钮点击事件
selectElementBtn.addEventListener('click', async () => {
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('无法获取当前标签页');
    }

    // 检查是否可以访问页面
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
    } catch (e) {
      // 如果 content script 未加载，先注入
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }

    if (!isSelectionMode) {
      // 开始选择模式
      await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });

      // 更新 UI
      isSelectionMode = true;
      selectElementBtn.style.display = 'none';
      cancelSelectionBtn.style.display = 'block';
      summarizeBtn.disabled = true;

      // 显示提示
      showStatus('已启动选择模式，请在页面上选择元素', 'info');
    }
  } catch (error) {
    console.error('启动选择模式失败:', error);
    showStatus('启动选择模式失败: ' + error.message, 'error');
    setTimeout(hideStatus, 3000);
  }
});

// 取消选择按钮点击事件
cancelSelectionBtn.addEventListener('click', async () => {
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('无法获取当前标签页');
    }

    // 停止选择模式
    await chrome.tabs.sendMessage(tab.id, { action: 'stopSelection' });

    // 更新 UI
    isSelectionMode = false;
    selectElementBtn.style.display = 'block';
    cancelSelectionBtn.style.display = 'none';
    summarizeBtn.disabled = false;

    // 隐藏预览和下载按钮
    previewSelectedBtn.style.display = 'none';
    previewSummaryBtn.style.display = 'none';
    downloadBtn.style.display = 'none';

    // 隐藏提示
    hideStatus();
  } catch (error) {
    console.error('取消选择模式失败:', error);
    showStatus('取消选择模式失败: ' + error.message, 'error');
    setTimeout(hideStatus, 3000);
  }
});

// 总结当前网页按钮点击事件
summarizeBtn.addEventListener('click', async () => {
  try {
    showStatus('正在提取网页内容...', 'info');

    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error('无法获取当前标签页');
    }

    // 执行 content script
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // 提取网页正文内容
        function extractMainContent() {
          // 克隆 body 以避免修改原页面
          const clone = document.body.cloneNode(true);

          // 先尝试获取主要内容区域
          const mainSelectors = [
            'main', 'article', '[role="main"]',
            '.main-content', '.content', '.article-content',
            '.post-content', '.entry-content', '.article-body',
            '#content', '#main', '#article'
          ];

          for (const selector of mainSelectors) {
            const element = clone.querySelector(selector);
            if (element) {
              const text = element.innerText || element.textContent;
              if (text && text.trim().length > 100) {
                return text.trim();
              }
            }
          }

          // 如果没找到主要内容区域，移除不需要的元素后获取所有文本
          const selectorsToRemove = [
            'nav', 'header', 'footer', 'aside',
            '.navigation', '.nav', '.sidebar', '.ad', '.advertisement',
            '.comment', '.comments', '.footer', '.header',
            'script', 'style', 'noscript', 'iframe'
          ];

          // 移除不需要的元素
          selectorsToRemove.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
          });

          // 获取所有段落
          const paragraphs = clone.querySelectorAll('p, div, section, h1, h2, h3, h4, h5, h6');

          // 如果找到段落，合并所有段落内容
          if (paragraphs.length > 0) {
            let allText = '';
            paragraphs.forEach(p => {
              const text = p.innerText || p.textContent;
              if (text && text.trim().length > 10) {
                allText += text.trim() + ' ';
              }
            });
            return allText.trim() || clone.innerText;
          }

          // 如果没有找到段落，使用整个 body 的文本
          return clone.innerText;
        }

        // 提取并清理文本
        const content = extractMainContent();
        console.log('提取的内容长度:', content.length);
        console.log('提取的内容预览:', content.substring(0, 200));
        return content
          .replace(/\s+/g, ' ')  // 合并空白字符
          .replace(/\n+/g, '\n')  // 合并换行
          .trim();
      }
    });

    if (!result || result.length === 0) {
      throw new Error('无法提取网页内容');
    }

    const extractedText = result[0].result;

    console.log('提取的文本长度:', extractedText.length);
    console.log('提取的文本预览:', extractedText.substring(0, 200));

    if (!extractedText || extractedText.length < 10) {
      throw new Error('提取的内容太短，无法进行总结');
    }

    // 存储选中的内容
    selectedContent = extractedText;
    previewSelectedBtn.style.display = 'block';

    showStatus('正在生成总结...', 'info');

    // 根据配置选择使用 API 或 mock
    let summaryData;
    if (API_CONFIG.useAPI && API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
      try {
        summaryData = await callAPISummarize(extractedText);
      } catch (apiError) {
        console.error('API 调用失败，使用 mock 模拟:', apiError);
        showStatus('API 调用失败，使用本地总结...', 'info');
        summaryData = mockSummarize(extractedText);
      }
    } else {
      summaryData = mockSummarize(extractedText);
    }

    // 生成 Markdown
    const markdown = formatToMarkdown(summaryData);

    // 存储总结结果
    summaryResult = markdown;
    previewSummaryBtn.style.display = 'block';

    // 两个预览按钮同行显示
    previewSelectedBtn.style.gridColumn = 'span 1';

    // 保存到全局变量供下载使用
    window.summaryContent = markdown;

    // 显示下载按钮
    downloadBtn.style.display = 'block';
    showStatus('总结生成成功！', 'success');

    // 3秒后隐藏状态
    setTimeout(hideStatus, 3000);

  } catch (error) {
    console.error('总结过程中出错:', error);
    showStatus(error.message || '总结失败，请重试', 'error');
    setTimeout(hideStatus, 3000);
  }
});



// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('========== 收到消息 ==========');
  console.log('消息内容:', request);

  if (request.action === 'elementPreview') {
    try {
      console.log('处理 elementPreview 消息');

      // 存储选中的内容
      selectedContent = request.content;
      previewSelectedBtn.style.display = 'block';
      // 选中预览按钮独占一行
      previewSelectedBtn.style.gridColumn = 'span 2';

      // 显示提示
      showStatus(`已选中元素（${request.content.length} 字符），单击即可总结`, 'info');

      sendResponse({ success: true });
    } catch (error) {
      console.error('处理预览失败:', error);
      showStatus('处理预览失败: ' + error.message, 'error');
      sendResponse({ success: false, error: error.message });
    }
  } else if (request.action === 'elementSelected') {
    try {
      console.log('========== 处理 elementSelected 消息 ==========');
      console.log('内容长度:', request.content ? request.content.length : 0);

      // 恢复 UI
      isSelectionMode = false;
      selectElementBtn.style.display = 'block';
      cancelSelectionBtn.style.display = 'none';
      summarizeBtn.disabled = false;

      // 调用总结函数
      console.log('准备调用 summarizeSelectedElement...');
      summarizeSelectedElement(request.content);

      sendResponse({ success: true });
    } catch (error) {
      console.error('处理选中元素失败:', error);
      showStatus('处理失败: ' + error.message, 'error');

      // 恢复 UI
      isSelectionMode = false;
      selectElementBtn.style.display = 'block';
      cancelSelectionBtn.style.display = 'none';
      summarizeBtn.disabled = false;

      sendResponse({ success: false, error: error.message });
    }
  } else {
    console.log('未知的消息类型:', request.action);
  }

  // 返回 true 表示异步响应
  return true;
});

// 检查是否有缓存的内容
async function checkCachedContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      console.log('无法获取当前标签页');
      return;
    }

    console.log('检查是否有缓存的内容...');

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCachedContent' });

    if (response && response.success && response.content) {
      console.log('发现缓存的内容，长度:', response.content.length);

      // 自动开始总结，不需要用户点击按钮
      console.log('自动开始总结缓存的内容');
      showStatus(`自动总结之前选中的内容（${response.content.length} 字符）...`, 'info');

      // 清除缓存
      await chrome.tabs.sendMessage(tab.id, { action: 'clearCachedContent' });

      // 立即开始总结
      setTimeout(() => {
        summarizeSelectedElement(response.content);
      }, 500);
    } else {
      console.log('没有缓存的内容');
    }
  } catch (error) {
    console.log('检查缓存内容失败（可能是 content script 未加载）:', error);
  }
}

// 当 popup 打开时，初始化所有事件监听器
document.addEventListener('DOMContentLoaded', () => {
  console.log('popup 已加载，加载设置并检查缓存内容...');
  loadSettings();
  checkCachedContent();
  
  // 绑定所有事件监听器
  selectElementBtn.addEventListener('click', async () => {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页');
      }

      // 检查是否可以访问页面
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      } catch (e) {
        // 如果 content script 未加载，先注入
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      }

      if (!isSelectionMode) {
        // 开始选择模式
        await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });

        // 更新 UI
        isSelectionMode = true;
        selectElementBtn.style.display = 'none';
        cancelSelectionBtn.style.display = 'block';
        summarizeBtn.disabled = true;

        // 显示提示
        showStatus('已启动选择模式，请在页面上选择元素', 'info');
      }
    } catch (error) {
      console.error('启动选择模式失败:', error);
      showStatus('启动选择模式失败: ' + error.message, 'error');
      setTimeout(hideStatus, 3000);
    }
  });

  cancelSelectionBtn.addEventListener('click', async () => {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页');
      }

      // 停止选择模式
      await chrome.tabs.sendMessage(tab.id, { action: 'stopSelection' });

      // 更新 UI
      isSelectionMode = false;
      selectElementBtn.style.display = 'block';
      cancelSelectionBtn.style.display = 'none';
      summarizeBtn.disabled = false;

      // 隐藏预览和下载按钮
      previewSelectedBtn.style.display = 'none';
      previewSummaryBtn.style.display = 'none';
      downloadBtn.style.display = 'none';

      // 隐藏提示
      hideStatus();
    } catch (error) {
      console.error('取消选择模式失败:', error);
      showStatus('取消选择模式失败: ' + error.message, 'error');
      setTimeout(hideStatus, 3000);
    }
  });

  summarizeBtn.addEventListener('click', async () => {
    try {
      showStatus('正在提取网页内容...', 'info');

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页');
      }

      // 执行 content script
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // 提取网页正文内容
          function extractMainContent() {
            // 克隆 body 以避免修改原页面
            const clone = document.body.cloneNode(true);

            // 先尝试获取主要内容区域
            const mainSelectors = [
              'main', 'article', '[role="main"]',
              '.main-content', '.content', '.article-content',
              '.post-content', '.entry-content', '.article-body',
              '#content', '#main', '#article'
            ];

            for (const selector of mainSelectors) {
              const element = clone.querySelector(selector);
              if (element) {
                const text = element.innerText || element.textContent;
                if (text && text.trim().length > 100) {
                  return text.trim();
                }
              }
            }

            // 如果没找到主要内容区域，移除不需要的元素后获取所有文本
            const selectorsToRemove = [
              'nav', 'header', 'footer', 'aside',
              '.navigation', '.nav', '.sidebar', '.ad', '.advertisement',
              '.comment', '.comments', '.footer', '.header',
              'script', 'style', 'noscript', 'iframe'
            ];

            // 移除不需要的元素
            selectorsToRemove.forEach(selector => {
              clone.querySelectorAll(selector).forEach(el => el.remove());
            });

            // 获取所有段落
            const paragraphs = clone.querySelectorAll('p, div, section, h1, h2, h3, h4, h5, h6');

            // 如果找到段落，合并所有段落内容
            if (paragraphs.length > 0) {
              let allText = '';
              paragraphs.forEach(p => {
                const text = p.innerText || p.textContent;
                if (text && text.trim().length > 10) {
                  allText += text.trim() + ' ';
                }
              });
              return allText.trim() || clone.innerText;
            }

            // 如果没有找到段落，使用整个 body 的文本
            return clone.innerText;
          }

          // 提取并清理文本
          const content = extractMainContent();
          console.log('提取的内容长度:', content.length);
          console.log('提取的内容预览:', content.substring(0, 200));
          return content
            .replace(/\s+/g, ' ')  // 合并空白字符
            .replace(/\n+/g, '\n')  // 合并换行
            .trim();
        }
      });

      if (!result || result.length === 0) {
        throw new Error('无法提取网页内容');
      }

      const extractedText = result[0].result;

      console.log('提取的文本长度:', extractedText.length);
      console.log('提取的文本预览:', extractedText.substring(0, 200));

      if (!extractedText || extractedText.length < 10) {
        throw new Error('提取的内容太短，无法进行总结');
      }

      // 存储选中的内容
      selectedContent = extractedText;
      previewSelectedBtn.style.display = 'block';

      showStatus('正在生成总结...', 'info');

      // 根据配置选择使用 API 或 mock
      let summaryData;
      if (API_CONFIG.useAPI && API_CONFIG.apiKey !== 'YOUR_API_KEY_HERE') {
        try {
          summaryData = await callAPISummarize(extractedText);
        } catch (apiError) {
          console.error('API 调用失败，使用 mock 模拟:', apiError);
          showStatus('API 调用失败，使用本地总结...', 'info');
          summaryData = mockSummarize(extractedText);
        }
      } else {
        summaryData = mockSummarize(extractedText);
      }

      // 生成 Markdown
      const markdown = formatToMarkdown(summaryData);

      // 存储总结结果
      summaryResult = markdown;
      previewSummaryBtn.style.display = 'block';

      // 两个预览按钮同行显示
      previewSelectedBtn.style.gridColumn = 'span 1';

      // 保存到全局变量供下载使用
      window.summaryContent = markdown;

      // 显示下载按钮
      downloadBtn.style.display = 'block';
      showStatus('总结生成成功！', 'success');

      // 3秒后隐藏状态
      setTimeout(hideStatus, 3000);

    } catch (error) {
      console.error('总结过程中出错:', error);
      showStatus(error.message || '总结失败，请重试', 'error');
      setTimeout(hideStatus, 3000);
    }
  });

  downloadBtn.addEventListener('click', () => {
    downloadCurrentSummary();
  });

  previewSelectedBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页');
      }
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showSelectedModal',
        content: selectedContent
      });
    } catch (error) {
      console.error('发送消息失败，使用本地弹窗:', error);
      openSelectedContentModal();
    }
  });

  previewSummaryBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error('无法获取当前标签页');
      }
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showSummaryModal',
        content: summaryResult
      });
    } catch (error) {
      console.error('发送消息失败，使用本地弹窗:', error);
      openSummaryModal();
    }
  });

  closeSelectedModal.addEventListener('click', () => {
    closeSelectedContentModalFn();
  });

  closeSummaryModal.addEventListener('click', () => {
    closeSummaryModalFn();
  });

  selectedContentModal.addEventListener('click', (e) => {
    if (e.target === selectedContentModal) {
      closeSelectedContentModalFn();
    }
  });

  summaryModal.addEventListener('click', (e) => {
    if (e.target === summaryModal) {
      closeSummaryModalFn();
    }
  });

  settingsBtn.addEventListener('click', () => {
    console.log('设置按钮被点击，settingsBtn:', settingsBtn);
    openSettingsModal();
  });

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });

  cancelSettingsBtn.addEventListener('click', () => {
    closeSettingsModalFn();
  });

  closeSettingsModal.addEventListener('click', () => {
    closeSettingsModalFn();
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModalFn();
    }
  });
});
