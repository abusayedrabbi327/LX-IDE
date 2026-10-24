import React, { useState } from 'react';
import { Plus, RotateCcw, Clock } from 'lucide-react';

export interface SnapshotItem {
  id: string;
  timestamp: number;
  date: string;
  description: string;
  filesCount: number;
}

interface SnapshotsPanelProps {
  snapshots: SnapshotItem[];
  onCreateSnapshot: (description: string) => void;
  onRestoreSnapshot: (id: string) => void;
  loading: boolean;
}

export const SnapshotsPanel: React.FC<SnapshotsPanelProps> = ({
  snapshots,
  onCreateSnapshot,
  onRestoreSnapshot,
  loading
}) => {
  const [desc, setDesc] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (desc.trim()) {
      onCreateSnapshot(desc.trim());
      setDesc('');
      setShowInput(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        <span>Snapshots & History</span>
        <button
          className="btn-icon"
          onClick={() => setShowInput(!showInput)}
          title="Create Checkpoint Snapshot"
        >
          <Plus size={14} />
        </button>
      </div>

      {showInput && (
        <form onSubmit={handleSubmit} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            type="text"
            className="form-input"
            autoFocus
            placeholder="Checkpoint label (e.g. 'Before Section 3 rewrite')..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ fontSize: '11px', width: '100%' }}
          />
        </form>
      )}

      <div className="sidebar-content" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {snapshots.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No snapshots recorded yet. Create one before significant revisions.
          </div>
        ) : (
          snapshots.map((s) => (
            <div
              key={s.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {s.description}
                </span>
                <button
                  className="btn-icon"
                  style={{ padding: '4px 6px', gap: '4px', fontSize: '11px' }}
                  onClick={() => {
                    if (confirm(`Restore project to "${s.description}"? A safety snapshot of current files will be taken first.`)) {
                      onRestoreSnapshot(s.id);
                    }
                  }}
                  title="Rollback to this snapshot"
                  disabled={loading}
                >
                  <RotateCcw size={12} />
                  <span>Revert</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10.5px', color: 'var(--text-subtle)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} /> {s.date}
                </span>
                <span>{s.filesCount} files</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
