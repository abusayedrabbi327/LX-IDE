import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Clock,
  Download,
  Settings as SettingsIcon,
  X,
  FileText,
  AlertCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen
} from 'lucide-react';

import { Editor } from './Editor';
import { EditorToolbar } from './EditorToolbar';
import { FileOutline } from './FileOutline';
import { FileExplorer } from './FileExplorer';
import type { FileItem } from './FileExplorer';
import { CompilerLogsModal } from './CompilerLogsModal';
import type { BadBoxItem } from './CompilerLogsModal';

interface ErrorItem {
  message: string;
  line: number | null;
  context?: string;
}

interface WarningItem {
  message: string;
  line: number | null;
}

interface EditorWorkspaceProps {
  projectName: string;
  fileTree: FileItem[];
  openTabs: string[];
  activeFile: string;
  fileContents: Record<string, string>;
  isDirty: boolean;
  jumpToLine: number | null;
  isCompiling: boolean;
  compileStatus: 'idle' | 'success' | 'error';
  compilerErrors: ErrorItem[];
  compilerWarnings: WarningItem[];
  compilerBadBoxes?: BadBoxItem[];
  rawCompilerLog: string;
  hasPdf: boolean;
  pdfKey: number;
  onReloadPdf: () => void;

  onBackToDashboard: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onSelectFile: (path: string) => void;
  onCloseTab: (tab: string, e: React.MouseEvent) => void;
  onContentChange: (newContent: string) => void;
  onSave: () => void;
  onCompile: () => void;
  onCreateItem: (path: string, type: 'file' | 'directory') => void;
  onDeleteItem: (path: string) => void;
  onJumpToLine: (line: number) => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  projectName,
  fileTree,
  openTabs,
  activeFile,
  fileContents,
  isDirty,
  jumpToLine,
  isCompiling,
  compileStatus,
  compilerErrors,
  compilerWarnings,
  compilerBadBoxes = [],
  rawCompilerLog,
  hasPdf,
  pdfKey,
  onReloadPdf,

