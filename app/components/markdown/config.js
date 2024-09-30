/**
 * markdown 自定义渲染
 */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus as theme } from "react-syntax-highlighter/dist/esm/styles/prism";
export const components = {
  code(props) {
    const { children, className, node, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <SyntaxHighlighter
        {...rest}
        PreTag="div"
        showLineNumbers
        language={match[1]}
        style={theme}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code
        {...rest}
        className={`${className} bg-gray-200 py-1 px-2 rounded-md border border-gray-300`}
      >
        {children}
      </code>
    );
  },
  a(props) {
    const { children, href } = props;
    return (
      <a href={href} className="text-blue-700 underline">
        {children}
      </a>
    );
  },
};
