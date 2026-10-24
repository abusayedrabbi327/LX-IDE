import React, { useMemo } from 'react';
import { AlignLeft } from 'lucide-react';

interface OutlineItem {
  title: string;
  level: number;
  line: number;
}

interface FileOutlineProps {
  content: string;
  onJumpToLine: (line: number) => void;
}

export const FileOutline: React.FC<FileOutlineProps> = ({ content, onJumpToLine }) => {
  const outlineItems: OutlineItem[] = useMemo(() => {
    if (!content) return [];
    const items: OutlineItem[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('%')) return;

      const secMatch = trimmed.match(/\\(section|subsection|subsubsection|chapter|paragraph)\*?\{([^}]+)\}/);
      if (secMatch) {
        const type = secMatch[1];
        const title = secMatch[2].replace(/\\([a-zA-Z]+)/g, '').trim();
        const level = type === 'chapter' ? 0 : type === 'section' ? 1 : type === 'subsection' ? 2 : 3;
        items.push({
          title,
          level,
          line: index + 1
        });
      }
    });

    return items;
  }, [content]);

  return (
    <div className="file-outline-section">
      <div className="file-outline-header">
        <AlignLeft size={13} />
        <span>File Outline</span>
        <span style={{ fontSize: '10px', color: 'var(--text-subtle)', marginLeft: 'auto' }}>
          {outlineItems.length}
        </span>
      </div>

      <div className="file-outline-list">
        {outlineItems.length === 0 ? (
          <div style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-subtle)' }}>
            No sections detected in this file.
          </div>
        ) : (
          outlineItems.map((item, idx) => (
            <div
              key={idx}
              className={`outline-item level-${item.level}`}
              onClick={() => onJumpToLine(item.line)}
              title={`Jump to line ${item.line}`}
            >
              <span className="outline-bullet">•</span>
              <span className="outline-title">{item.title}</span>
              <span className="outline-line">L{item.line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
