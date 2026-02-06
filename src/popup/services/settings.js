export function createApiConfig() {
  return {
    useAPI: true,
    apiUrl: 'https://api-inference.modelscope.cn/v1/chat/completions',
    apiKey: 'ms-fdef09ef-0e3a-4e86-ab5e-53e7a5a1296c',
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

