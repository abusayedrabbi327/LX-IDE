import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Plus } from 'lucide-react';

interface BibEntry {
  type: string;
  key: string;
  title: string;
  author: string;
  year: string;
  raw: string;
}

interface BibtexManagerProps {
  bibContent: string;
  onInsertCitation: (citeCommand: string) => void;
}

export const BibtexManager: React.FC<BibtexManagerProps> = ({ bibContent, onInsertCitation }) => {
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const entries: BibEntry[] = useMemo(() => {
    if (!bibContent) return [];
    const list: BibEntry[] = [];
    const blocks = bibContent.split(/(?=@\w+\s*\{)/);

    for (const block of blocks) {
      const match = block.match(/@(\w+)\s*\{\s*([^,\s]+)/);
      if (match) {
        const type = match[1];
        const key = match[2];
        const titleMatch = block.match(/title\s*=\s*[\{"]([^"\}]+)[\}"]/i);
        const authorMatch = block.match(/author\s*=\s*[\{"]([^"\}]+)[\}"]/i);
        const yearMatch = block.match(/year\s*=\s*[\{"]?(\d+)[\}"]?/i);

        list.push({
          type,
          key,
          title: titleMatch ? titleMatch[1] : 'Untitled',
          author: authorMatch ? authorMatch[1] : 'Unknown author',
          year: yearMatch ? yearMatch[1] : '',
          raw: block.trim()
        });
      }
    }
    return list;
  }, [bibContent]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.key.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.author.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const copyCite = (key: string) => {
    const cmd = `\\cite{${key}}`;
    navigator.clipboard.writeText(cmd);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        <span>BibTeX References ({entries.length})</span>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: 9, color: 'var(--text-subtle)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search key, author, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '28px', fontSize: '11px', width: '100%' }}
          />
        </div>
      </div>

      <div className="sidebar-content" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            No bibliography records found.
          </div>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.key}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                  {entry.key}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn-icon"
                    style={{ padding: '2px 4px' }}
                    onClick={() => copyCite(entry.key)}
                    title="Copy \cite command"
                  >
                    {copiedKey === entry.key ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                  <button
                    className="btn-icon"
                    style={{ padding: '2px 4px' }}
                    onClick={() => onInsertCitation(`\\cite{${entry.key}}`)}
                    title="Insert \cite into editor"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-main)', lineHeight: 1.3, fontWeight: 500 }}>
                {entry.title}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
                {entry.author} {entry.year ? `(${entry.year})` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