  onBackToDashboard,
  onOpenHistory,
  onOpenSettings,
  onSelectFile,
  onCloseTab,
  onContentChange,
  onSave,
  onCompile,
  onCreateItem,
  onDeleteItem,
  onJumpToLine
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editorPercent, setEditorPercent] = useState(50);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  const splitRef = useRef<HTMLDivElement>(null);

  const currentContent = fileContents[activeFile] || '';

  // Draggable sidebar resizing
  const startSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(moveEvent.clientX, 450));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Draggable Editor / PDF split resizing
  const startEditorSplitResize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!splitRef.current) return;
    const splitRect = splitRef.current.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const offset = moveEvent.clientX - splitRect.left;
      const pct = Math.max(20, Math.min((offset / splitRect.width) * 100, 80));
      setEditorPercent(pct);
    };
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Insert snippet from toolbar into active editor
  const handleInsertSnippet = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const newContent = currentContent + '\n' + prefix + defaultPlaceholder + suffix;
    onContentChange(newContent);
  };

  const pdfUrl = `/api/projects/${projectName}/pdf?t=${pdfKey}#toolbar=1&navpanes=1&zoom=${zoomLevel}`;

  return (
    <div className="overleaf-editor-workspace">
      {/* 1. Top Overleaf Header */}
      <header className="overleaf-top-header">
        <div className="top-header-left">
          <div
            onClick={onBackToDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              paddingRight: '10px',
              borderRight: '1px solid var(--border-subtle)'
            }}
            title="Go to LX-IDE Projects"
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

          <button className="btn-back-projects" onClick={onBackToDashboard}>
            <ArrowLeft size={15} />
            <span>Projects</span>
          </button>

          <button
            className="btn-icon"
            onClick={() => setIsSidebarOpen(prev => !prev)}
            title={isSidebarOpen ? "Collapse File Tree" : "Expand File Tree"}
            style={{ color: 'var(--text-muted)' }}
          >
            {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>

          <div className="header-menu-items">
            <span className="menu-item" onClick={onSave} title="Save (Ctrl+S)">File</span>
            <span className="menu-item" onClick={() => onCompile()} title="Recompile (Ctrl+Enter)">Edit</span>
            <span className="menu-item" onClick={() => setIsLogsModalOpen(true)}>View Logs</span>
          </div>
        </div>

        <div className="top-header-center">
          <span className="project-title-badge">
            {projectName}
            <ChevronDown size={13} style={{ opacity: 0.6 }} />
          </span>
        </div>

        <div className="top-header-right">
          <button
            className="btn-header-action"
            onClick={() => {
              fetch('/api/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName })
              });
            }}
            title="Reveal project folder on SSD in Windows File Explorer"
          >
            <FolderOpen size={15} />
            <span>Folder</span>
          </button>

          <button className="btn-header-action" onClick={onOpenHistory} title="View Revision History">
            <Clock size={15} />
            <span>History</span>
          </button>

          <a
            href={`/api/projects/${projectName}/export`}
            download={`${projectName}.zip`}
            className="btn-header-action"
            style={{ textDecoration: 'none' }}
            title="Download Project ZIP"
          >
            <Download size={15} />
            <span>Download</span>
          </a>

          <button className="btn-header-action" onClick={onOpenSettings} title="Settings">
            <SettingsIcon size={15} />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="workspace-main-container">
        {/* Left Sidebar: File Tree + File Outline */}
        {isSidebarOpen && (
          <aside className="overleaf-sidebar" style={{ width: `${sidebarWidth}px` }}>
            {/* File List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <FileExplorer
                tree={fileTree}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                onCreateItem={onCreateItem}
                onDeleteItem={onDeleteItem}
                isDirty={isDirty}
              />
            </div>

            {/* File Outline (Parsed Sections) */}
            <FileOutline
              content={currentContent}
              onJumpToLine={onJumpToLine}
            />
          </aside>
        )}

        {/* Draggable Divider for Sidebar */}
        {isSidebarOpen && (
          <div className="resizer" onMouseDown={startSidebarResize} title="Drag to resize sidebar" />
        )}

        {/* Center: Editor + PDF Preview */}
        <div className="overleaf-center-split" ref={splitRef}>
          {/* Editor Column */}
          <div className="overleaf-editor-col" style={{ flex: `0 0 ${editorPercent}%` }}>
            {/* File Tabs Bar */}
            <div className="overleaf-tabs-bar">
              {openTabs.map(tab => (
                <div
                  key={tab}
                  className={`overleaf-tab ${activeFile === tab ? 'active' : ''}`}
                  onClick={() => onSelectFile(tab)}
                >
                  <FileText size={13} color={tab.endsWith('.tex') ? '#10b981' : '#f59e0b'} />
                  <span>{tab}</span>
                  {activeFile === tab && isDirty && <span className="dirty-indicator" />}
                  {openTabs.length > 1 && (
                    <X
                      size={12}
                      className="tab-close"
                      onClick={(e) => onCloseTab(tab, e)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* LaTeX Formatting Toolbar */}
            <EditorToolbar onInsertSnippet={handleInsertSnippet} />

            {/* CodeMirror LaTeX Editor */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                content={currentContent}
                onChange={onContentChange}
                onSave={onSave}
                jumpToLine={jumpToLine}
              />
            </div>
          </div>

          {/* Draggable Divider between Editor and PDF */}
          <div
            className="resizer"
            onMouseDown={startEditorSplitResize}
            title="Drag to resize Editor / PDF view"
          />

          {/* PDF Preview Column */}
          <div className="overleaf-pdf-col" style={{ flex: 1 }}>
            {/* Recompile & PDF Control Bar */}
            <div className="overleaf-recompile-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className={`btn-recompile ${isCompiling ? 'compiling' : ''}`}
                  onClick={onCompile}
                  disabled={isCompiling}
                  title="Compile LaTeX (Ctrl+Enter)"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{isCompiling ? 'Compiling...' : 'Recompile'}</span>
                </button>

                {/* Log & Warning Badges */}
                <button
                  className={`btn-log-counter ${compilerErrors.length > 0 ? 'error' : compilerWarnings.length > 0 ? 'warning' : 'clean'}`}
                  onClick={() => setIsLogsModalOpen(true)}
                  title="View Compiler Logs & Warnings"
                >
                  {compilerErrors.length > 0 ? (
                    <>
                      <AlertCircle size={13} />
                      <span>{compilerErrors.length} {compilerErrors.length === 1 ? 'Error' : 'Errors'}</span>
                    </>
                  ) : compilerWarnings.length > 0 ? (
                    <>
                      <AlertTriangle size={13} />
                      <span>{compilerWarnings.length} Warnings</span>
                    </>
                  ) : (
                    <>
                      {compileStatus === 'success' && (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      )}
                      <span>0 Errors</span>
                    </>
                  )}
                </button>
              </div>

              {/* PDF Viewer Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="btn-icon"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 15, 200))}
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-subtle)', minWidth: '35px', textAlign: 'center' }}>
                  {zoomLevel}%
                </span>
                <button
                  className="btn-icon"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 15, 50))}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  className="btn-icon"
                  onClick={onReloadPdf}
                  title="Reload PDF View"
                >
                  <RefreshCw size={14} className={isCompiling ? 'spinner' : ''} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => window.open(`/api/projects/${projectName}/pdf?t=${Date.now()}`, '_blank')}
                  title="Open in Popout Window"
                >
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

            {/* PDF Render Container */}
            <div className="overleaf-pdf-frame-container">
              {hasPdf ? (
                <iframe
                  key={pdfKey}
                  src={pdfUrl}
                  title="PDF Viewer"
                  className="pdf-iframe"
                />
              ) : (
                <div className="pdf-empty-state">
                  <FileText size={36} color="#10b981" />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Ready to Compile</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Click <strong>Recompile</strong> to generate your high-res PDF locally.
                  </div>
                  <button className="btn-recompile" onClick={onCompile}>
                    <Play size={14} fill="currentColor" /> Recompile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compiler Logs & Diagnostics Modal */}
      <CompilerLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        errors={compilerErrors}
        warnings={compilerWarnings}
        badBoxes={compilerBadBoxes}
        rawLog={rawCompilerLog}
        onJumpToLine={onJumpToLine}
      />
    </div>
  );
};
