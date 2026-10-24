import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Download, FileText, CheckCircle, XCircle, ZoomIn, ZoomOut } from 'lucide-react';

interface PdfViewerProps {
  projectName: string;
  hasPdf: boolean;
  isCompiling: boolean;
  compileStatus: 'idle' | 'success' | 'error';
  onCompile: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  projectName,
  hasPdf,
  isCompiling,
  compileStatus,
  onCompile
}) => {
  const [reloadKey, setReloadKey] = useState(Date.now());
  const [zoomLevel, setZoomLevel] = useState(100);

  const pdfUrl = `/api/projects/${projectName}/pdf?t=${reloadKey}#toolbar=1&navpanes=1&zoom=${zoomLevel}`;

  const handleRefresh = () => {
    setReloadKey(Date.now());
  };

  const handleOpenExternal = () => {
    window.open(`/api/projects/${projectName}/pdf?t=${Date.now()}`, '_blank');
  };

  return (
    <div className="pdf-section">
      <div className="pdf-toolbar">
        <div className="pdf-toolbar-left">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            PDF Output Preview
          </span>

          {compileStatus === 'success' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
              <CheckCircle size={12} /> Compiled
            </span>
          )}

          {compileStatus === 'error' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f43f5e', padding: '2px 6px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '4px' }}>
              <XCircle size={12} /> Build Error (Retaining Last PDF)
            </span>
          )}
        </div>

        <div className="pdf-toolbar-right">
          <button className="btn-icon" onClick={() => setZoomLevel(prev => Math.min(prev + 15, 200))} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-subtle)', minWidth: '35px', textAlign: 'center' }}>
            {zoomLevel}%
          </span>
          <button className="btn-icon" onClick={() => setZoomLevel(prev => Math.max(prev - 15, 50))} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <button className="btn-icon" onClick={handleRefresh} title="Reload PDF">
            <RefreshCw size={14} className={isCompiling ? 'spinner' : ''} />
          </button>
          <button className="btn-icon" onClick={handleOpenExternal} title="Open in New Window">
            <ExternalLink size={14} />
          </button>
          <a
            href={`/api/projects/${projectName}/pdf`}
            download={`${projectName}.pdf`}
            className="btn-icon"
            title="Download PDF"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          >
            <Download size={14} />
          </a>
        </div>
      </div>

      <div className="pdf-embed-container">
        {hasPdf ? (
          <iframe
            key={reloadKey}
            src={pdfUrl}
            title="Compiled LaTeX PDF"
            className="pdf-iframe"
          />
        ) : (
          <div className="pdf-empty-state">
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              marginBottom: 8
            }}>
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
              No PDF Generated Yet
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '300px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
              Compile your manuscript with Tectonic to render the high-resolution side-by-side preview.
            </p>
            <button
              className={`btn btn-compile ${isCompiling ? 'compiling' : ''}`}
              onClick={onCompile}
              disabled={isCompiling}
            >
              {isCompiling ? 'Compiling LaTeX...' : 'Compile Document'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
