import React from 'react';
import { PopupHeader } from './components/PopupHeader';
import { PopupButtons } from './components/PopupButtons';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { StatusBar } from './components/StatusBar';
import { usePopupLogic } from './hooks/usePopupLogic';

export function PopupApp() {
  const {
    ui,
    status,
    handlers,
    modals,
  } = usePopupLogic();

  return (
    <div className="popup-root">
      <PopupHeader />

      <button
        className="settings-icon-btn"
        onClick={handlers.onOpenSettings}
        type="button"
      >
        ⚙️
      </button>

      <PopupButtons
        ui={ui}
        handlers={handlers}
      />

      <StatusBar status={status} />

      <SettingsModal
        isOpen={modals.settingsOpen}
        onClose={handlers.onCloseSettings}
        settings={modals.settings}
        onChange={handlers.onSettingsChange}
        onSave={handlers.onSaveSettings}
      />

      <PreviewModal
        isOpen={modals.selectedPreviewOpen}
        title="选中的内容预览"
        content={modals.selectedContent}
        onClose={handlers.onCloseSelectedPreview}
      />

      <PreviewModal
        isOpen={modals.summaryPreviewOpen}
        title="总结结果预览"
        content={modals.summaryResult}
        markdown
        onClose={handlers.onCloseSummaryPreview}
      />
    </div>
  );
}

