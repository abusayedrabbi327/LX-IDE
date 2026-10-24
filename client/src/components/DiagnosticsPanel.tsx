import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, RefreshCw } from 'lucide-react';

export interface DiagnosticIssue {
  type: 'error' | 'warning' | 'info';
  category: 'reference' | 'citation' | 'label' | 'placeholder' | 'figure' | 'compiler';
  message: string;
  file: string;
  line: number | null;
}

interface DiagnosticsPanelProps {
  issues: DiagnosticIssue[];
  loading: boolean;
  onRefresh: () => void;
  onJumpToIssue: (file: string, line: number | null) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  issues,
  loading,
  onRefresh,
  onJumpToIssue
}) => {
  const errorsCount = issues.filter(i => i.type === 'error').length;
  const warningsCount = issues.filter(i => i.type === 'warning').length;
  const infosCount = issues.filter(i => i.type === 'info').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        <span>Manuscript Quality</span>
        <button className="btn-icon" onClick={onRefresh} title="Re-scan document">
          <RefreshCw size={13} className={loading ? 'spinner' : ''} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '11px'
      }}>
        <span style={{ color: '#f43f5e', fontWeight: 600 }}>{errorsCount} Errors</span>
        <span style={{ color: 'var(--text-subtle)' }}>•</span>
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{warningsCount} Warnings</span>
        <span style={{ color: 'var(--text-subtle)' }}>•</span>
        <span style={{ color: '#06b6d4', fontWeight: 600 }}>{infosCount} Placeholders</span>
      </div>

      <div className="sidebar-content" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {issues.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            gap: '8px'
          }}>
            <CheckCircle2 size={24} color="#10b981" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              All Checks Passed
            </span>
            <span style={{ fontSize: '11px', lineHeight: 1.4 }}>
              No unresolved references, missing citations, or duplicate labels detected.
            </span>
          </div>
        ) : (
          issues.map((issue, idx) => {
            const isErr = issue.type === 'error';
            const isWarn = issue.type === 'warning';
            const icon = isErr
              ? <AlertCircle size={14} color="#f43f5e" style={{ flexShrink: 0, marginTop: 2 }} />
              : isWarn
              ? <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              : <Info size={14} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} />;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onClick={() => onJumpToIssue(issue.file, issue.line)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                {icon}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {issue.message}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                    {issue.file}{issue.line ? `:${issue.line}` : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
