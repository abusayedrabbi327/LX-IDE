import React, { useState, useEffect, useCallback } from 'react';

import { ProjectDashboard } from './components/ProjectDashboard';
import type { ProjectInfo } from './components/ProjectDashboard';
import { EditorWorkspace } from './components/EditorWorkspace';
import { HistoryWorkspace } from './components/HistoryWorkspace';
import { SettingsModal } from './components/SettingsModal';
import { NewProjectModal } from './components/NewProjectModal';
import type { FileItem } from './components/FileExplorer';
import type { SnapshotItem } from './components/SnapshotsPanel';

export function App() {
  // Navigation View State: 'dashboard' (Screenshot 1), 'editor' (Screenshot 2), 'history' (Screenshot 3)
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'history'>('dashboard');

  // Projects State
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [currentProject, setCurrentProject] = useState('PrismForge_Demo');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('article');

  // Files & Editor State
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>(['main.tex']);
  const [activeFile, setActiveFile] = useState('main.tex');
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [jumpToLine, setJumpToLine] = useState<number | null>(null);

  // Compilation & PDF State
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [compilerErrors, setCompilerErrors] = useState<Array<{ message: string; line: number | null; context?: string }>>([]);
  const [compilerWarnings, setCompilerWarnings] = useState<Array<{ message: string; line: number | null }>>([]);
  const [compilerBadBoxes, setCompilerBadBoxes] = useState<Array<{ message: string; line: number | null }>>([]);
  const [rawCompilerLog, setRawCompilerLog] = useState('');
  const [hasPdf, setHasPdf] = useState(true);

  // Snapshots & History
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [pdfKey, setPdfKey] = useState(Date.now());

  // 1. Load Projects List
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 2. Load File Tree
  const loadTree = useCallback(async (proj: string) => {
    try {
      const res = await fetch(`/api/projects/${proj}/tree`);
      const data = await res.json();
      if (data.tree) setFileTree(data.tree);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 3. Load File Content
  const loadFileContent = useCallback(async (proj: string, filePath: string) => {
    try {
      const res = await fetch(`/api/projects/${proj}/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContents(prev => ({ ...prev, [filePath]: data.content }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 4. Load Snapshots History
  const loadSnapshots = useCallback(async (proj: string) => {
    setSnapLoading(true);
    try {
      const res = await fetch(`/api/projects/${proj}/snapshots`);
      const data = await res.json();
      if (data.snapshots) setSnapshots(data.snapshots);
    } catch (e) {
      console.error(e);
    } finally {
      setSnapLoading(false);
    }
  }, []);

  // 5. Check if PDF exists
  const checkPdf = useCallback(async (proj: string) => {
    try {
      const res = await fetch(`/api/projects/${proj}/has-pdf`);
      const data = await res.json();
      setHasPdf(Boolean(data.hasPdf));
      setPdfKey(Date.now());
    } catch {
      setHasPdf(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (currentProject) {
      loadTree(currentProject);
      loadFileContent(currentProject, 'main.tex');
      loadSnapshots(currentProject);
      checkPdf(currentProject);
    }
  }, [currentProject, loadTree, loadFileContent, loadSnapshots, checkPdf]);

  // Open Project from Dashboard
  const handleOpenProject = (name: string) => {
    setCurrentProject(name);
    setActiveFile('main.tex');
    setOpenTabs(['main.tex']);
    setCompileStatus('idle');
    setCompilerErrors([]);
    setCompilerWarnings([]);
    checkPdf(name);
    setCurrentView('editor');
  };

  // Delete Project from Dashboard
  const handleDeleteProject = async (name: string) => {
    try {
      const res = await fetch(`/api/projects/${name}`, { method: 'DELETE' });
      if (res.ok) {
        loadProjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Import uploaded zip project
  const handleImportZip = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/projects/import-zip', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import zip project');
    await loadProjects();
    if (data.project?.name) {
      handleOpenProject(data.project.name);
    }
  };

  // Save current active file
  const handleSave = async () => {
    const content = fileContents[activeFile];
    if (content === undefined) return;

    try {
      const res = await fetch(`/api/projects/${currentProject}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFile, content })
      });
      if (res.ok) {
        setIsDirty(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compile project with Tectonic
  const handleCompile = async () => {
    setIsCompiling(true);
    await handleSave();

    try {
      const res = await fetch(`/api/projects/${currentProject}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainFile: 'main.tex' })
      });
      const data = await res.json();

      setRawCompilerLog(data.log || '');
      setCompilerErrors(data.errors || []);
      setCompilerWarnings(data.warnings || []);
      setCompilerBadBoxes(data.badBoxes || []);

      if (data.success) {
        setCompileStatus('success');
        setHasPdf(true);
        setPdfKey(Date.now());
      } else {
        setCompileStatus('error');
        if (data.pdfPath) {
          setHasPdf(true);
          setPdfKey(Date.now());
        }
      }
    } catch (e) {
      setCompileStatus('error');
    } finally {
      setIsCompiling(false);
      loadSnapshots(currentProject);
    }
  };

  // Keyboard Shortcuts: Ctrl+S to save, Ctrl+Enter to compile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, fileContents, currentProject]);

  // Tab & File Selection
  const handleSelectFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs(prev => [...prev, path]);
    }
    setActiveFile(path);
    if (fileContents[path] === undefined) {
      loadFileContent(currentProject, path);
    }
  };

  const handleCloseTab = (tab: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== tab);
    setOpenTabs(newTabs);
    if (activeFile === tab) {
      setActiveFile(newTabs[0] || '');
    }
  };

  const handleJumpToLine = (line: number) => {
    setJumpToLine(line);
    setTimeout(() => setJumpToLine(null), 100);
  };

  return (
    <div className="app-container">
      {/* View 1: Projects Dashboard (Screenshot 1) */}
      {currentView === 'dashboard' && (
        <ProjectDashboard
          projects={projects}
          onOpenProject={handleOpenProject}
          onNewProject={(tpl) => {
            setSelectedTemplate(tpl || 'article');
            setIsNewProjectOpen(true);
          }}
          onImportZip={handleImportZip}
          onDeleteProject={handleDeleteProject}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* View 2: Overleaf Editor Workspace (Screenshot 2) */}
      {currentView === 'editor' && (
        <EditorWorkspace
          projectName={currentProject}
          fileTree={fileTree}
          openTabs={openTabs}
          activeFile={activeFile}
          fileContents={fileContents}
          isDirty={isDirty}
          jumpToLine={jumpToLine}
          isCompiling={isCompiling}
          compileStatus={compileStatus}
          compilerErrors={compilerErrors}
          compilerWarnings={compilerWarnings}
          compilerBadBoxes={compilerBadBoxes}
          rawCompilerLog={rawCompilerLog}
          hasPdf={hasPdf}
          pdfKey={pdfKey}
          onReloadPdf={() => setPdfKey(Date.now())}

          onBackToDashboard={() => {
            loadProjects();
            setCurrentView('dashboard');
          }}
          onOpenHistory={() => {
            loadSnapshots(currentProject);
            setCurrentView('history');
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSelectFile={handleSelectFile}
          onCloseTab={handleCloseTab}
          onContentChange={(val) => {
            setFileContents(prev => ({ ...prev, [activeFile]: val }));
            setIsDirty(true);
          }}
          onSave={handleSave}
          onCompile={handleCompile}
          onCreateItem={async (relPath, type) => {
            await fetch(`/api/projects/${currentProject}/create-item`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: relPath, type })
            });
            loadTree(currentProject);
          }}
          onDeleteItem={async (relPath) => {
            await fetch(`/api/projects/${currentProject}/delete-item`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: relPath })
            });
            loadTree(currentProject);
          }}
          onJumpToLine={handleJumpToLine}
        />
      )}

      {/* View 3: Revision History Workspace (Screenshot 3) */}
      {currentView === 'history' && (
        <HistoryWorkspace
          projectName={currentProject}
          snapshots={snapshots}
          activeFile={activeFile}
          currentContent={fileContents[activeFile] || ''}
          onBackToEditor={() => setCurrentView('editor')}
          onRefreshSnapshots={() => loadSnapshots(currentProject)}
          onCreateSnapshot={async (description) => {
            await fetch(`/api/projects/${currentProject}/snapshots`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description })
            });
            await loadSnapshots(currentProject);
          }}
          onRestoreSnapshot={async (id) => {
            await fetch(`/api/projects/${currentProject}/snapshots/${id}/restore`, {
              method: 'POST'
            });
            loadTree(currentProject);
            loadFileContent(currentProject, activeFile);
            loadSnapshots(currentProject);
          }}
          loading={snapLoading}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={loadProjects}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        initialTemplate={selectedTemplate}
        onClose={() => setIsNewProjectOpen(false)}
        onCreated={(newProj) => {
          loadProjects();
          handleOpenProject(newProj);
        }}
      />
    </div>
  );
}

export default App;
