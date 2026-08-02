"use client";

import { createContext, useContext, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { highlightCode } from "../lib/highlight";

const PreContext = createContext(false);

export function Pre({ children }: { children?: ReactNode }) {
  return (
    <PreContext.Provider value={true}>
      <pre>{children}</pre>
    </PreContext.Provider>
  );
}

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  className?: string;
  children?: ReactNode;
  node?: unknown;
};

export default function CodeBlock({ node: _node, className, children, ...props }: CodeProps) {
  const inPre = useContext(PreContext);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match?.[1] || "";
  const text = String(children ?? "").replace(/\n$/, "");
  const [copied, setCopied] = useState(false);

  if (!inPre) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="code-block-header">
        <span className="code-block-lang">{lang || "code"}</span>
        <button
          type="button"
          className="code-block-copy"
          onClick={handleCopy}
          aria-label={copied ? "已复制" : "复制代码"}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <code
        className={`hljs${match ? ` language-${match[1]}` : ""}`}
        dangerouslySetInnerHTML={{ __html: highlightCode(text, match?.[1]) }}
        {...props}
      />
    </>
  );
}
