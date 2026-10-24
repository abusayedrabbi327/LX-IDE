import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, Key, Cpu, Globe, Terminal, FolderOpen, HardDrive } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [projectsDir, setProjectsDir] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [model, setModel] = useState('openai/gpt-6-luna');
  const [tectonicPath, setTectonicPath] = useState('bin/tectonic.exe');
  const [saving, setSaving] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [openingFolder, setOpeningFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setProjectsDir(data.projectsDir || '');
          setHasKey(data.hasApiKey);
          setBaseUrl(data.aiBaseUrl || 'https://openrouter.ai/api/v1');
          setModel(data.aiModel || 'openai/gpt-6-luna');
          setTectonicPath(data.tectonicPath || 'bin/tectonic.exe');
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenExplorer = async () => {
    setOpeningFolder(true);
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: projectsDir })
      });
    } catch (err) {
      console.error('Failed to open explorer:', err);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        projectsDir: projectsDir.trim(),
        aiBaseUrl: baseUrl,
        aiModel: model,
        tectonicPath
      };
      if (apiKey.trim()) {
        payload.aiApiKey = apiKey.trim();
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const MODEL_PRESETS = [
    { label: 'OpenAI GPT-6 Luna (OpenRouter)', value: 'openai/gpt-6-luna' },
    { label: 'GPT-4o (High-Precision Academic)', value: 'openai/gpt-4o' },
    { label: 'GPT-4o Mini (Fast & Low Cost)', value: 'openai/gpt-4o-mini' },
    { label: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
    { label: 'DeepSeek Chat V3', value: 'deepseek/deepseek-chat' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#818cf8" />
            <span className="modal-title">LX-IDE Settings & Storage Setup</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 1. SSD Storage Location */}
            <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600 }}>
                  <HardDrive size={15} color="#10b981" />
                  <span>SSD Projects Storage Directory</span>
                </label>
                <button
                  type="button"
                  className="btn-icon"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer'
                  }}
                  onClick={handleOpenExplorer}
                  title="Open this folder in Windows File Explorer"
                >
                  <FolderOpen size={13} />
                  <span>{openingFolder ? 'Opening...' : 'Open in Explorer'}</span>
                </button>
              </div>

              <input
                type="text"
                className="form-input"
                value={projectsDir}
                onChange={(e) => setProjectsDir(e.target.value)}
                placeholder="C:\Users\<user>\Documents\LX-IDE-Projects"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', width: '100%' }}
              />

              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                Your manuscripts, images, and bibliography files reside in this normal SSD folder. You can drag and drop files directly or git clone projects into it. User settings are kept permanently in <code>~/.lxide/config.json</code>.
              </div>
            </div>

            {/* 2. API Key */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Key size={12} /> OpenRouter / OpenAI API Key
                </span>
                {hasKey && <span style={{ color: '#10b981', fontSize: '11px' }}>● Key Active</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  className="form-input"
                  placeholder={hasKey ? 'Enter new key to replace...' : 'sk-or-v1-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ width: '100%', paddingRight: '36px' }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  style={{ position: 'absolute', right: 4, top: 4 }}
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                Your API key is saved locally in your user profile and is never sent to third parties.
              </span>
            </div>

            {/* 3. AI Base URL */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={12} /> API Base URL
              </label>
              <input
                type="text"
                className="form-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ fontSize: '10.5px', padding: '2px 6px', background: 'var(--bg-card)' }}
                  onClick={() => setBaseUrl('https://openrouter.ai/api/v1')}
                >
                  OpenRouter
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ fontSize: '10.5px', padding: '2px 6px', background: 'var(--bg-card)' }}
                  onClick={() => setBaseUrl('https://api.openai.com/v1')}
                >
                  Direct OpenAI
                </button>
              </div>
            </div>

            {/* 4. AI Model */}
            <div className="form-group">
              <label className="form-label">Active AI Model</label>
              <input
                type="text"
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="openai/gpt-6-luna"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {MODEL_PRESETS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className="btn-icon"
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      background: model === m.value ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                      color: model === m.value ? '#818cf8' : 'var(--text-muted)'
                    }}
                    onClick={() => setModel(m.value)}
                  >
                    {m.label.split(' (')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. LaTeX Compiler Executable */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Terminal size={12} /> Local LaTeX Engine Path
              </label>
              <input
                type="text"
                className="form-input"
                value={tectonicPath}
                onChange={(e) => setTectonicPath(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                Portable standalone Tectonic compiler bundled at <code>bin/tectonic.exe</code>.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
