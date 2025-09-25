'use client';
import ReactMarkdown from "react-markdown";
import components from "./componentMap";
import { useEffect } from "react";
import remarkGfm from "remark-gfm";
export default function Markdown({ children }: { children: string }) {
  const hash = window.location.hash.slice(1);
  
  useEffect(() => {
    if (hash) {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [hash]);
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
