import { useEffect, useMemo, useState } from 'react';
import { createApiConfig, loadSettingsFromStorage, saveSettingsToStorage, isValidApiKey } from '../services/settings';
import { mockSummarize, formatToMarkdown, callAPISummarize } from '../services/summarize';
import { downloadMarkdown } from '../services/download';

export function usePopupLogic() {
  const [apiConfig, setApiConfig] = useState(createApiConfig());
  const [summaryLength, setSummaryLength] = useState(1000);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const [summaryResult, setSummaryResult] = useState('');

  const [status, setStatus] = useState({
    visible: false,
    message: '',
    type: 'info',
    showSpinner: false
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [summaryPreviewOpen, setSummaryPreviewOpen] = useState(false);

  const [settingsState, setSettingsState] = useState({
    apiKey: apiConfig.apiKey,
    summaryLength: summaryLength,
    enableThinking: apiConfig.enableThinking,
    useAPI: apiConfig.useAPI,
    contentType: apiConfig.contentType
  });

  useEffect(() => {
    loadSettingsFromStorage(apiConfig).then(({ config, length }) => {
      setApiConfig(config);
      setSummaryLength(length);
      setSettingsState({
        apiKey: config.apiKey,
        summaryLength: length,
        enableThinking: config.enableThinking,
        useAPI: config.useAPI,
        contentType: config.contentType
      });
    });
  }, []);

  useEffect(() => {
    checkCachedContent().catch(() => {
      // content script 未注入时 sendMessage 会拒绝，静默忽略
    });
  }, []);

  // 监听来自 content.js 的消息（元素预览与选中）
  useEffect(() => {
    function handleMessage(request, sender, sendResponse) {
      if (request.action === 'elementSelected') {
        const content = request.content || '';
        setIsSelectionMode(false);
        setIsBusy(true);
        summarizeContent(content)
          .then(() => {
            sendResponse?.({ success: true });
          })
          .catch((error) => {
            console.error('处理选中元素失败:', error);
            showStatus(error.message || '处理失败，请重试', 'error', false);
            setTimeout(() => hideStatus(), 3000);
            sendResponse?.({ success: false, error: error.message });
          })
          .finally(() => {
            setIsBusy(false);
          });
        return true;
      }
      return false;
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [apiConfig, summaryLength]);

  const ui = useMemo(() => ({
    isSelectionMode,
    isBusy,
    hasSummary: !!summaryResult,
    canDownload: !!summaryResult
  }), [isSelectionMode, isBusy, summaryResult]);

  function showStatus(message, type = 'info', showSpinner = false) {
    if (showSpinner) {
      // 带 loading 的长任务提示（如“正在使用 AI 生成总结...”）只在插件内部显示
      setStatus({ visible: true, message, type, showSpinner });
    } else {
      // 其他结果类的提示（成功 / 失败等）走页面级顶部提示
      setStatus((prev) => ({ ...prev, visible: false }));
      notifyPageStatus(message, type, false);
    }
  }

  function hideStatus() {
    setStatus((prev) => ({ ...prev, visible: false }));
  }

  async function notifyPageStatus(message, type, showSpinner) {
    // 如果是“加载中”，让提示常驻直到明确关闭；否则默认 3 秒自动消失
    const duration = showSpinner ? 0 : 3000;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showPageStatus',
        message,
        type,
        duration,
      });
    } catch {
      // 某些页面无法注入 content script 时忽略
    }
  }

  async function withBusy(fn) {
    setIsBusy(true);
    try {
      await fn();
    } finally {
      setIsBusy(false);
    }
  }

  async function ensureContentScript(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    }
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('无法获取当前标签页');
    return tab;
  }

  async function onStartSelection() {
    await withBusy(async () => {
      const tab = await getActiveTab();
      await ensureContentScript(tab.id);
      await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
      setIsSelectionMode(true);
      showStatus('已启动选择模式，请在页面上选择元素', 'info', true);
    });
  }

  async function onCancelSelection() {
    await withBusy(async () => {
      const tab = await getActiveTab();
      await chrome.tabs.sendMessage(tab.id, { action: 'stopSelection' });
      setIsSelectionMode(false);
      setSelectedContent('');
      setSummaryResult('');
      hideStatus();
    });
  }

  async function summarizeContent(content) {
    if (!content || content.length < 10) {
      throw new Error('选中的内容太短，无法进行总结');
    }

    // 总结前校验：开启 API 但未配置或密钥无效时，直接提示并中止
    if (apiConfig.useAPI) {
      if (!isValidApiKey(apiConfig.apiKey)) {
        showStatus('请先在设置中填写有效的 API Key（密钥未配置或不存在）', 'error', false);
        setTimeout(() => hideStatus(), 5000);
        setSettingsModalOpen(true);
        return;
      }
    }

    showStatus(apiConfig.useAPI ? '正在使用 AI 生成总结...' : '正在生成本地总结...', 'info', true);

    let summaryData;
    if (apiConfig.useAPI) {
      try {
        summaryData = await callAPISummarize(content, apiConfig, summaryLength);
      } catch (error) {
        console.error('API 调用失败:', error);
        const isKeyError = error.message && (error.message.includes('API Key') || error.message.includes('无效') || error.message.includes('失效'));
        if (isKeyError) {
          showStatus('密钥错误或已失效，请检查设置中的 API Key', 'error', false);
          setTimeout(() => hideStatus(), 5000);
          setSettingsModalOpen(true);
          return;
        }
        showStatus('API 调用失败，使用本地总结...', 'info', true);
        summaryData = mockSummarize(content, apiConfig, summaryLength);
      }
    } else {
      summaryData = mockSummarize(content, apiConfig, summaryLength);
    }

    const markdown = formatToMarkdown(summaryData, apiConfig);
    setSummaryResult(markdown);
    window.summaryContent = markdown;

    // 将总结结果缓存到当前页面对应的 content.js 中（与页面生命周期绑定）
    try {
      const tab = await getActiveTab();
      await chrome.tabs.sendMessage(tab.id, {
        action: 'cacheSummary',
        summary: markdown,
      });
    } catch {
      // content script 不可用时忽略
    }
    showStatus('总结生成成功！', 'success', false);
    setTimeout(() => hideStatus(), 3000);
  }

  async function onSummarizePage() {
    await withBusy(async () => {
      showStatus('正在提取网页内容...', 'info', true);
      const tab = await getActiveTab();

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          function extractMainContent() {
            const clone = document.body.cloneNode(true);

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

            const selectorsToRemove = [
              'nav', 'header', 'footer', 'aside',
              '.navigation', '.nav', '.sidebar', '.ad', '.advertisement',
              '.comment', '.comments', '.footer', '.header',
              'script', 'style', 'noscript', 'iframe'
            ];

            selectorsToRemove.forEach(selector => {
              clone.querySelectorAll(selector).forEach(el => el.remove());
            });

            const paragraphs = clone.querySelectorAll('p, div, section, h1, h2, h3, h4, h5, h6');

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

            return clone.innerText;
          }

          const content = extractMainContent();
          return content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();
        }
      });

      if (!result || result.length === 0) {
        throw new Error('无法提取网页内容');
      }

      const extractedText = result[0].result;
      // 整页总结不需要“预览选中的内容”，因此清空选中内容
      setSelectedContent('');
      await summarizeContent(extractedText);
    });
  }

  async function onPreviewSummary() {
    if (!summaryResult) return;
    try {
      const tab = await getActiveTab();
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showSummaryModal',
        content: summaryResult
      });
    } catch {
      setSummaryPreviewOpen(true);
    }
  }

  function onDownload() {
    if (!summaryResult) {
      showStatus('请先生成总结内容', 'error', false);
      setTimeout(() => hideStatus(), 2000);
      return;
    }
    downloadMarkdown(summaryResult, showStatus, hideStatus);
  }

  async function onOpenSettings() {
    // 优先尝试在页面中打开设置弹窗（与之前实现一致）
    try {
      const tab = await getActiveTab();
      await chrome.tabs.sendMessage(tab.id, {
        action: 'showSettingsModal'
      });
    } catch {
      // 如果 content script 不可用，则在 popup 内部打开设置
      setSettingsModalOpen(true);
    }
  }

  function onCloseSettings() {
    setSettingsModalOpen(false);
  }

  function onSettingsChange(patch) {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }

  async function onSaveSettings() {
    const normalizedSummaryLength = parseInt(settingsState.summaryLength, 10) || 1000;
    const newConfig = {
      ...apiConfig,
      apiKey: settingsState.apiKey.trim(),
      enableThinking: settingsState.enableThinking,
      useAPI: settingsState.useAPI,
      contentType: settingsState.contentType
    };

    await saveSettingsToStorage({
      apiKey: newConfig.apiKey,
      summaryLength: normalizedSummaryLength,
      enableThinking: newConfig.enableThinking,
      useAPI: newConfig.useAPI,
      contentType: newConfig.contentType
    });

    setApiConfig(newConfig);
    setSummaryLength(normalizedSummaryLength);

    showStatus('设置已保存', 'success', false);
    setTimeout(() => hideStatus(), 2000);
    setSettingsModalOpen(false);
  }

  async function checkCachedContent() {
    try {
      const tab = await getActiveTab();
      // 1. 恢复已缓存的总结结果（如果有）
      const summaryResp = await chrome.tabs.sendMessage(tab.id, { action: 'getCachedSummary' });
      if (summaryResp && summaryResp.success && summaryResp.summary) {
        setSummaryResult(summaryResp.summary);
        window.summaryContent = summaryResp.summary;
      }

      // 2. 如果之前只缓存了“待总结的内容”，则自动触发一次总结
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCachedContent' });
      if (response && response.success && response.content) {
        showStatus(`自动总结之前选中的内容（${response.content.length} 字符）...`, 'info', true);
        await chrome.tabs.sendMessage(tab.id, { action: 'clearCachedContent' });
        setTimeout(() => {
          withBusy(() => summarizeContent(response.content));
        }, 500);
      }
    } catch {
      // content script 未加载时忽略
    }
  }

  return {
    ui,
    status,
    handlers: {
      onStartSelection,
      onCancelSelection,
      onSummarizePage,
      onPreviewSummary,
      onDownload,
      onOpenSettings,
      onCloseSettings,
      onSettingsChange,
      onSaveSettings,
      onCloseSummaryPreview: () => setSummaryPreviewOpen(false),
    },
    modals: {
      settingsOpen: settingsModalOpen,
      settings: settingsState,
      summaryPreviewOpen,
      summaryResult,
    },
  };
}

