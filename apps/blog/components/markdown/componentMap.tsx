import { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
interface HProps {
  children: React.ReactNode;
  level: number;
}
const classNameOptions: string[] = [
  "text-[clamp(1.8rem,4vw,2.5rem)] font-bold  leading-tight mb-4",
  "text-[clamp(1.5rem,3.5vw,2rem)] font-bold leading-tight mb-3",
  "text-[clamp(1.3rem,3vw,1.75rem)] font-bold leading-tight mb-2",
  "text-[clamp(1.15rem,2.5vw,1.5rem)] font-semibold leading-tight mb-1",
  "text-[clamp(1rem,2vw,1.25rem)] font-semibold leading-tight mb-0.5",
  "text-[clamp(0.9rem,1.5vw,1.1rem)] font-semibold leading-tight mb-0.25",
];
// h1 到 h6 标题组件
const H = (props: HProps) => {
  const { children, level } = props;
  const encodeTitleToHash = (title: string) => {
    // 使用一个简单的哈希算法
    let hash = 0;
    if (title.length === 0) return `h-${hash}`;

    for (let i = 0; i < title.length; i++) {
      const char = title.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }

    // 使用绝对值并转换为16进制
    return `h-${Math.abs(hash).toString(16).substring(0, 8)}`;
  };
  return (
    <div
      id={encodeTitleToHash(children?.toString() || "")}
      onClick={() => {
        window.location.hash = encodeTitleToHash(children?.toString() || "");
      }}
      className={`${classNameOptions[level - 1]} group cursor-pointer`}
    >
      {children}
      <span
        onClick={async (e) => {
        e.stopPropagation()
          navigator.clipboard.writeText(window.location.href);
        }}
        className="hidden group-hover:text-blue-300 group-hover:inline-block ml-2 underline"
      >
        #
      </span>
    </div>
  );
};
const components: Components = {
  h1(props) {
    const { children } = props;
    return <H level={1}>{children}</H>;
  },
  h2(props) {
    const { children } = props;
    return <H level={2}>{children}</H>;
  },
  h3(props) {
    const { children } = props;
    return <H level={3}>{children}</H>;
  },
  h4(props) {
    const { children } = props;
    return <H level={4}>{children}</H>;
  },
  h5(props) {
    const { children } = props;
    return <H level={5}>{children}</H>;
  },
  h6(props) {
    const { children } = props;
    return <H level={6}>{children}</H>;
  },
  code(props) {
    const { children, className, node, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <SyntaxHighlighter
        PreTag="div"
        children={String(children).replace(/\n$/, "")}
        language={match[1]}
        style={vscDarkPlus}
      />
    ) : (
      <code {...rest} className={className}>
        {children}
      </code>
    );
  },
  blockquote(props) {
    const { children } = props;
    return <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{children}</blockquote>;
  },
};
export default components;
