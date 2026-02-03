// content.js - 内容脚本
// 这个脚本会在每个网页加载时自动注入

console.log('网页内容总结助手已加载');

// 存储选中的元素
let selectedElement = null;

// 缓存选中的内容（当 popup 关闭时使用）
let cachedContent = null;
let cachedTimestamp = null;

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

/**
 * 创建状态提示框
 */
function createStatusBox() {
  if (statusBox) return;

  try {
    statusBox = document.createElement('div');
    statusBox.id = 'web-summarizer-status-box';
    statusBox.style.cssText = `
      position: fixed;
      bottom: 30px;
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

/**
 * 更新状态提示框
 */
function updateStatusBox(message, type = 'info') {
  if (!statusBox) return;

  try {
    statusBox.textContent = message;

    // 根据类型设置不同的背景色
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

/**
 * 移除状态提示框
 */
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

/**
 * 创建选择提示框
 */
function createSelectionBox() {
  if (selectionBox) return;

  try {
    // 创建主容器
    const container = document.createElement('div');
    container.id = 'web-summarizer-selection-box';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: #333;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(100, 181, 246, 0.2);
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

    // 添加提示文本
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

    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: center;
    `;

    // 添加关闭按钮
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

/**
 * 移除选择提示框
 */
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

/**
 * 高亮元素
 */
function highlightElement(element) {
  if (!element) return;

  try {
    // 移除之前的高亮
    document.querySelectorAll('.web-summarizer-highlight').forEach(el => {
      el.classList.remove('web-summarizer-highlight');
      el.style.outline = '';
      el.style.outlineOffset = '';
    });

    // 添加新高亮
    element.classList.add('web-summarizer-highlight');
    element.style.outline = '3px solid #667eea';
    element.style.outlineOffset = '2px';
  } catch (error) {
    console.error('高亮元素失败:', error);
  }
}

/**
 * 移除所有高亮
 */
function removeHighlight() {
  try {
    document.querySelectorAll('.web-summarizer-highlight').forEach(el => {
      el.classList.remove('web-summarizer-highlight');
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  } catch (error) {
    console.error('移除高亮失败:', error);
  }
}

/**
 * 开始元素选择模式
 */
function startSelection() {
  console.log('开始元素选择模式');

  if (isSelectionActive) {
    console.log('选择模式已激活');
    return;
  }

  try {
    // 创建提示框
    createSelectionBox();

    // 创建状态提示框
    createStatusBox();
    updateStatusBox('请悬停在元素上，单击即可直接总结', 'info');

    // 添加鼠标事件监听（捕获阶段，优先级更高）
    document.body.addEventListener('mouseover', handleMouseOver, true);
    document.body.addEventListener('mouseout', handleMouseOut, true);
    document.body.addEventListener('click', handleClick, true);

    // 标记为激活状态
    isSelectionActive = true;

    console.log('选择模式已启动，等待用户操作');
  } catch (error) {
    console.error('启动选择模式失败:', error);
    stopSelection();
  }
}

/**
 * 停止元素选择模式
 */
function stopSelection() {
  console.log('停止元素选择模式');

  if (!isSelectionActive) {
    console.log('选择模式未激活');
    return;
  }

  try {
    // 移除提示框
    removeSelectionBox();

    // 移除状态提示框
    removeStatusBox();

    // 移除高亮
    removeHighlight();

    // 移除事件监听（使用捕获阶段）
    document.body.removeEventListener('mouseover', handleMouseOver, true);
    document.body.removeEventListener('mouseout', handleMouseOut, true);
    document.body.removeEventListener('click', handleClick, true);

    // 标记为非激活状态
    isSelectionActive = false;

    console.log('选择模式已停止');
  } catch (error) {
    console.error('停止选择模式失败:', error);
  }
}

/**
 * 处理鼠标悬停
 */
function handleMouseOver(e) {
  // 忽略提示框
  if (e.target.id === 'web-summarizer-selection-box' ||
      e.target.closest('#web-summarizer-selection-box')) {
    return;
  }

  try {
    // 保存当前悬停的元素
    hoveredElement = e.target;

    // 高亮元素
    highlightElement(hoveredElement);

    // 提取内容并更新状态提示框
    const text = hoveredElement.innerText || hoveredElement.textContent || '';
    const tagName = hoveredElement.tagName.toLowerCase();
    const className = hoveredElement.className || '';
    const textPreview = text.length > 50 ? text.substring(0, 50) + '...' : text;

    let statusMessage = `已选中: <${tagName}>`;
    if (className) {
      statusMessage += ` .${className.split(' ')[0]}`;
    }
    statusMessage += ` - "${textPreview}"`;
    statusMessage += '\n单击即可直接总结';

    updateStatusBox(statusMessage, 'info');

    // 发送预览消息到 popup（如果 popup 打开的话）
    try {
      chrome.runtime.sendMessage({
        action: 'elementPreview',
        content: text
      }, (response) => {
        // popup 可能关闭了，忽略错误
        if (chrome.runtime.lastError) {
          console.log('popup 已关闭，不显示预览');
        }
      });
    } catch (err) {
      console.log('发送预览消息失败:', err);
    }
  } catch (error) {
    console.error('处理鼠标悬停失败:', error);
  }
}

/**
 * 处理鼠标移出
 */
function handleMouseOut(e) {
  // 忽略提示框
  if (e.target.id === 'web-summarizer-selection-box' ||
      e.target.closest('#web-summarizer-selection-box')) {
    return;
  }

  try {
    // 移除高亮
    try {
      e.target.style.outline = '';
      e.target.style.outlineOffset = '';
    } catch (err) {
      // 忽略错误
    }
  } catch (error) {
    console.error('处理鼠标移出失败:', error);
  }
}

/**
 * 处理点击事件
 */
function handleClick(e) {
  // 忽略提示框
  if (e.target.id === 'web-summarizer-selection-box' ||
      e.target.closest('#web-summarizer-selection-box')) {
    return;
  }

  try {
    // 阻止默认行为和事件冒泡
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    console.log('========== 点击事件触发 ==========');
    console.log('当前悬停元素:', hoveredElement);
    console.log('点击目标:', e.target);

    // 使用悬停的元素或点击目标作为选中的元素
    const elementToUse = hoveredElement || e.target;
    if (elementToUse) {
      selectedElement = elementToUse;
    }

    console.log('选中的元素:', selectedElement);

    // 直接调用确认选择函数
    confirmSelection();
  } catch (error) {
    console.error('处理点击事件失败:', error);
    updateStatusBox('处理点击失败，请重试', 'error');
  }
}

/**
 * 确认选择并开始总结
 */
function confirmSelection() {
  try {
    console.log('========== confirmSelection 被调用 ==========');
    console.log('selectedElement:', selectedElement);

    if (!selectedElement) {
      console.log('没有可用的元素');
      updateStatusBox('请先悬停在元素上', 'error');
      return;
    }

    // 提取内容
    const content = extractContentFromElement(selectedElement);
    console.log('提取的内容长度:', content.length);

    if (!content || content.length < 10) {
      console.log('选中的内容太短');
      updateStatusBox('选中的内容太短，请选择其他元素', 'error');
      return;
    }

    console.log('内容提取成功，准备发送到 popup');

    // 更新状态提示
    updateStatusBox(`正在总结 ${content.length} 个字符的内容...`, 'info');

    // 先停止选择模式
    stopSelection();

    // 发送消息到 popup（稍微延迟，确保选择模式已停止）
    setTimeout(() => {
      try {
        console.log('发送消息到 popup');
        console.log('消息内容:', { action: 'elementSelected', contentLength: content.length });

        chrome.runtime.sendMessage({
          action: 'elementSelected',
          content: content
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('发送消息失败，popup 已关闭:', chrome.runtime.lastError);

            // 缓存内容
            cachedContent = content;
            cachedTimestamp = Date.now();
            console.log('内容已缓存，准备自动打开 popup');

            // 自动打开插件弹窗
            try {
              chrome.action.openPopup().then(() => {
                console.log('Popup 已自动打开');
                // 显示成功提示
                createStatusBox();
                updateStatusBox('✓ 内容已选中，正在总结...', 'success');
                setTimeout(() => removeStatusBox(), 3000);
              }).catch((err) => {
                console.error('自动打开 popup 失败:', err);
                // 如果自动打开失败，显示手动提示
                createStatusBox();
                updateStatusBox('✓ 内容已选中，请重新打开插件', 'info');
                setTimeout(() => removeStatusBox(), 5000);
              });
            } catch (popupError) {
              console.error('调用 openPopup 出错:', popupError);
              // 备用提示
              createStatusBox();
              updateStatusBox('✓ 内容已选中，请重新打开插件', 'info');
              setTimeout(() => removeStatusBox(), 5000);
            }
          } else {
            console.log('消息发送成功，响应:', response);
            // 清除缓存
            cachedContent = null;
            cachedTimestamp = null;

            // 显示成功提示（如果提示框还在的话）
            if (statusBox) {
              updateStatusBox('总结请求已发送，请查看弹窗', 'success');
            }
          }
        });
      } catch (error) {
        console.error('发送消息出错:', error);

        // 缓存内容
        cachedContent = content;
        cachedTimestamp = Date.now();

        // 尝试自动打开 popup
        try {
          chrome.action.openPopup().then(() => {
            console.log('Popup 已自动打开');
            createStatusBox();
            updateStatusBox('✓ 内容已选中，正在总结...', 'success');
            setTimeout(() => removeStatusBox(), 3000);
          }).catch((err) => {
            console.error('自动打开 popup 失败:', err);
            createStatusBox();
            updateStatusBox('✓ 内容已选中，请重新打开插件', 'info');
            setTimeout(() => removeStatusBox(), 5000);
          });
        } catch (popupError) {
          console.error('调用 openPopup 出错:', popupError);
          createStatusBox();
          updateStatusBox('✓ 内容已选中，请重新打开插件', 'info');
          setTimeout(() => removeStatusBox(), 5000);
        }
      }
    }, 100);

  } catch (error) {
    console.error('确认选择失败:', error);
    updateStatusBox('确认选择失败，请重试', 'error');
    stopSelection();
  }
}

/**
 * 从元素中提取内容
 */
function extractContentFromElement(element) {
  try {
    // 获取元素的文本内容
    let text = element.innerText || element.textContent || '';

    // 清理文本
    text = text
      .replace(/\s+/g, ' ')  // 合并空白字符
      .replace(/\n+/g, '\n')  // 合并换行
      .trim();

    return text;
  } catch (error) {
    console.error('提取内容失败:', error);
    return '';
  }
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    // 响应 ping 请求，用于检查 content script 是否已加载
    sendResponse({ success: true, message: 'pong' });
  } else if (request.action === 'startSelection') {
    // 开始选择模式
    startSelection();
    sendResponse({ success: true });
  } else if (request.action === 'stopSelection') {
    // 停止选择模式
    stopSelection();
    sendResponse({ success: true });
  } else if (request.action === 'extractContent') {
    // 提取选中的元素内容
    if (selectedElement) {
      const content = extractContentFromElement(selectedElement);
      sendResponse({ success: true, content: content });
    } else {
      sendResponse({ success: false, error: '没有选中的元素' });
    }
  } else if (request.action === 'getCachedContent') {
    // 获取缓存的内容
    console.log('popup 请求缓存内容');
    if (cachedContent) {
      console.log('返回缓存内容，长度:', cachedContent.length);
      sendResponse({
        success: true,
        content: cachedContent,
        timestamp: cachedTimestamp
      });
    } else {
      console.log('没有缓存内容');
      sendResponse({ success: false, error: '没有缓存的内容' });
    }
  } else if (request.action === 'clearCachedContent') {
    // 清除缓存的内容
    console.log('清除缓存内容');
    cachedContent = null;
    cachedTimestamp = null;
    sendResponse({ success: true });
  } else if (request.action === 'showSelectedModal') {
    // 显示选中的内容弹窗
    showPageSelectedModal(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'showSummaryModal') {
    // 显示总结结果弹窗
    showPageSummaryModal(request.content);
    sendResponse({ success: true });
  } else if (request.action === 'showSettingsModal') {
    // 显示设置弹窗
    showPageSettingsModal();
    sendResponse({ success: true });
  }

  // 返回 true 表示异步响应
  return true;
});

/**
 * 创建页面级弹窗
 */
function createPageModals() {
  // 如果已经创建，则返回
  if (pageSelectedModal && pageSummaryModal && pageSettingsModal) return;

  try {
    // 创建选中的内容弹窗
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

      // 关闭按钮事件
      pageSelectedModal.querySelector('#web-summarizer-close-selected-modal').addEventListener('click', () => {
        pageSelectedModal.style.display = 'none';
      });
      // 点击背景关闭
      pageSelectedModal.addEventListener('click', (e) => {
        if (e.target === pageSelectedModal) {
          pageSelectedModal.style.display = 'none';
        }
      });
    }

    // 创建总结结果弹窗
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
          <div id="web-summarizer-summary-content" style="padding: 20px; max-height: calc(80vh - 70px); overflow-y: auto; font-size: 14px; color: #555; line-height: 1.6; word-wrap: break-word; white-space: pre-wrap; font-family: 'Consolas', 'Monaco', 'Courier New', monospace;"></div>
        </div>
      `;
      document.body.appendChild(pageSummaryModal);

      // 关闭按钮事件
      pageSummaryModal.querySelector('#web-summarizer-close-summary-modal').addEventListener('click', () => {
        pageSummaryModal.style.display = 'none';
      });
      // 点击背景关闭
      pageSummaryModal.addEventListener('click', (e) => {
        if (e.target === pageSummaryModal) {
          pageSummaryModal.style.display = 'none';
        }
      });
    }

    // 创建设置弹窗
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
                <input type="number" id="web-summarizer-summaryLength" style="width: 100%; padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; color: #333; font-family: inherit; transition: border-color 0.2s ease;" placeholder="500" min="100" max="2000" step="50">
                <div style="margin-top: 6px; font-size: 12px; color: #90a4ae;">控制总结结果的大致字数（默认 500 字）</div>
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

      // 关闭按钮事件
      pageSettingsModal.querySelector('#web-summarizer-close-settings-modal').addEventListener('click', () => {
        pageSettingsModal.style.display = 'none';
      });
      // 点击背景关闭
      pageSettingsModal.addEventListener('click', (e) => {
        if (e.target === pageSettingsModal) {
          pageSettingsModal.style.display = 'none';
        }
      });

      // 表单提交事件
      const settingsForm = pageSettingsModal.querySelector('#web-summarizer-settings-form');
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        savePageSettings();
      });

      // 取消按钮事件
      pageSettingsModal.querySelector('#web-summarizer-cancel-settings').addEventListener('click', () => {
        pageSettingsModal.style.display = 'none';
      });

      // 加载设置
      loadPageSettings();
    }

    console.log('页面级弹窗创建成功');
  } catch (error) {
    console.error('创建页面级弹窗失败:', error);
  }
}

/**
 * 显示选中的内容弹窗
 */
function showPageSelectedModal(content) {
  try {
    createPageModals();
    const contentEl = document.getElementById('web-summarizer-selected-content');
    if (contentEl) {
      contentEl.textContent = content || '暂无内容';
    }
    pageSelectedModal.style.display = 'flex';
  } catch (error) {
    console.error('显示选中的内容弹窗失败:', error);
  }
}

/**
 * 显示总结结果弹窗
 */
function showPageSummaryModal(content) {
  try {
    createPageModals();
    const contentEl = document.getElementById('web-summarizer-summary-content');
    if (contentEl) {
      contentEl.textContent = content || '暂无内容';
    }
    pageSummaryModal.style.display = 'flex';
  } catch (error) {
    console.error('显示总结结果弹窗失败:', error);
  }
}

/**
 * 加载页面设置
 */
function loadPageSettings() {
  chrome.storage.sync.get({
    apiKey: 'ms-fdef09ef-0e3a-4e86-ab5e-53e7a5a1296c',
    summaryLength: 500,
    enableThinking: true,
    useAPI: true,
    contentType: 'summary'
  }, function(items) {
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
  });
}

/**
 * 保存页面设置
 */
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
    summaryLength: parseInt(summaryLengthInput.value) || 500,
    enableThinking: enableThinkingCheckbox.checked,
    useAPI: useAPICheckbox.checked,
    contentType: contentTypeSelect.value
  };
  
  chrome.storage.sync.set(settings, function() {
    console.log('设置已保存');
    // 隐藏弹窗
    if (pageSettingsModal) {
      pageSettingsModal.style.display = 'none';
    }
    // 显示成功提示
    createStatusBox();
    updateStatusBox('设置已保存', 'success');
    setTimeout(() => removeStatusBox(), 2000);
  });
}

/**
 * 显示设置弹窗
 */
function showPageSettingsModal() {
  try {
    createPageModals();
    // 确保加载最新设置
    loadPageSettings();
    pageSettingsModal.style.display = 'flex';
  } catch (error) {
    console.error('显示设置弹窗失败:', error);
  }
}
