'use client';
import ReactMarkdown from 'react-markdown';
import components from './componentMap';
import remarkGfm from 'remark-gfm';
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
