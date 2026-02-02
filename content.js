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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
      color: white;
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

    // 更新状态提示框
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
  }

  // 返回 true 表示异步响应
  return true;
});
