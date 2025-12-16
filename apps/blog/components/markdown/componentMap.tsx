import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const components: Components = {
  code(props) {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    // 代码块
    return match ? (
      <SyntaxHighlighter
        PreTag="div"
        children={String(children)}
        language={match[1]}
        style={vscDarkPlus}
        showLineNumbers
        wrapLongLines
        customStyle={{ padding: '0px', backgroundColor: 'transparent' }}
      />
    ) : (
      // 普通代码
      <code {...rest}>{children}</code>
    );
  },
};

export default components;
