import React, { useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import './Editor.css';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TimelineEditor: React.FC<EditorProps> = ({ value, onChange }) => {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    // Register the timeline language
    monaco.languages.register({ id: 'timeline' });

    // Define syntax highlighting rules
    monaco.languages.setMonarchTokensProvider('timeline', {
      tokenizer: {
        root: [
          [/^track\s+/, 'keyword'],
          [/^row\s+/, 'keyword'],
          [/^bar\s+/, 'keyword'],
          [/^point\s+/, 'keyword'],
          [/^milestone\s+/, 'keyword'],
          [/recurring\s+/, 'keyword'],
          [/weekly|monthly|daily|yearly/, 'recurrence'],
          [/"[^"]*"/, 'string'],
          [/[0-9]{4}-[0-9]{2}-[0-9]{2}/, 'date'],
          [/color:\s*[a-z]+/, 'color'],
          [/shape:\s*[a-z]+/, 'shape'],
          [/from\s+/, 'keyword'],
          [/to\s+/, 'keyword'],
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
            insertText: 'point "${1:name}" at ${2:YYYY-MM-DD} color ${3:blue} shape ${4:circle}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a point to a row',
            range
          },
          {
            label: 'recurring point',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'recurring point "${1:name}" ${2:weekly|monthly|daily|yearly} from ${3:YYYY-MM-DD} to ${4:YYYY-MM-DD} color:${5:blue} shape:${6:circle}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add a recurring point to a row',
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
    monaco.editor.setModelLanguage(editor.getModel(), 'timeline');
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