import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface HProps {
  children: React.ReactNode;
  level: number;
}

const classNameOptions: string[] = [
  'text-4xl font-extrabold tracking-tight text-balance',
  'border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  'text-2xl font-semibold tracking-tight',
  'text-xl font-semibold tracking-tight',
];

// h1 到 h6 标题组件
const H = (props: HProps) => {
  const { children, level } = props;
  return (
    <div
      id={encodeURIComponent(children?.toString() || '')}
      className={`${classNameOptions[level - 1]} group cursor-pointer`}
    >
      <a href={`#${encodeURIComponent(children?.toString() || '')}`}>
        {children}
      </a>
      <span
        onClick={async (e) => {
          e.stopPropagation();
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
    console.log('props', props);
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
  p(props) {
    const { children } = props;
    return <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>;
  },
  code(props) {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    // 代码块
    return match ? (
      <SyntaxHighlighter
        PreTag="div"
        children={String(children).replace(/\n$/, '')}
        language={match[1]}
        style={vscDarkPlus}
      />
    ) : (
      // 普通代码
      <code {...rest} className="bg-gray-200 dark:bg-black  px-1 rounded">
        {children}
      </code>
    );
  },
  blockquote(props) {
    const { children } = props;
    return (
      <blockquote className="mt-6 border-l-2 pl-6 italic">
        {children}
      </blockquote>
    );
  },
  table(props) {
    const { children } = props;
    return (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full">{children}</table>
      </div>
    );
  },
  tr(props) {
    return <tr className="even:bg-muted m-0 border-t p-0">{props.children}</tr>;
  },
  th(props) {
    return (
      <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right">
        {props.children}
      </th>
    );
  },
  td(props) {
    return (
      <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right">
        {props.children}
      </td>
    );
  },
  ul(props) {
    const { children } = props;
    return <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
  },
  ol(props) {
    const { children } = props;
    return <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
  },
  li(props) {
    const { children } = props;
    return <li>{children}</li>;
  },
  a(props) {
    const { href, children } = props;
    return (
      <a
        href={href}
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
};

export default components;
