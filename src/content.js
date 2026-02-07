import { marked } from 'marked';

console.log('网页内容总结助手已加载');

// 存储选中的元素
let selectedElement = null;

// 缓存选中的内容（当 popup 关闭时使用）
let cachedContent = null;
let cachedTimestamp = null;

// 缓存总结结果（与页面生命周期绑定）
let cachedSummary = null;
let cachedSummaryTimestamp = null;

// 创建选择提示框
let selectionBox = null;

// 标记选择模式是否激活
let isSelectionActive = false;

// 存储当前悬停的元素
let hoveredElement = null;

// 存储上次点击的时间（用于双击检测）
let lastClickTime = 0;
const DOUBLE_CLICK_DELAY = 300; // 双击延迟时间（毫秒）

// 存储状态提示框
let statusBox = null;

// 存储页面级弹窗元素
let pageSelectedModal = null;
let pageSummaryModal = null;
let pageSettingsModal = null;

function createStatusBox() {
  if (statusBox) return;
  try {
    statusBox = document.createElement('div');
    statusBox.id = 'web-summarizer-status-box';
    statusBox.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 13px;
      font-weight: 500;
      z-index: 2147483646;
      cursor: default;
      user-select: none;
      transition: all 0.3s ease;
      max-width: 400px;
      text-align: center;
    `;
    statusBox.textContent = '请悬停在元素上，单击即可直接总结';
    document.body.appendChild(statusBox);
  } catch (error) {
    console.error('创建状态提示框失败:', error);
  }
}

function updateStatusBox(message, type = 'info') {
  if (!statusBox) return;
  try {
    statusBox.textContent = message;
    switch (type) {
      case 'success':
        statusBox.style.background = 'rgba(39, 174, 96, 0.9)';
        break;
      case 'error':
        statusBox.style.background = 'rgba(231, 76, 60, 0.9)';
        break;
      case 'warning':
        statusBox.style.background = 'rgba(241, 196, 15, 0.9)';
        statusBox.style.color = '#333';
        break;
      default:
        statusBox.style.background = 'rgba(0, 0, 0, 0.85)';
        statusBox.style.color = 'white';
    }
  } catch (error) {
    console.error('更新状态提示框失败:', error);
  }
}

function removeStatusBox() {
  if (statusBox) {
    try {
      statusBox.remove();
    } catch (error) {
      console.error('移除状态提示框失败:', error);
    }
    statusBox = null;
  }
}

// 在页面顶部短暂显示状态提示
function showTransientStatus(message, type = 'info', duration = 3000) {
  createStatusBox();
  updateStatusBox(message, type);
  if (duration > 0) {
    setTimeout(() => {
      removeStatusBox();
    }, duration);
  }
}

function createSelectionBox() {
  if (selectionBox) return;
  try {
    const container = document.createElement('div');
    container.id = 'web-summarizer-selection-box';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: #333;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 -2px 8px rgba(100, 181, 246, 0.2);
      border: 1px solid #e3f2fd;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      cursor: pointer;
      user-select: none;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 300px;
    `;

    const textElement = document.createElement('div');
    textElement.textContent = '悬停选择元素，单击即可总结';
    textElement.style.cssText = `
      text-align: center;
      font-size: 14px;
      line-height: 1.4;
      font-weight: 600;
      color: #64b5f6;
    `;
    container.appendChild(textElement);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: center;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: transparent;
      border: none;
      color: #90a4ae;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.8;
      padding: 0 5px;
      transition: opacity 0.2s ease;
    `;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      stopSelection();
    });
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.opacity = '1';
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.opacity = '0.8';
    });
    buttonContainer.appendChild(closeButton);

    container.appendChild(buttonContainer);
    document.body.appendChild(container);
    selectionBox = container;
  } catch (error) {
    console.error('创建选择提示框失败:', error);
  }
}

function removeSelectionBox() {
  if (selectionBox) {
    try {
      selectionBox.remove();
    } catch (error) {
      console.error('移除选择提示框失败:', error);
    }
    selectionBox = null;
  }
}

function highlightElement(element) {
  if (!element) return;
  try {
    document.querySelectorAll('.web-summarizer-highlight').forEach((el) => {
      el.classList.remove('web-summarizer-highlight');
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
    element.classList.add('web-summarizer-highlight');
    element.style.outline = '3px solid #667eea';
    element.style.outlineOffset = '2px';
  } catch (error) {
    console.error('高亮元素失败:', error);
  }
}

function removeHighlight() {
  try {
    document.querySelectorAll('.web-summarizer-highlight').forEach((el) => {
      el.classList.remove('web-summarizer-highlight');
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  } catch (error) {
    console.error('移除高亮失败:', error);
  }
}

function startSelection() {
  console.log('开始元素选择模式');
  if (isSelectionActive) return;
  try {
    createSelectionBox();
    createStatusBox();
    updateStatusBox('请悬停在元素上，单击即可直接总结', 'info');
    document.body.addEventListener('mouseover', handleMouseOver, true);
    document.body.addEventListener('mouseout', handleMouseOut, true);
    document.body.addEventListener('click', handleClick, true);
    isSelectionActive = true;
  } catch (error) {
    console.error('启动选择模式失败:', error);
    stopSelection();
  }
}

function stopSelection() {
  console.log('停止元素选择模式');
  if (!isSelectionActive) return;
  try {
    removeSelectionBox();
    removeStatusBox();
    removeHighlight();
    document.body.removeEventListener('mouseover', handleMouseOver, true);
    document.body.removeEventListener('mouseout', handleMouseOut, true);
    document.body.removeEventListener('click', handleClick, true);
    isSelectionActive = false;
  } catch (error) {
    console.error('停止选择模式失败:', error);
  }
}

function handleMouseOver(e) {
  if (e.target.id === 'web-summarizer-selection-box' || e.target.closest('#web-summarizer-selection-box')) {
    return;
  }
  try {
    hoveredElement = e.target;
    highlightElement(hoveredElement);
    const text = hoveredElement.innerText || hoveredElement.textContent || '';
    const tagName = hoveredElement.tagName.toLowerCase();
    const className = hoveredElement.className || '';
    const textPreview = text.length > 50 ? `${text.substring(0, 50)}...` : text;

    let statusMessage = `已选中: <${tagName}>`;
    if (className) {
      statusMessage += ` .${className.split(' ')[0]}`;
    }
    statusMessage += ` - "${textPreview}"`;
    statusMessage += '\n单击即可直接总结';

    updateStatusBox(statusMessage, 'info');

    try {
      chrome.runtime.sendMessage(
        {
          action: 'elementPreview',
          content: text
        },
        () => {
          if (chrome.runtime.lastError) {
            console.log('popup 已关闭，不显示预览');
          }
        }
      );
    } catch (err) {
      console.log('发送预览消息失败:', err);
    }
  } catch (error) {
    console.error('处理鼠标悬停失败:', error);
  }
}

function handleMouseOut(e) {
  if (e.target.id === 'web-summarizer-selection-box' || e.target.closest('#web-summarizer-selection-box')) {
    return;
  }
  try {
    try {
      e.target.style.outline = '';
      e.target.style.outlineOffset = '';
    } catch {
      // ignore
    }
  } catch (error) {
    console.error('处理鼠标移出失败:', error);
  }
}

function handleClick(e) {
  if (e.target.id === 'web-summarizer-selection-box' || e.target.closest('#web-summarizer-selection-box')) {
    return;
  }
  try {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const elementToUse = hoveredElement || e.target;
    if (elementToUse) {
      selectedElement = elementToUse;
    }
    confirmSelection();
  } catch (error) {
    console.error('处理点击事件失败:', error);
    updateStatusBox('处理点击失败，请重试', 'error');
  }
}

function confirmSelection() {
  try {
    if (!selectedElement) {
      updateStatusBox('请先悬停在元素上', 'error');
      return;
    }
    const content = extractContentFromElement(selectedElement);
    if (!content || content.length < 10) {
      updateStatusBox('选中的内容太短，请选择其他元素', 'error');
      return;
    }
    updateStatusBox(`正在总结 ${content.length} 个字符的内容...`, 'info');
    stopSelection();
    setTimeout(() => {
      try {
        chrome.runtime.sendMessage(
          {
            action: 'elementSelected',
            content
          },
          (response) => {
            if (chrome.runtime.lastError) {
              // popup 当前没有打开，无法立即处理消息（只缓存，不再在控制台输出警告）
              cachedContent = content;
              cachedTimestamp = Date.now();
              // 不再尝试在内容脚本中调用 chrome.action.openPopup（该 API 在此环境不被支持）
              // 仅给出友好提示，提示用户手动点击扩展图标
              createStatusBox();
              updateStatusBox('✓ 内容已选中，请点击右上角插件图标查看总结', 'info');
              setTimeout(() => removeStatusBox(), 5000);
            } else {
              cachedContent = null;
              cachedTimestamp = null;
              if (statusBox) {
                updateStatusBox('总结请求已发送，请查看弹窗', 'success');
              }
            }
          }
        );
      } catch (error) {
        console.error('发送消息出错:', error);
        // 发送失败，同样缓存内容，并提示用户手动打开插件
        cachedContent = content;
        cachedTimestamp = Date.now();
        createStatusBox();
        updateStatusBox('✓ 内容已选中，请点击右上角插件图标查看总结', 'info');
        setTimeout(() => removeStatusBox(), 5000);
      }
    }, 100);
  } catch (error) {
    console.error('确认选择失败:', error);
    updateStatusBox('确认选择失败，请重试', 'error');
    stopSelection();
  }
}

function extractContentFromElement(element) {
  try {
    let text = element.innerText || element.textContent || '';
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    return text;
  } catch (error) {
    console.error('提取内容失败:', error);
    return '';
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ success: true, message: 'pong' });
  } else if (request.action === 'startSelection') {
    startSelection();
    sendResponse({ success: true });
  } else if (request.action === 'stopSelection') {
    stopSelection();
    sendResponse({ success: true });
  } else if (request.action === 'extractContent') {
    if (selectedElement) {
      const content = extractContentFromElement(selectedElement);
      sendResponse({ success: true, content });
    } else {
      sendResponse({ success: false, error: '没有选中的元素' });
    }
  } else if (request.action === 'getCachedContent') {
    if (cachedContent) {
      sendResponse({
        success: true,
        content: cachedContent,
        timestamp: cachedTimestamp
      });
    } else {
      sendResponse({ success: false, error: '没有缓存的内容' });
    }
  } else if (request.action === 'clearCachedContent') {
    cachedContent = null;
    cachedTimestamp = null;
    sendResponse({ success: true });
  } else if (request.action === 'cacheSummary') {
    // 缓存总结结果
    cachedSummary = request.summary || '';
    cachedSummaryTimestamp = Date.now();
    sendResponse({ success: true });
  } else if (request.action === 'getCachedSummary') {
    if (cachedSummary) {
      sendResponse({
        success: true,
        summary: cachedSummary,
        timestamp: cachedSummaryTimestamp,
      });
    } else {
      sendResponse({ success: false, error: '没有缓存的总结结果' });
    }
  } else if (request.action === 'clearCachedSummary') {
    cachedSummary = null;
    cachedSummaryTimestamp = null;
    sendResponse({ success: true });
  } else if (request.action === 'showSelectedModal') {
    showPageSelectedModal(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'showSummaryModal') {
    showPageSummaryModal(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'showSettingsModal') {
    showPageSettingsModal();
    sendResponse({ success: true });
  } else if (request.action === 'showPageStatus') {
    const { message, type, duration } = request;
    showTransientStatus(message, type || 'info', typeof duration === 'number' ? duration : 3000);
    sendResponse({ success: true });
  }
  return true;
});

function lockPageScroll() {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
}

function tryUnlockPageScroll() {
  const selectedOpen = pageSelectedModal && pageSelectedModal.style.display === 'flex';
  const summaryOpen = pageSummaryModal && pageSummaryModal.style.display === 'flex';
  const settingsOpen = pageSettingsModal && pageSettingsModal.style.display === 'flex';
  if (!selectedOpen && !summaryOpen && !settingsOpen) {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

function createPageModals() {
  if (pageSelectedModal && pageSummaryModal && pageSettingsModal) return;
  try {
    if (!pageSelectedModal) {
      pageSelectedModal = document.createElement('div');
      pageSelectedModal.id = 'web-summarizer-selected-modal';
      pageSelectedModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2147483645;
      `;
      pageSelectedModal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 4px 20px rgba(100, 181, 246, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #64b5f6; border-bottom: 1px solid #e3f2fd;">
            <span style="font-size: 16px; font-weight: 600; color: white;">选中的内容预览</span>
            <span id="web-summarizer-close-selected-modal" style="font-size: 24px; color: rgba(255, 255, 255, 0.9); cursor: pointer; line-height: 1; user-select: none;">&times;</span>
          </div>
          <div id="web-summarizer-selected-content" style="padding: 20px; max-height: calc(80vh - 70px); overflow-y: auto; font-size: 14px; color: #555; line-height: 1.6; word-wrap: break-word; white-space: pre-wrap;"></div>
        </div>
      `;
      document.body.appendChild(pageSelectedModal);
      pageSelectedModal
        .querySelector('#web-summarizer-close-selected-modal')
        .addEventListener('click', () => {
          pageSelectedModal.style.display = 'none';
          tryUnlockPageScroll();
        });
      pageSelectedModal.addEventListener('click', (e) => {
        if (e.target === pageSelectedModal) {
          pageSelectedModal.style.display = 'none';
          tryUnlockPageScroll();
        }
      });
    }

    if (!pageSummaryModal) {
      pageSummaryModal = document.createElement('div');
      pageSummaryModal.id = 'web-summarizer-summary-modal';
      pageSummaryModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2147483645;
      `;
      pageSummaryModal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 4px 20px rgba(100, 181, 246, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #64b5f6; border-bottom: 1px solid #e3f2fd;">
            <span style="font-size: 16px; font-weight: 600; color: white;">总结结果预览</span>
            <span id="web-summarizer-close-summary-modal" style="font-size: 24px; color: rgba(255, 255, 255, 0.9); cursor: pointer; line-height: 1; user-select: none;">&times;</span>
          </div>
          <div id="web-summarizer-summary-content" class="web-summarizer-md-body" style="padding: 20px; max-height: calc(80vh - 70px); overflow-y: auto; font-size: 14px; color: #555; line-height: 1.6; word-wrap: break-word;"></div>
        </div>
      `;
      document.body.appendChild(pageSummaryModal);
      pageSummaryModal
        .querySelector('#web-summarizer-close-summary-modal')
        .addEventListener('click', () => {
          pageSummaryModal.style.display = 'none';
          tryUnlockPageScroll();
        });
      pageSummaryModal.addEventListener('click', (e) => {
        if (e.target === pageSummaryModal) {
          pageSummaryModal.style.display = 'none';
          tryUnlockPageScroll();
        }
      });
    }

    if (!pageSettingsModal) {
      pageSettingsModal = document.createElement('div');
      pageSettingsModal.id = 'web-summarizer-settings-modal';
      pageSettingsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2147483645;
      `;
      pageSettingsModal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; box-shadow: 0 4px 20px rgba(100, 181, 246, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #64b5f6; border-bottom: 1px solid #e3f2fd;">
            <span style="font-size: 16px; font-weight: 600; color: white;">设置</span>
            <span id="web-summarizer-close-settings-modal" style="font-size: 24px; color: rgba(255, 255, 255, 0.9); cursor: pointer; line-height: 1; user-select: none;">&times;</span>
          </div>
          <div style="padding: 20px; max-height: calc(80vh - 70px); overflow-y: auto;">
            <form id="web-summarizer-settings-form">
              <div style="margin-bottom: 20px;">
                <label for="web-summarizer-apiKey" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">ModelScope API Key</label>
                <input type="text" id="web-summarizer-apiKey" style="width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; color: #333; font-family: inherit; transition: border-color 0.2s ease;" placeholder="输入您的 ModelScope API Key">
                <div style="margin-top: 6px; font-size: 12px; color: #90a4ae;">用于调用 ModelScope API 进行 AI 总结</div>
              </div>
              <div style="margin-bottom: 20px;">
                <label for="web-summarizer-summaryLength" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">总结字数</label>
                <input type="number" id="web-summarizer-summaryLength" style="width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; color: #333; font-family: inherit; transition: border-color 0.2s ease;" placeholder="1000" min="100" max="2000" step="50">
                <div style="margin-top: 6px; font-size: 12px; color: #90a4ae;">控制总结结果的大致字数（默认 1000 字）</div>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" id="web-summarizer-enableThinking" checked>
                  <span style="font-size: 14px; color: #333;">启用思考过程（增加推理步骤）</span>
                </label>
              </div>
              <div style="margin-bottom: 24px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" id="web-summarizer-useAPI" checked>
                  <span style="font-size: 14px; color: #333;">启用 API 总结（如关闭则使用本地模拟）</span>
                </label>
              </div>
              <div style="margin-bottom: 24px;">
                <label for="web-summarizer-contentType" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">生成内容类型</label>
                <select id="web-summarizer-contentType" style="width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; color: #333; font-family: inherit; transition: border-color 0.2s ease;">
                  <option value="summary">总结</option>
                  <option value="blog">博客</option>
                  <option value="article">文章</option>
                  <option value="report">报告</option>
                  <option value="bulletpoints">要点列表</option>
                </select>
                <div style="margin-top: 6px; font-size: 12px; color: #90a4ae;">选择 AI 生成内容的类型</div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button type="button" id="web-summarizer-cancel-settings" style="background: #90a4ae; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background-color 0.2s ease;">取消</button>
                <button type="submit" id="web-summarizer-save-settings" style="background: #64b5f6; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background-color 0.2s ease;">保存设置</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(pageSettingsModal);
      pageSettingsModal
        .querySelector('#web-summarizer-close-settings-modal')
        .addEventListener('click', () => {
          pageSettingsModal.style.display = 'none';
          tryUnlockPageScroll();
        });
      pageSettingsModal.addEventListener('click', (e) => {
        if (e.target === pageSettingsModal) {
          pageSettingsModal.style.display = 'none';
          tryUnlockPageScroll();
        }
      });
      const settingsForm = pageSettingsModal.querySelector('#web-summarizer-settings-form');
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        savePageSettings();
      });
      pageSettingsModal
        .querySelector('#web-summarizer-cancel-settings')
        .addEventListener('click', () => {
          pageSettingsModal.style.display = 'none';
          tryUnlockPageScroll();
        });
      loadPageSettings();
    }
  } catch (error) {
    console.error('创建页面级弹窗失败:', error);
  }
}

