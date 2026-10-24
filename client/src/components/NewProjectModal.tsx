import React, { useState, useEffect } from 'react';
import { X, FolderPlus, BookOpen, Layers, FileText, Briefcase } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  initialTemplate?: string;
  onClose: () => void;
  onCreated: (projectName: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  initialTemplate = 'article',
  onClose,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState(initialTemplate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTemplate(initialTemplate || 'article');
      setName('');
      setError(null);
    }
  }, [isOpen, initialTemplate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), template })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      onCreated(data.project.name);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const templatesList = [
    {
      id: 'blank',
      name: 'Blank Project',
      desc: 'Minimal empty LaTeX document ready for custom packages and structure.',
      icon: <FileText size={16} color="#10b981" />
    },
    {
      id: 'article',
      name: 'Standard Academic Article',
      desc: 'Complete paper with abstract, equations, sections, BibTeX citations, and table benchmarks.',
      icon: <BookOpen size={16} color="#6366f1" />
    },
    {
      id: 'ieee',
      name: 'IEEE Two-Column Format',
      desc: 'Standard conference & transactions format with multi-author blocks and IEEEtran styling.',
      icon: <Layers size={16} color="#06b6d4" />
    },
    {
      id: 'cv',
      name: 'Curriculum Vitae / Resume',
      desc: 'Clean 1-page modern academic/professional CV format.',
      icon: <Briefcase size={16} color="#f59e0b" />
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} color="#10b981" />
            <span className="modal-title">New LaTeX Project</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Project / Manuscript Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. My_Research_Paper"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Starter Template</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {templatesList.map(t => {
                  const isSelected = template === t.id;
                  return (
                    <div
                      key={t.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'var(--transition-fast)'
                      }}
                      onClick={() => setTemplate(t.id)}
                    >
                      <div style={{ marginTop: 2 }}>{t.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Initialize Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
