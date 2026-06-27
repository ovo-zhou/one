import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlightCode } from "../lib/highlight";

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  className?: string;
  children?: ReactNode;
};

function CodeBlock({ className, children, ...props }: CodeProps) {
  const match = /language-(\w+)/.exec(className || "");
  const text = String(children ?? "").replace(/\n$/, "");
  if (match || text.includes("\n")) {
    return (
      <code
        className={`hljs${match ? ` language-${match[1]}` : ""}`}
        dangerouslySetInnerHTML={{ __html: highlightCode(text, match?.[1]) }}
        {...props}
      />
    );
  }
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