function showPageSelectedModal(content) {
  try {
    createPageModals();
    const contentEl = document.getElementById('web-summarizer-selected-content');
    if (contentEl) {
      contentEl.textContent = content || '暂无内容';
    }
    pageSelectedModal.style.display = 'flex';
    lockPageScroll();
  } catch (error) {
    console.error('显示选中的内容弹窗失败:', error);
  }
}

function showPageSummaryModal(content) {
  try {
    createPageModals();
    injectSummaryMarkdownStyles();
    const contentEl = document.getElementById('web-summarizer-summary-content');
    if (contentEl) {
      contentEl.innerHTML = marked.parse(content || '暂无内容');
    }
    pageSummaryModal.style.display = 'flex';
    lockPageScroll();
  } catch (error) {
    console.error('显示总结结果弹窗失败:', error);
  }
}

function injectSummaryMarkdownStyles() {
  if (document.getElementById('web-summarizer-md-styles')) return;
  const style = document.createElement('style');
  style.id = 'web-summarizer-md-styles';
  style.textContent = `
    .web-summarizer-md-body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .web-summarizer-md-body p { margin: 0 0 0.75em; }
    .web-summarizer-md-body p:last-child { margin-bottom: 0; }
    .web-summarizer-md-body h1 { font-size: 1.35em; margin: 0.8em 0 0.4em; font-weight: 600; color: #333; }
    .web-summarizer-md-body h2 { font-size: 1.2em; margin: 0.7em 0 0.35em; font-weight: 600; color: #333; }
    .web-summarizer-md-body h3 { font-size: 1.05em; margin: 0.6em 0 0.3em; font-weight: 600; color: #444; }
    .web-summarizer-md-body ul, .web-summarizer-md-body ol { margin: 0.5em 0; padding-left: 1.5em; }
    .web-summarizer-md-body li { margin: 0.25em 0; }
    .web-summarizer-md-body pre { background: #f5f5f5; border-radius: 6px; padding: 12px; overflow-x: auto; margin: 0.5em 0; font-size: 13px; }
    .web-summarizer-md-body code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: Consolas, Monaco, monospace; }
    .web-summarizer-md-body pre code { background: none; padding: 0; }
    .web-summarizer-md-body a { color: #64b5f6; text-decoration: none; }
    .web-summarizer-md-body a:hover { text-decoration: underline; }
  `;
  document.head.appendChild(style);
}

