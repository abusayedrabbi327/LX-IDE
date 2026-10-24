import React, { useState } from 'react';
import { X, AlertCircle, AlertTriangle, ChevronRight, CheckCircle2, Box } from 'lucide-react';

export interface ErrorItem {
  message: string;
  line: number | null;
  context?: string;
}

export interface WarningItem {
  message: string;
  package?: string;
  line: number | null;
}

export interface BadBoxItem {
  message: string;
  line: number | null;
}

interface CompilerLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ErrorItem[];
  warnings: WarningItem[];
  badBoxes?: BadBoxItem[];
  rawLog: string;
  onJumpToLine: (line: number) => void;
}

export const CompilerLogsModal: React.FC<CompilerLogsModalProps> = ({
  isOpen,
  onClose,
  errors,
  warnings,
  badBoxes = [],
  rawLog,
  onJumpToLine
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'badBoxes' | 'raw'>(
    errors.length > 0 ? 'errors' : warnings.length > 0 ? 'warnings' : 'errors'
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '820px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="modal-title">Compilation Logs & Issues</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn-tab ${activeTab === 'errors' ? 'active' : ''}`}
                onClick={() => setActiveTab('errors')}
              >
                Errors ({errors.length})
              </button>
              <button
                className={`btn-tab ${activeTab === 'warnings' ? 'active' : ''}`}
                onClick={() => setActiveTab('warnings')}
              >
                Warnings ({warnings.length})
              </button>
              <button
                className={`btn-tab ${activeTab === 'badBoxes' ? 'active' : ''}`}
                onClick={() => setActiveTab('badBoxes')}
              >
                Bad Boxes ({badBoxes.length})
              </button>
              <button
                className={`btn-tab ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                Raw Log
              </button>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', padding: '16px', overflowY: 'auto' }}>
          {/* Tab 1: Errors */}
          {activeTab === 'errors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {errors.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#10b981', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={32} color="#10b981" />
                  <span style={{ fontWeight: 600 }}>0 compilation errors detected!</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Document compiled to PDF successfully without critical syntax failures.</span>
                </div>
              ) : (
                errors.map((err, i) => (
                  <div
                    key={i}
                    className="log-issue-card error"
                    onClick={() => {
                      if (err.line) {
                        onJumpToLine(err.line);
                        onClose();
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <AlertCircle size={16} color="#f43f5e" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fca5a5' }}>
                          {err.message}
                        </div>
                        {err.context && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                            {err.context}
                          </div>
                        )}
                      </div>
                      {err.line && (
                        <span className="log-line-badge">
                          Line {err.line} <ChevronRight size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Warnings */}
          {activeTab === 'warnings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {warnings.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={32} color="#10b981" />
                  <span style={{ fontWeight: 600, color: '#10b981' }}>0 compilation warnings!</span>
                  <span style={{ fontSize: '11.5px' }}>Compiler generated document cleanly with no package or reference alerts.</span>
                </div>
              ) : (
                warnings.map((warn, i) => {
                  const pkgMatch = warn.message.match(/^Package\s+([\w-]+)\s+Warning:/i);
                  const pkgName = warn.package || (pkgMatch ? pkgMatch[1] : null);
                  const displayMsg = pkgMatch ? warn.message.replace(/^Package\s+[\w-]+\s+Warning:\s*/i, '') : warn.message;

                  return (
                    <div
                      key={i}
                      className="log-issue-card warning"
                      onClick={() => {
                        if (warn.line) {
                          onJumpToLine(warn.line);
                          onClose();
                        }
                      }}
                      style={{ cursor: warn.line ? 'pointer' : 'default' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <AlertTriangle size={15} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                          {pkgName && (
                            <span style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              fontWeight: 600,
                              fontSize: '11px',
                              marginRight: '6px'
                            }}>
                              {pkgName}
                            </span>
                          )}
                          <span>{displayMsg}</span>
                        </div>
                        {warn.line && (
                          <span className="log-line-badge">
                            Line {warn.line} <ChevronRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Bad Boxes (Overfull / Underfull) */}
          {activeTab === 'badBoxes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: '#93c5fd' }}>
                Bad boxes indicate places where text or equations slightly exceeded margin bounds. They do not prevent PDF generation.
              </div>
              {badBoxes.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No bad boxes detected.
                </div>
              ) : (
                badBoxes.map((box, i) => (
                  <div
                    key={i}
                    className="log-issue-card"
                    style={{ borderLeft: '3px solid #3b82f6', background: 'rgba(255,255,255,0.02)' }}
                    onClick={() => {
                      if (box.line) {
                        onJumpToLine(box.line);
                        onClose();
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Box size={15} color="#60a5fa" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                        {box.message}
                      </div>
                      {box.line && (
                        <span className="log-line-badge">
                          Line {box.line} <ChevronRight size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Raw Terminal Output */}
          {activeTab === 'raw' && (
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              lineHeight: 1.5,
              background: '#090d14',
              color: '#94a3b8',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px'
            }}>
              {rawLog || 'No compiler output available.'}
            </pre>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
