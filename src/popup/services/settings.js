/** 未配置时的占位符，用于判断是否已填写真实 Key */
export const API_KEY_PLACEHOLDER = 'YOUR_API_KEY_HERE';

/** 是否为有效且已配置的 API Key（非空、非占位符） */
export function isValidApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length > 0 && trimmed !== API_KEY_PLACEHOLDER;
}

export function createApiConfig() {
  return {
    useAPI: true,
    apiUrl: 'https://api-inference.modelscope.cn/v1/chat/completions',
    apiKey: API_KEY_PLACEHOLDER,
    model: 'deepseek-ai/DeepSeek-V3.2',
    enableThinking: true,
    contentType: 'summary',
    timeout: 60000
  };
}

export function loadSettingsFromStorage(defaultConfig) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        apiKey: defaultConfig.apiKey,
        summaryLength: 1000,
        enableThinking: defaultConfig.enableThinking,
        useAPI: defaultConfig.useAPI,
        contentType: defaultConfig.contentType
      },
      (items) => {
        const config = {
          ...defaultConfig,
          apiKey: items.apiKey,
          enableThinking: items.enableThinking,
          useAPI: items.useAPI,
          contentType: items.contentType
        };
        resolve({ config, length: items.summaryLength });
      }
    );
  });
}

export function saveSettingsToStorage(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => resolve());
  });
}

