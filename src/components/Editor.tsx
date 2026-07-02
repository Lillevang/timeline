import React, { useCallback, useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { ParseError } from '../utils/parser';
import './Editor.css';

type CodeEditor = Parameters<OnMount>[0];

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: ParseError[];
}

const TimelineEditor: React.FC<EditorProps> = ({ value, onChange, errors = [] }) => {
  const editorRef = useRef<CodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const errorsRef = useRef<ParseError[]>(errors);
  errorsRef.current = errors;

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const applyMarkers = (monaco: Monaco, codeEditor: CodeEditor, parseErrors: ParseError[]) => {
    const model = codeEditor.getModel();
    if (!model) return;
    const lineCount = model.getLineCount();
    const markers = parseErrors
      .filter(e => e.line >= 1 && e.line <= lineCount)
      .map(e => ({
        severity: monaco.MarkerSeverity.Error,
        message: e.message,
        startLineNumber: e.line,
        startColumn: 1,
        endLineNumber: e.line,
        endColumn: model.getLineMaxColumn(e.line),
      }));
    monaco.editor.setModelMarkers(model, 'timeline-dsl', markers);
  };

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      applyMarkers(monacoRef.current, editorRef.current, errors);
    }
  }, [errors]);

  const handleEditorDidMount = useCallback((codeEditor: CodeEditor, monaco: Monaco) => {
    editorRef.current = codeEditor;
    monacoRef.current = monaco;

    // Register the timeline language
    monaco.languages.register({ id: 'timeline' });

    // Define syntax highlighting rules
    monaco.languages.setMonarchTokensProvider('timeline', {
      tokenizer: {
        root: [
          [/^window\s+/, 'keyword'],
          [/^track\s+/, 'keyword'],
          [/^row\s+/, 'keyword'],
          [/^bar\s+/, 'keyword'],
          [/^point\s+/, 'keyword'],
          [/^milestone\s+/, 'keyword'],
          [/recurring\s+/, 'keyword'],
          [/weekly|monthly|daily|yearly/, 'recurrence'],
          [/"[^"]*"/, 'string'],
          [/[0-9]{4}-[0-9]{2}-[0-9]{2}/, 'date'],
          [/\bcolor\s+(#[0-9a-fA-F]+|\w+)/, 'color'],
          [/\bshape\s+[a-z-]+/, 'shape'],
          [/\bfrom\s+/, 'keyword'],
          [/\bto\s+/, 'keyword'],
          [/\bat\s+/, 'keyword'],
          [/#.*$/, 'comment'],
        ]
      }
    });

    // Define auto-completion
    monaco.languages.registerCompletionItemProvider('timeline', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          {
            label: 'window',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'window from ${1:YYYY-MM-DD} to ${2:YYYY-MM-DD}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Set the visible date range for the timeline',
            range
          },
          {
            label: 'track',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'track "${1:name}"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Define a new track',
            range
          },
          {
            label: 'row',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'row "${1:name}"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Define a new row within a track',
            range
          },
          {
            label: 'bar',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'bar "${1:name}" from ${2:YYYY-MM-DD} to ${3:YYYY-MM-DD} color ${4:blue}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a bar to a row',
            range
          },
          {
            label: 'point',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'point "${1:name}" at ${2:YYYY-MM-DD} shape ${3:circle} color ${4:blue}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a point to a row',
            range
          },
          {
            label: 'recurring point',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'recurring point "${1:name}" ${2:weekly} from ${3:YYYY-MM-DD} to ${4:YYYY-MM-DD} shape ${5:circle} color ${6:blue}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a recurring point to a row (daily, weekly, monthly or yearly)',
            range
          },
          {
            label: 'milestone',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'milestone "${1:name}" at ${2:YYYY-MM-DD} color ${3:blue}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a milestone',
            range
          }
        ];
        return { suggestions };
      }
    });

    // Set the editor language
    const model = codeEditor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, 'timeline');
    }

    // Apply markers for errors present at mount time
    applyMarkers(monaco, codeEditor, errorsRef.current);
  }, []);

  return (
    <div className="editor">
      <div className="editor-header">
        <h2>Timeline DSL</h2>
      </div>
      <div className="editor-content">
        <Editor
          height="100%"
          defaultLanguage="timeline"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            fontSize: 14,
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'selection',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
            },
          }}
          theme="vs-light"
        />
      </div>
    </div>
  );
};

export default TimelineEditor;
