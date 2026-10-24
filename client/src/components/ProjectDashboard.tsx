import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  Search,
  Plus,
  Trash2,
  Clock,
  User,
  Settings,
  FileCode,
  Download,
  ChevronDown,
  Upload,
  FileText,
  FileUp,
  BookOpen,
  Layers,
  ChevronRight,
  Briefcase,
  FolderOpen
} from 'lucide-react';

export interface ProjectInfo {
  name: string;
  path: string;
  mainFile: string;
  createdAt: string;
  modifiedAt?: string;
}

interface ProjectDashboardProps {
  projects: ProjectInfo[];
  onOpenProject: (projectName: string) => void;
  onNewProject: (template?: string) => void;
  onImportZip: (file: File) => Promise<void>;
  onDeleteProject: (projectName: string) => void;
  onOpenSettings: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  onOpenProject,
  onNewProject,
  onImportZip,
  onDeleteProject,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderTab, setSelectedFolderTab] = useState<'all' | 'mine' | 'archived'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreTemplatesOpen, setIsMoreTemplatesOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setIsMoreTemplatesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleOpenFolder = async (projName?: string) => {
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: projName })
      });
    } catch (err) {
      console.error('Failed to open folder in explorer:', err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setIsDropdownOpen(false);
    try {
      await onImportZip(file);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="overleaf-dashboard">
      {/* Hidden file input for zip upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Dashboard Left Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="overleaf-brand-icon" style={{ background: '#064e3b', border: '1px solid #10b981' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#10b981', letterSpacing: '-0.5px' }}>LX</span>
          </div>
          <div>
            <span className="brand-title" style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              LX<span style={{ color: '#10b981' }}>-IDE</span>
            </span>
            <div style={{ fontSize: '9px', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OFFLINE LATEX STUDIO
            </div>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            className={`dashboard-nav-item ${selectedFolderTab === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFolderTab('all')}
          >
            <Folder size={16} />
            <span>All projects</span>
            <span className="nav-badge">{projects.length}</span>
          </button>

          <button
            className={`dashboard-nav-item ${selectedFolderTab === 'mine' ? 'active' : ''}`}
            onClick={() => setSelectedFolderTab('mine')}
          >
            <User size={16} />
            <span>Your projects</span>
          </button>

          <button
            className={`dashboard-nav-item ${selectedFolderTab === 'archived' ? 'active' : ''}`}
            onClick={() => setSelectedFolderTab('archived')}
          >
            <Clock size={16} />
            <span>Recent projects</span>
          </button>
        </nav>

        <div className="dashboard-sidebar-footer">
          <button
            className="dashboard-footer-btn"
            onClick={() => handleOpenFolder()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '4px' }}
            title="Open Projects folder on SSD in Windows File Explorer"
          >
            <FolderOpen size={15} />
            <span>Open SSD Folder</span>
          </button>
          <button className="dashboard-footer-btn" onClick={onOpenSettings}>
            <Settings size={15} />
            <span>Settings & Engine</span>
          </button>
          <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)', padding: '6px 12px' }}>
            Engine: Tectonic v0.15 (Offline)
          </div>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Top Header */}
        <div className="dashboard-header" style={{ position: 'relative' }}>
          <h1 className="dashboard-title">All projects</h1>

          {/* New Project Dropdown Container */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="btn-overleaf-new"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              disabled={isUploading}
            >
              <Plus size={16} />
              <span>{isUploading ? 'Importing...' : 'New project'}</span>
              <ChevronDown size={14} style={{ marginLeft: 2, opacity: 0.8 }} />
            </button>

            {isDropdownOpen && (
              <div className="overleaf-new-dropdown">
                {/* 1. Blank Project */}
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNewProject('blank');
                  }}
                >
                  <FileText size={15} className="dropdown-icon" />
                  <span>Blank project</span>
                </div>

                <div className="dropdown-divider" />

                {/* 2. Import Section */}
                <div className="dropdown-section-title">Import</div>

                <div
                  className="dropdown-item"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={15} className="dropdown-icon" color="#10b981" />
                  <span>Existing project (.zip)</span>
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => {
                    alert('To import Word documents: save as Markdown or copy text directly into an LX-IDE manuscript.');
                    setIsDropdownOpen(false);
                  }}
                >
                  <FileUp size={15} className="dropdown-icon" style={{ opacity: 0.6 }} />
                  <span>Word document</span>
                </div>

                <div
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNewProject('blank');
                  }}
                >
                  <FileCode size={15} className="dropdown-icon" style={{ opacity: 0.6 }} />
                  <span>Markdown document</span>
                </div>

                <div className="dropdown-divider" />

                {/* 3. Templates Section */}
                <div className="dropdown-section-title">Templates</div>

                <div
                  className="dropdown-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNewProject('article');
                  }}
                >
                  <BookOpen size={15} className="dropdown-icon" color="#6366f1" />
                  <span>Example project (Article)</span>
                </div>

                <div
                  className="dropdown-item dropdown-item-has-submenu"
                  onMouseEnter={() => setIsMoreTemplatesOpen(true)}
                  onClick={() => setIsMoreTemplatesOpen(prev => !prev)}
                >
                  <Layers size={15} className="dropdown-icon" color="#06b6d4" />
                  <span style={{ flex: 1 }}>More templates</span>
                  <ChevronRight size={13} style={{ opacity: 0.6 }} />

                  {isMoreTemplatesOpen && (
                    <div className="overleaf-new-submenu">
                      <div
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                          setIsMoreTemplatesOpen(false);
                          onNewProject('ieee');
                        }}
                      >
                        <Layers size={14} className="dropdown-icon" color="#06b6d4" />
                        <div>
                          <div>IEEE Conference Paper</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)' }}>Two-column format</div>
                        </div>
                      </div>

                      <div
                        className="dropdown-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                          setIsMoreTemplatesOpen(false);
                          onNewProject('cv');
                        }}
                      >
                        <Briefcase size={14} className="dropdown-icon" color="#f59e0b" />
                        <div>
                          <div>Curriculum Vitae / Resume</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)' }}>Professional 1-page CV</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="dashboard-search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="dashboard-search-input"
            placeholder="Search in all projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Projects Table */}
        <div className="projects-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" style={{ accentColor: '#10b981' }} />
                </th>
                <th>Title</th>
                <th>Owner</th>
                <th>Last modified</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No projects found. Click <strong>"New project"</strong> to create a new LaTeX manuscript.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.name} onClick={() => onOpenProject(p.name)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" style={{ accentColor: '#10b981' }} />
                    </td>
                    <td>
                      <div className="project-title-cell">
                        <FileCode size={16} color="#10b981" />
                        <span className="project-name-link">{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="project-owner-badge">You</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {formatDate(p.modifiedAt || p.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenFolder(p.name)}
                          title="Reveal project folder on SSD in Windows Explorer"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <FolderOpen size={14} />
                        </button>
                        <a
                          href={`/api/projects/${p.name}/export`}
                          download={`${p.name}.zip`}
                          className="btn-icon"
                          title="Download ZIP"
                        >
                          <Download size={14} />
                        </a>
                        {p.name !== 'PrismForge_Demo' && (
                          <button
                            className="btn-icon"
                            style={{ color: '#f43f5e' }}
                            onClick={() => {
                              if (confirm(`Permanently delete project "${p.name}"?`)) {
                                onDeleteProject(p.name);
                              }
                            }}
                            title="Delete Project"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
