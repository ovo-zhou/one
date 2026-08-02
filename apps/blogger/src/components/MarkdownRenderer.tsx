import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box } from "@mantine/core";
import CodeBlock, { Pre } from "./CodeBlock";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <Box className="prose-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ code: CodeBlock, pre: Pre }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
