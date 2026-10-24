import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading,
  List,
  ListOrdered,
  Sigma,
  Table,
  Quote,
  Code2,
  BookmarkPlus
} from 'lucide-react';

interface EditorToolbarProps {
  onInsertSnippet: (prefix: string, suffix?: string, defaultPlaceholder?: string) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsertSnippet }) => {
  return (
    <div className="overleaf-toolbar">
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\textbf{', '}', 'bold text')}
          title="Bold (\textbf{})"
        >
          <Bold size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\textit{', '}', 'italic text')}
          title="Italic (\textit{})"
        >
          <Italic size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\underline{', '}', 'underlined text')}
          title="Underline (\underline{})"
        >
          <Underline size={14} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\section{', '}\n', 'Section Title')}
          title="Section (\section{})"
        >
          <Heading size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\subsection{', '}\n', 'Subsection Title')}
          title="Subsection (\subsection{})"
        >
          <span style={{ fontSize: '11px', fontWeight: 700 }}>H2</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\begin{equation}\n  ', '\n\\end{equation}', 'E = mc^2')}
          title="Math Equation"
        >
          <Sigma size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\begin{itemize}\n  \\item ', '\n\\end{itemize}', 'First item')}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\begin{enumerate}\n  \\item ', '\n\\end{enumerate}', 'First item')}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet(
            '\\begin{table}[htbp]\n  \\centering\n  \\caption{Table Caption}\n  \\label{tab:sample}\n  \\begin{tabular}{ll}\n    \\toprule\n    Header 1 & Header 2 \\\\\n    \\midrule\n    Row 1 & Value 1 \\\\\n    \\bottomrule\n  \\end{tabular}\n\\end{table}\n'
          )}
          title="Insert Table"
        >
          <Table size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\cite{', '}', 'citation_key')}
          title="Insert Citation (\cite{})"
        >
          <Quote size={14} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onInsertSnippet('\\label{', '}', 'sec:label')}
          title="Insert Cross-Reference Label (\label{})"
        >
          <BookmarkPlus size={14} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
        <span className="overleaf-mode-badge">
          <Code2 size={12} /> Source
        </span>
      </div>
    </div>
  );
};
