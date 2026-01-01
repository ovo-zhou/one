import { ButtonGroup } from '@/components/ui/button-group';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';

export default function JsonParse() {
  const navigate = useNavigate();
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
            <Button variant="outline" size="sm">
              清空
            </Button>
            <Button variant="outline" size="sm">
              深度解析
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
      <Group orientation="horizontal" className="flex-1 px-4 pb-4 pt-0">
        <Panel defaultSize={300} minSize={300}>
          <div>侧边栏内容</div>
        </Panel>
        <Separator className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors" />
        <Panel defaultSize={300} minSize={300}>
          <div>主区域内容</div>
        </Panel>
      </Group>
    </div>
  );
}
