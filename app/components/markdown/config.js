/**
 * markdown 自定义渲染
 */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus as theme } from "react-syntax-highlighter/dist/esm/styles/prism";
import Copy from "../copy";
export const components = {
  code(props) {
    const { children, className, node, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <div className="bg-[rgb(30,30,30)]">
        <div className="flex justify-end text-white p-4">
          <Copy text={children}></Copy>
        </div>

        <SyntaxHighlighter
          {...rest}
          PreTag="div"
          showLineNumbers
          language={match[1]}
          style={theme}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code {...rest} className={className}>
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
