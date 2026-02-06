import React from 'react';
import { PopupHeader } from './components/PopupHeader';
import { PopupButtons } from './components/PopupButtons';
import { SettingsModal } from './components/SettingsModal';
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
    </div>
  );
}

