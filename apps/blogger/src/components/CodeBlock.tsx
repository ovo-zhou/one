"use client";

import classes from "./CodeBlock.module.css";
import { createContext, useContext, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { Box, Group, Text } from "@mantine/core";
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
      <Group className={classes.header} justify="space-between" wrap="nowrap" gap={0} py={8} px={14} ff="monospace">
        <Text component="span" fz={12} c="#a1a1b5" fw={600} tt="lowercase" lts="0.05em">{lang || "code"}</Text>
        <Box
          component="button"
          type="button"
          className={classes.copy}
          display="inline-flex"
          py={4}
          px={10}
          bdrs={6}
          fz={12}
          ff="inherit"
          style={{ alignItems: "center", gap: 5, cursor: "pointer" }}
          onClick={handleCopy}
          aria-label={copied ? "已复制" : "复制代码"}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "已复制" : "复制"}
        </Box>
      </Group>
      <code
        className={`hljs${match ? ` language-${match[1]}` : ""}`}
        dangerouslySetInnerHTML={{ __html: highlightCode(text, match?.[1]) }}
        {...props}
      />
    </>
  );
}
