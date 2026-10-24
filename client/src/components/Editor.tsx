import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  jumpToLine?: number | null;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, onSave, jumpToLine }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const isExternalUpdate = useRef(false);

  // LaTeX autocompletion completions
  const latexCompletions = [
    { label: '\\begin{equation}', type: 'snippet', detail: 'Numbered equation' },
    { label: '\\begin{figure}', type: 'snippet', detail: 'Floating figure' },
    { label: '\\begin{table}', type: 'snippet', detail: 'Floating table' },
    { label: '\\begin{itemize}', type: 'snippet', detail: 'Bullet list' },
    { label: '\\begin{enumerate}', type: 'snippet', detail: 'Numbered list' },
    { label: '\\section{}', type: 'function', detail: 'Top-level section' },
    { label: '\\subsection{}', type: 'function', detail: 'Subsection' },
    { label: '\\label{}', type: 'function', detail: 'Cross-reference label' },
    { label: '\\ref{}', type: 'function', detail: 'Cross-reference link' },
    { label: '\\cite{}', type: 'function', detail: 'Citation reference' },
    { label: '\\includegraphics{}', type: 'function', detail: 'Insert graphic' },
    { label: '\\usepackage{}', type: 'function', detail: 'Import LaTeX package' }
  ];

  function latexAutocomplete(context: any) {
    const word = context.matchBefore(/\\?[a-zA-Z]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options: latexCompletions
    };
  }

  useEffect(() => {
    if (!editorRef.current) return;

    // Custom dark theme for PrismForge
    const customTheme = EditorView.theme({
      '&': {
        height: '100%',
        backgroundColor: 'var(--bg-editor)',
        color: 'var(--text-main)',
        fontSize: '13.5px'
      },
      '.cm-content': {
        fontFamily: 'var(--font-mono)',
        padding: '16px 0',
        caretColor: '#818cf8'
      },
      '.cm-cursor': {
        borderLeftColor: '#818cf8',
        borderLeftWidth: '2px'
      },
      '.cm-gutters': {
        backgroundColor: 'var(--bg-editor)',
        color: 'var(--text-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        paddingRight: '8px'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        color: '#818cf8'
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(99, 102, 241, 0.3) !important'
      }
    });

    const saveShortcut = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          if (onSaveRef.current) onSaveRef.current();
          return true;
        }
      }
    ]);

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ override: [latexAutocomplete] }),
        highlightSelectionMatches(),
        oneDark,
        customTheme,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab
        ]),
        saveShortcut,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isExternalUpdate.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update doc if changed externally (e.g. switching files or applying AI patch)
  useEffect(() => {
    if (!viewRef.current) return;
    const currentDoc = viewRef.current.state.doc.toString();
    if (content !== currentDoc) {
      isExternalUpdate.current = true;
      viewRef.current.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content }
      });
      isExternalUpdate.current = false;
    }
  }, [content]);

  // Jump to line when requested (e.g. clicking compiler error or diagnostics issue)
  useEffect(() => {
    if (!viewRef.current || !jumpToLine) return;
    const line = Math.max(1, Math.min(jumpToLine, viewRef.current.state.doc.lines));
    const lineInfo = viewRef.current.state.doc.line(line);
    viewRef.current.dispatch({
      selection: { anchor: lineInfo.from },
      scrollIntoView: true
    });
    viewRef.current.focus();
  }, [jumpToLine]);

  return <div ref={editorRef} className="codemirror-wrapper" />;
};
