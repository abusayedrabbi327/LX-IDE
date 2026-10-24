import React, { useState } from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  Trash2,
  FilePlus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  ext?: string;
  children?: FileItem[];
}

interface FileExplorerProps {
  tree: FileItem[];
  activeFile: string;
  onSelectFile: (path: string) => void;
  onCreateItem: (path: string, type: 'file' | 'directory') => void;
  onDeleteItem: (path: string) => void;
  isDirty?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  tree,
  activeFile,
  onSelectFile,
  onCreateItem,
  onDeleteItem,
  isDirty
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ '': true });
  const [newItemType, setNewItemType] = useState<'file' | 'directory' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const toggleFolder = (folderPath: string) => {
    setOpenFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName.trim() && newItemType) {
      onCreateItem(newItemName.trim(), newItemType);
      setNewItemName('');
      setNewItemType(null);
    }
  };

  const renderIcon = (item: FileItem) => {
    if (item.type === 'directory') {
      return openFolders[item.path] ? <FolderOpen size={14} color="#818cf8" /> : <Folder size={14} color="#818cf8" />;
    }
    if (item.ext === '.tex') return <FileCode size={14} color="#06b6d4" />;
    if (item.ext === '.bib') return <FileText size={14} color="#f59e0b" />;
    if (['.png', '.jpg', '.jpeg', '.pdf'].includes(item.ext || '')) return <ImageIcon size={14} color="#10b981" />;
    return <FileText size={14} color="var(--text-muted)" />;
  };

  const renderTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isSelected = activeFile === item.path;
      const isOpen = openFolders[item.path];

      if (item.type === 'directory') {
        return (
          <div key={item.path}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px 4px ' + (8 + depth * 14) + 'px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)'
              }}
              onClick={() => toggleFolder(item.path)}
            >
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {renderIcon(item)}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
            </div>
            {isOpen && item.children && renderTree(item.children, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={item.path}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px 4px ' + (20 + depth * 14) + 'px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            borderLeft: isSelected ? '2px solid #6366f1' : '2px solid transparent'
          }}
          onClick={() => onSelectFile(item.path)}
        >
          {renderIcon(item)}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>
          {isSelected && isDirty && <span className="dirty-indicator" title="Unsaved changes" />}
          {item.name !== 'main.tex' && (
            <button
              className="btn-icon"
              style={{ padding: '2px', opacity: 0.6 }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${item.name}?`)) onDeleteItem(item.path);
              }}
              title="Delete file"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        <span>Files & Assets</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn-icon"
            onClick={() => setNewItemType('file')}
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setNewItemType('directory')}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {newItemType && (
        <form onSubmit={handleCreateSubmit} style={{ padding: '8px 12px' }}>
          <input
            type="text"
            className="form-input"
            autoFocus
            placeholder={newItemType === 'file' ? 'filename.tex' : 'folder name'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onBlur={() => { if (!newItemName.trim()) setNewItemType(null); }}
            style={{ fontSize: '11px', padding: '4px 8px' }}
          />
        </form>
      )}

      <div className="sidebar-content">
        {renderTree(tree)}
      </div>
    </div>
  );
};
