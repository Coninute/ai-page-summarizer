export function downloadMarkdown(content, showStatus, hideStatus) {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  const filename = `summary_${timestamp}.md`;

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download(
    {
      url,
      filename,
      saveAs: false
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError);
        showStatus('下载失败，请重试', 'error', false);
      } else {
        showStatus('文件已下载', 'success', false);
        setTimeout(() => hideStatus(), 2000);
      }
    }
  );
}

