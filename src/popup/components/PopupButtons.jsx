import React from 'react';

export function PopupButtons({ ui, handlers }) {
  const {
    isSelectionMode,
    hasSelectedContent,
    hasSummary,
    canDownload,
  } = ui;

  return (
    <div className="button-container">
      {!isSelectionMode && (
        <button
          className="btn btn-primary"
          onClick={handlers.onSummarizePage}
          disabled={ui.isBusy}
          type="button"
        >
          总结当前网页内容
        </button>
      )}

      {!isSelectionMode && (
        <button
          className="btn btn-secondary"
          onClick={handlers.onStartSelection}
          disabled={ui.isBusy}
          type="button"
        >
          选择元素进行总结
        </button>
      )}

      {isSelectionMode && (
        <button
          className="btn btn-secondary cancel-btn"
          onClick={handlers.onCancelSelection}
          type="button"
        >
          取消选择
        </button>
      )}

      {hasSelectedContent && (
        <button
          className="btn btn-preview"
          onClick={handlers.onPreviewSelected}
          type="button"
        >
          预览选中的内容
        </button>
      )}

      {hasSummary && (
        <button
          className="btn btn-preview"
          onClick={handlers.onPreviewSummary}
          type="button"
        >
          预览总结结果
        </button>
      )}

      {canDownload && (
        <button
          className="btn btn-success"
          onClick={handlers.onDownload}
          type="button"
        >
          下载为 .md 文件
        </button>
      )}
    </div>
  );
}

