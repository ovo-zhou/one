import { useEffect, useState } from 'react';
import { sandboxEvents$ } from '@/services/sandbox';
import { Code, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '../ui/button-group';
import CodeBlock from '../codeBlock';

export default function Sandbox() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(true);
  const handleClose = () => {
    setHtmlContent(null);
  };
  const handleSwitchMode = (preview: boolean) => {
    setIsPreview(preview);
  };
  useEffect(() => {
    const subscription = sandboxEvents$.subscribe((code) => {
      setHtmlContent(code);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  if (!htmlContent) {
    return null;
  }
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="text-center flex gap-4 p-2 bg-gray-100">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            handleClose();
          }}
        >
          <X size={16} />
        </Button>
        <ButtonGroup>
          <Button
            size="sm"
            variant={isPreview ? 'default' : 'outline'}
            onClick={() => {
              handleSwitchMode(true);
            }}
          >
            <Eye size={16} />
            预览
          </Button>
          <Button
            size="sm"
            variant={!isPreview ? 'default' : 'outline'}
            onClick={() => {
              handleSwitchMode(false);
            }}
          >
            <Code size={16} />
            源代码
          </Button>
        </ButtonGroup>
      </div>
      {isPreview ? (
        <iframe
          className="flex-1"
          sandbox="allow-scripts"
          srcDoc={htmlContent}
        ></iframe>
      ) : (
        <CodeBlock code={htmlContent} lang="html" />
      )}
    </div>
  );
}
