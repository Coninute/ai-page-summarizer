import React from 'react';

export function PreviewModal({ isOpen, title, content, markdown = false, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <span className="modal-close" onClick={onClose}>
            &times;
          </span>
        </div>
        <div className="modal-body">
          <div className={`modal-text ${markdown ? 'markdown-content' : ''}`}>
            {content || '暂无内容'}
          </div>
        </div>
      </div>
    </div>
  );
}