function loadPageSettings() {
  chrome.storage.sync.get(
    {
      apiKey: 'ms-fdef09ef-0e3a-4e86-ab5e-53e7a5a1296c',
      summaryLength: 1000,
      enableThinking: true,
      useAPI: true,
      contentType: 'summary'
    },
    (items) => {
      const apiKeyInput = document.getElementById('web-summarizer-apiKey');
      const summaryLengthInput = document.getElementById('web-summarizer-summaryLength');
      const enableThinkingCheckbox = document.getElementById('web-summarizer-enableThinking');
      const useAPICheckbox = document.getElementById('web-summarizer-useAPI');
      const contentTypeSelect = document.getElementById('web-summarizer-contentType');

      if (apiKeyInput) apiKeyInput.value = items.apiKey;
      if (summaryLengthInput) summaryLengthInput.value = items.summaryLength;
      if (enableThinkingCheckbox) enableThinkingCheckbox.checked = items.enableThinking;
      if (useAPICheckbox) useAPICheckbox.checked = items.useAPI;
      if (contentTypeSelect) contentTypeSelect.value = items.contentType;
    }
  );
}

function savePageSettings() {
  const apiKeyInput = document.getElementById('web-summarizer-apiKey');
  const summaryLengthInput = document.getElementById('web-summarizer-summaryLength');
  const enableThinkingCheckbox = document.getElementById('web-summarizer-enableThinking');
  const useAPICheckbox = document.getElementById('web-summarizer-useAPI');
  const contentTypeSelect = document.getElementById('web-summarizer-contentType');

  if (!apiKeyInput || !summaryLengthInput || !enableThinkingCheckbox || !useAPICheckbox || !contentTypeSelect) {
    console.error('设置表单元素未找到');
    return;
  }

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    summaryLength: parseInt(summaryLengthInput.value, 10) || 1000,
    enableThinking: enableThinkingCheckbox.checked,
    useAPI: useAPICheckbox.checked,
    contentType: contentTypeSelect.value
  };

  chrome.storage.sync.set(settings, () => {
    if (pageSettingsModal) {
      pageSettingsModal.style.display = 'none';
      tryUnlockPageScroll();
    }
    createStatusBox();
    updateStatusBox('设置已保存', 'success');
    setTimeout(() => removeStatusBox(), 2000);
  });
}

function showPageSettingsModal() {
  try {
    createPageModals();
    loadPageSettings();
    pageSettingsModal.style.display = 'flex';
    lockPageScroll();
  } catch (error) {
    console.error('显示设置弹窗失败:', error);
  }
}

