import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Copy,
  Wand2,
  AlertCircle,
  FileSearch,
  BookOpen,
  ArrowRight,
  Settings,
  Flame
} from 'lucide-react';

interface DiffLine {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface AiResult {
  action: string;
  originalText: string;
  proposedText: string;
  diff: DiffLine[];
  model?: string;
}

interface AiAssistantPanelProps {
  currentText: string;
  compilerErrors?: Array<{ message: string; line: number | null }>;
  onApplyDiff: (newText: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
  activeModel: string;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  currentText,
  compilerErrors = [],
  onApplyDiff,
  onOpenSettings,
  onClose,
  activeModel
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Local Offline Proofreader fallback when API credits are exhausted
  const runOfflineProofread = (action: string) => {
    setLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      let revised = currentText;

      // 1. Convert plain double quotes to proper LaTeX quotes ``...''
      revised = revised.replace(/"([^"]+)"/g, "``$1''");

      // 2. Add non-breaking tildes before citations and references
      revised = revised.replace(/(?<!~)\s*\\cite\{/g, "~\\cite{");
      revised = revised.replace(/(?<!~)\s*\\ref\{/g, "~\\ref{");
      revised = revised.replace(/(?<!~)\s*\\eqref\{/g, "~\\eqref{");

      // 3. Normalize common abbreviations
      revised = revised.replace(/\be\.g\.\s*/g, "e.g., ");
      revised = revised.replace(/\bi\.e\.\s*/g, "i.e., ");
      revised = revised.replace(/\bet al\.\s*/g, "et~al.\\ ");

      // 4. Eliminate redundant double spaces
      revised = revised.replace(/  +/g, " ");

      // Generate simple line-level diff
      const origLines = currentText.split('\n');
      const revLines = revised.split('\n');
      const diff: DiffLine[] = [];

      for (let i = 0; i < Math.max(origLines.length, revLines.length); i++) {
        const o = origLines[i];
        const r = revLines[i];
        if (o === r) {
          if (o !== undefined) diff.push({ value: o + '\n' });
        } else {
          if (o !== undefined) diff.push({ value: o + '\n', removed: true });
          if (r !== undefined) diff.push({ value: r + '\n', added: true });
        }
      }

      setAiResult({
        action: action + ' (Offline Engine)',
        originalText: currentText,
        proposedText: revised,
        diff,
        model: 'Local Typography & Syntax Engine'
      });
      setLoading(false);
    }, 200);
  };

  const runAiAction = async (action: string, errorContext?: string) => {
    setLoading(true);
    setErrorMsg(null);
    setAiResult(null);

    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText: currentText,
          errorDetails: errorContext || (compilerErrors.length > 0 ? compilerErrors.map(e => e.message).join('\n') : ''),
          userPrompt: customPrompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete AI request');
      }

      setAiResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during AI synthesis');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (aiResult) {
      onApplyDiff(aiResult.proposedText);
      setAiResult(null);
    }
  };

  const handleCopy = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult.proposedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="ai-drawer">
      <div className="ai-header">
        <div className="ai-header-title">
          <Sparkles size={16} color="#818cf8" />
          <span>AI Writing Studio</span>
          <span className="model-pill" title={activeModel}>
            {activeModel.split('/').pop() || activeModel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn-icon" onClick={onOpenSettings} title="AI Configuration">
            <Settings size={14} />
          </button>
          <button className="btn-icon" onClick={onClose} title="Close AI Panel" style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="ai-content">
        {/* Quick Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            Academic Synthesis Actions
          </div>
          <div className="action-grid">
            <button
              className="action-chip"
              onClick={() => runAiAction('proofread')}
              disabled={loading}
            >
              <FileSearch size={14} color="#06b6d4" />
              <span>Proofread</span>
            </button>

            <button
              className="action-chip"
              onClick={() => runAiAction('polish')}
              disabled={loading}
            >
              <Wand2 size={14} color="#818cf8" />
              <span>Polish Tone</span>
            </button>

            <button
              className="action-chip"
              onClick={() => runAiAction('shorten')}
              disabled={loading}
            >
              <Flame size={14} color="#f59e0b" />
              <span>Make Concise</span>
            </button>

            <button
              className="action-chip"
              onClick={() => runAiAction('expand')}
              disabled={loading}
            >
              <BookOpen size={14} color="#10b981" />
              <span>Expand Idea</span>
            </button>
          </div>
        </div>

        {/* Compiler Error Repair Assistant */}
        {compilerErrors.length > 0 && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#f43f5e' }}>
              <AlertCircle size={14} />
              <span>{compilerErrors.length} Compiler Diagnostics Detected</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxHeight: '60px', overflowY: 'auto', fontFamily: 'var(--font-mono)' }}>
              {compilerErrors[0].message}
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 8px', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              onClick={() => runAiAction('explain_error', compilerErrors.map(e => e.message).join('\n'))}
              disabled={loading}
            >
              Diagnose & Suggest Patch
            </button>
          </div>
        )}

        {/* Custom Prompt Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label className="form-label">Custom Instruction</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 'Format this as a formal lemma'..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customPrompt.trim()) runAiAction('custom');
              }}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={() => runAiAction('custom')}
              disabled={loading || !customPrompt.trim()}
              style={{ padding: '6px 10px' }}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Sparkles size={24} className="spinner" color="#818cf8" />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Synthesizing scholarly revisions...
            </div>
          </div>
        )}

        {/* Error Alert with Settings link */}
        {errorMsg && (
          <div style={{
            padding: '12px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '12px',
            lineHeight: 1.4,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={onOpenSettings}
              >
                Switch Model in Settings
              </button>
              <button
                className="btn btn-primary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => runOfflineProofread('Proofread')}
              >
                Run Offline Proofreader (No API Needed)
              </button>
            </div>
          </div>
        )}

        {/* Diff Review View */}
        {aiResult && (
          <div className="diff-card">
            <div className="diff-header">
              <span>Proposed Revision Diff</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {aiResult.action.toUpperCase()}
              </span>
            </div>

            <div className="diff-body">
              {aiResult.diff.map((part, index) => {
                const className = part.added
                  ? 'diff-line added'
                  : part.removed
                  ? 'diff-line removed'
                  : 'diff-line';
                const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                return (
                  <div key={index} className={className}>
                    {part.value.split('\n').filter(Boolean).map((line, lIdx) => (
                      <div key={lIdx}>{prefix}{line}</div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="diff-actions">
              <button
                className="btn btn-primary"
                onClick={handleApply}
                style={{ flex: 1 }}
              >
                <Check size={14} /> Accept & Apply
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCopy}
                title="Copy proposal to clipboard"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setAiResult(null)}
                title="Reject and dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
