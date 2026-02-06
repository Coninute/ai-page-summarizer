import React from 'react';

export function StatusBar({ status }) {
  if (!status.visible) return null;

  const { message, type, showSpinner } = status;

  return (
    <div className={`status ${type}`}>
      {showSpinner && <span className="loading" />}
      {message}
    </div>
  );
}

