import * as monaco from 'monaco-editor';
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './worker';

interface MonacoEditorProps {
  defaultValue?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface MonacoEditorRef {
  getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
}

/**
 * 非受控组件
 */
const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(
  (props, ref) => {
    const { className, style, defaultValue, readOnly = false } = props;

    const monacoEl = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
    }));

    useEffect(() => {
      // 初始化编辑器
      if (monacoEl.current && !editorRef.current) {
        editorRef.current = monaco.editor.create(monacoEl.current, {
          value: defaultValue || '',
          language: 'typescript',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          readOnly: readOnly,
        });
      }
      return () => {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
      };
    }, [defaultValue, readOnly]);

    return (
      <div
        className={`w-full h-200 ${className}`}
        style={{ ...style }}
        ref={monacoEl}
      ></div>
    );
  }
);

MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor;
