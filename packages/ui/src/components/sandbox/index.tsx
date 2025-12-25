import { useEffect, useState } from 'react';
import { sandboxEvents$ } from '@/services/sandbox';

export default function Sandbox() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
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
    <iframe
      style={{ width: '100%', height: '100%' }}
      sandbox="allow-scripts"
      srcDoc={htmlContent}
    ></iframe>
  );
}
