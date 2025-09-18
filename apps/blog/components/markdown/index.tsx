import ReactMarkdown from "react-markdown";
import components from "./componentMap";  
export default function Markdown_({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
