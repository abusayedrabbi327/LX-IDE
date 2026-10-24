import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, RotateCcw, FileText, CheckCircle2, GitCompare, Eye, AlertCircle, Plus } from 'lucide-react';
import { diffLines } from 'diff';
import type { SnapshotItem } from './SnapshotsPanel';

interface HistoryWorkspaceProps {
  projectName: string;
  snapshots: SnapshotItem[];
  activeFile?: string;
  currentContent: string;
  onBackToEditor: () => void;
  onRestoreSnapshot: (id: string) => void;
  onCreateSnapshot: (description: string) => Promise<void>;
  onRefreshSnapshots: () => void;
  loading: boolean;
}

interface DiffLineItem {
  oldNum: number | null;
  newNum: number | null;
  type: 'added' | 'removed' | 'normal';
  content: string;
}

export const HistoryWorkspace: React.FC<HistoryWorkspaceProps> = ({
  projectName,
  snapshots,
  activeFile = 'main.tex',
  currentContent,
  onBackToEditor,
  onRestoreSnapshot,
  onCreateSnapshot,
  onRefreshSnapshots,
  loading
}) => {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    snapshots[0]?.id || ''
  );
  const [selectedFile, setSelectedFile] = useState<string>(activeFile || 'main.tex');
  const [snapshotContent, setSnapshotContent] = useState<string | null>(null);
  const [prevSnapshotContent, setPrevSnapshotContent] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [isCreatingSnap, setIsCreatingSnap] = useState(false);
  const [compareMode, setCompareMode] = useState<'vs_current' | 'vs_previous'>('vs_previous');

  // Trigger refresh on mount
  useEffect(() => {
    onRefreshSnapshots();
  }, []);

  // Update selected snapshot when snapshots change
  useEffect(() => {
    if (snapshots.length > 0) {
      if (!selectedSnapshotId || !snapshots.some(s => s.id === selectedSnapshotId)) {
        setSelectedSnapshotId(snapshots[0].id);
      }
    }
  }, [snapshots, selectedSnapshotId]);

  const activeSnapshotIndex = snapshots.findIndex(s => s.id === selectedSnapshotId);
  const activeSnapshot = snapshots[activeSnapshotIndex] || snapshots[0];
  const previousSnapshot = snapshots[activeSnapshotIndex + 1] || null;

  // Fetch snapshot content from backend
  useEffect(() => {
    if (!selectedSnapshotId) return;

    let isMounted = true;
    setFetchLoading(true);

    const fetchSnapshotFile = async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectName}/snapshots/${selectedSnapshotId}/file?path=${encodeURIComponent(selectedFile)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSnapshotContent(data.content);
        } else {
          if (isMounted) setSnapshotContent(null);
        }

        // If previous snapshot exists, fetch previous snapshot file too
        if (previousSnapshot) {
          const prevRes = await fetch(
            `/api/projects/${projectName}/snapshots/${previousSnapshot.id}/file?path=${encodeURIComponent(selectedFile)}`
          );
          if (prevRes.ok) {
            const prevData = await prevRes.json();
            if (isMounted) setPrevSnapshotContent(prevData.content);
          } else {
            if (isMounted) setPrevSnapshotContent(null);
          }
        } else {
          if (isMounted) setPrevSnapshotContent(null);
        }
      } catch (err) {
        console.error('Failed to load snapshot file:', err);
      } finally {
        if (isMounted) setFetchLoading(false);
      }
    };

    fetchSnapshotFile();

    return () => {
      isMounted = false;
    };
  }, [projectName, selectedSnapshotId, selectedFile, previousSnapshot?.id]);

  // Determine base and target texts for diff
  const effectiveMode = (compareMode === 'vs_previous' && previousSnapshot) ? 'vs_previous' : 'vs_current';
  let baseText = '';
  let targetText = '';

  if (effectiveMode === 'vs_previous' && previousSnapshot) {
    baseText = prevSnapshotContent ?? '';
    targetText = snapshotContent ?? '';
  } else {
    // Compare snapshot version (base) with current editor state (target)
    baseText = snapshotContent ?? '';
    targetText = currentContent;
  }

  // Calculate line diff
  const diffChunks = diffLines(baseText, targetText);
  let oldLine = 1;
  let newLine = 1;
  const renderedLines: DiffLineItem[] = [];
  let addedCount = 0;
  let removedCount = 0;

  diffChunks.forEach(chunk => {
    const rawLines = chunk.value.replace(/\r\n/g, '\n').split('\n');
    if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
      rawLines.pop();
    }

    rawLines.forEach(line => {
      if (chunk.added) {
        addedCount++;
        renderedLines.push({
          oldNum: null,
          newNum: newLine++,
          type: 'added',
          content: line
        });
      } else if (chunk.removed) {
        removedCount++;
        renderedLines.push({
          oldNum: oldLine++,
          newNum: null,
          type: 'removed',
          content: line
        });
      } else {
        renderedLines.push({
          oldNum: oldLine++,
          newNum: newLine++,
          type: 'normal',
          content: line
        });
      }
    });
  });

  const totalChanges = addedCount + removedCount;

  return (
    <div className="overleaf-history-view">
      {/* Top Header */}
      <header className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={onBackToEditor}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              paddingRight: '12px',
              borderRight: '1px solid var(--border-subtle)'
            }}
            title="Return to Editor"
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '5px',
                background: '#064e3b',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '11px',
                color: '#10b981'
              }}
            >
              LX
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff', letterSpacing: '-0.3px' }}>
              LX<span style={{ color: '#10b981' }}>-IDE</span>
            </span>
          </div>

          <button className="btn-back-editor" onClick={onBackToEditor}>
            <ArrowLeft size={15} />
            <span>Back to editor</span>
          </button>
        </div>

        <div className="history-header-center">
          <span className="history-project-title">{projectName}</span>
          <span style={{ color: 'var(--text-subtle)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {activeSnapshot ? `Viewing snapshot: ${activeSnapshot.date}` : 'Viewing Revision History'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeSnapshot && (
            <button
              className="btn btn-compile"
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
              onClick={() => {
                if (confirm(`Restore project to checkpoint "${activeSnapshot.description}"? A safety backup will be made.`)) {
                  onRestoreSnapshot(activeSnapshot.id);
                  onBackToEditor();
                }
              }}
              disabled={loading}
              title="Revert all project files to this checkpoint"
            >
              <RotateCcw size={14} /> Revert to this version
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="history-body">
        {/* Left: Files in this snapshot */}
        <aside className="history-files-sidebar">
          <div className="sidebar-header">
            <span>Snapshot Files</span>
          </div>

          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              className={`history-file-row ${selectedFile === 'main.tex' ? 'active' : ''}`}
              onClick={() => setSelectedFile('main.tex')}
            >
              <FileText size={14} color={selectedFile === 'main.tex' ? '#10b981' : 'var(--text-muted)'} />
              <span>main.tex</span>
              {totalChanges > 0 && selectedFile === 'main.tex' && (
                <span className="history-edited-badge">Edited</span>
              )}
            </div>

            <div
              className={`history-file-row ${selectedFile === 'references.bib' ? 'active' : ''}`}
              onClick={() => setSelectedFile('references.bib')}
            >
              <FileText size={14} color={selectedFile === 'references.bib' ? '#10b981' : 'var(--text-muted)'} />
              <span>references.bib</span>
            </div>
          </div>

          <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Diff Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.4)', borderRadius: '2px', display: 'inline-block' }} />
              <span>Green (+): Added in current</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(244, 63, 94, 0.4)', borderRadius: '2px', display: 'inline-block' }} />
              <span>Red (-): Removed from snapshot</span>
            </div>
          </div>
        </aside>

        {/* Center: Content Diff Area */}
        <main className="history-diff-area">
          {/* Subheader bar with comparison info & mode toggle */}
          <div className="history-diff-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedFile}</span>
              <span style={{ color: 'var(--text-subtle)' }}>•</span>
              {totalChanges > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>+{addedCount}</span>
                  <span style={{ color: '#f43f5e', fontWeight: 600 }}>-{removedCount}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({totalChanges} changes detected)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '11.5px' }}>
                  <CheckCircle2 size={13} />
                  <span>No changes vs target</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="diff-mode-toggle">
                <button
                  className={`diff-toggle-btn ${effectiveMode === 'vs_previous' ? 'active' : ''}`}
                  onClick={() => setCompareMode('vs_previous')}
                  disabled={!previousSnapshot}
                  title={previousSnapshot ? "Compare against previous version" : "No previous snapshot available"}
                >
                  <GitCompare size={13} />
                  <span>Vs Previous Version</span>
                </button>
                <button
                  className={`diff-toggle-btn ${effectiveMode === 'vs_current' ? 'active' : ''}`}
                  onClick={() => setCompareMode('vs_current')}
                  title="Compare snapshot against current live editor code"
                >
                  <Eye size={13} />
                  <span>Vs Live Editor</span>
                </button>
              </div>
            </div>
          </div>

          {/* Diff Viewer */}
          <div className="history-diff-viewport">
            {fetchLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <span>Loading snapshot diff...</span>
              </div>
            ) : snapshots.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={36} color="#10b981" style={{ opacity: 0.8 }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>No Revisions Recorded Yet</div>
                <div style={{ fontSize: '12px', maxWidth: '380px', lineHeight: 1.5 }}>
                  Every time you compile your project or save a milestone, LX-IDE automatically records a snapshot so you can view line-by-line diffs.
                </div>
                <button
                  className="btn btn-compile"
                  style={{ fontSize: '12px', padding: '8px 16px', marginTop: '6px' }}
                  onClick={async () => {
                    setIsCreatingSnap(true);
                    try {
                      await onCreateSnapshot('Initial Project Checkpoint');
                    } finally {
                      setIsCreatingSnap(false);
                    }
                  }}
                  disabled={isCreatingSnap}
                >
                  <Plus size={14} /> Create First Checkpoint
                </button>
              </div>
            ) : snapshotContent === null ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={28} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                <div>File <code>{selectedFile}</code> was not present in this snapshot.</div>
              </div>
            ) : (
              <div className="diff-table">
                {renderedLines.map((line, idx) => (
                  <div key={idx} className={`diff-row diff-row-${line.type}`}>
                    {/* Old line number */}
                    <span className="diff-cell-num">{line.oldNum ?? ''}</span>
                    {/* New line number */}
                    <span className="diff-cell-num">{line.newNum ?? ''}</span>
                    {/* Diff marker */}
                    <span className="diff-cell-marker">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {/* Line text */}
                    <span className="diff-cell-content">{line.content || ' '}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right: Snapshots Timeline */}
        <aside className="history-timeline-sidebar">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Revisions ({snapshots.length})</span>
            <button
              style={{
                color: '#10b981',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={async () => {
                setIsCreatingSnap(true);
                try {
                  await onCreateSnapshot(`Manual checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
                } finally {
                  setIsCreatingSnap(false);
                }
              }}
              disabled={isCreatingSnap}
              title="Create snapshot checkpoint now"
            >
              <Plus size={12} /> Checkpoint
            </button>
          </div>

          <div style={{ padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {snapshots.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No snapshots recorded yet. Auto-snapshots are created when compiling.
              </div>
            ) : (
              snapshots.map((s, idx) => {
                const isSelected = s.id === (selectedSnapshotId || snapshots[0]?.id);
                return (
                  <div
                    key={s.id}
                    className={`timeline-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedSnapshotId(s.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#10b981' : 'var(--text-main)' }}>
                        {s.description || `Revision ${snapshots.length - idx}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Clock size={11} /> {s.date}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      {s.filesCount ?? 1} project files tracked
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
