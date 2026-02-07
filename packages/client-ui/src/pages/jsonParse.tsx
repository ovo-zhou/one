import { ButtonGroup } from '@/components/ui/button-group';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';
import MonacoEditor, { type MonacoEditorRef } from '@/components/monaco';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState, useEffect } from 'react';

export default function JsonParse() {
  const navigate = useNavigate();
  const [jsonString, setJsonString] = useState('');
  const editorRef = useRef<MonacoEditorRef>(null);
  const handleParse = (str: string) => {
    try {
      if (str.trim() === '') {
        editorRef.current?.getEditor()?.setValue('');
        return;
      }
      const json = JSON.parse(str);
      editorRef.current?.getEditor()?.setValue(JSON.stringify(json, null, 2));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      editorRef.current?.getEditor()?.setValue(message);
    }
  };
  useEffect(() => {
    handleParse(jsonString);
  }, [jsonString]);
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="p-4">
        <ButtonGroup>
          <ButtonGroup>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate('/');
              }}
            >
              <ArrowLeft />
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setJsonString('');
              }}
            >
              清空
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
      <Group orientation="horizontal" className="flex-1 px-4 pb-4 pt-0">
        <Panel defaultSize={300} minSize={300}>
          <Textarea
            className="h-full"
            placeholder="输入 json 字符串"
            value={jsonString}
            onChange={(e) => {
              setJsonString(e.target.value);
            }}
          />
        </Panel>
        <Separator className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors mx-4" />
        <Panel defaultSize={300} minSize={300}>
          <div>
            <MonacoEditor
              style={{ height: 'calc(100vh - var(--spacing) * 20)' }}
              readOnly
              ref={editorRef}
              language="json"
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}
