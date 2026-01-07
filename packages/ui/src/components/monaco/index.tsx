import * as monaco from 'monaco-editor';
import { useRef, useEffect } from 'react';
import './worker';

interface MonacoEditorProps {
  value?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function MonacoEditor(props: MonacoEditorProps) {
  const { className, style } = props;
  const monacoEl = useRef(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  useEffect(() => {
    // 初始化编辑器
    if (monacoEl?.current) {
      editorRef.current = monaco.editor.create(monacoEl.current!, {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join(
          '\n'
        ),
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        readOnly: true,
      });
    }
    return () => editorRef.current?.dispose();
  }, [monacoEl.current]);
  return (
    <>
      <div
        className={`w-full h-100 ${className}`}
        style={{ ...style }}
        ref={monacoEl}
      ></div>
    </>
  );
}
