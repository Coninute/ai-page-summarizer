import React from 'react';

export function SettingsModal({ isOpen, onClose, settings, onChange, onSave }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">设置</span>
          <span className="modal-close" onClick={onClose}>
            &times;
          </span>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="apiKey">
                ModelScope API Key
              </label>
              <input
                id="apiKey"
                className="form-input"
                type="text"
                placeholder="输入您的 ModelScope API Key"
                value={settings.apiKey}
                onChange={(e) => onChange({ apiKey: e.target.value })}
              />
              <div className="form-hint">用于调用 ModelScope API 进行 AI 总结</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="summaryLength">
                总结字数
              </label>
              <input
                id="summaryLength"
                className="form-input"
                type="number"
                placeholder="1000"
                min={100}
                max={8000}
                step={50}
                value={settings.summaryLength}
                onChange={(e) => onChange({ summaryLength: e.target.value })}
              />
              <div className="form-hint">控制总结结果的大致字数（默认 1000 字）</div>
            </div>

            <div className="form-checkbox">
              <input
                id="enableThinking"
                type="checkbox"
                checked={settings.enableThinking}
                onChange={(e) => onChange({ enableThinking: e.target.checked })}
              />
              <label htmlFor="enableThinking">启用思考过程（增加推理步骤）</label>
            </div>

            <div className="form-checkbox">
              <input
                id="useAPI"
                type="checkbox"
                checked={settings.useAPI}
                onChange={(e) => onChange({ useAPI: e.target.checked })}
              />
              <label htmlFor="useAPI">启用 API 总结（如关闭则使用本地模拟）</label>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contentType">
                生成内容类型
              </label>
              <select
                id="contentType"
                className="form-input"
                value={settings.contentType}
                onChange={(e) => onChange({ contentType: e.target.value })}
              >
                <option value="summary">总结</option>
                <option value="blog">博客</option>
                <option value="article">文章</option>
                <option value="report">报告</option>
                <option value="bulletpoints">要点列表</option>
              </select>
              <div className="form-hint">选择 AI 生成内容的类型</div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                取消
              </button>
              <button type="submit" className="btn btn-primary">
                保存设置
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

