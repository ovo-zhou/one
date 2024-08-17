import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus as theme } from "react-syntax-highlighter/dist/esm/styles/prism"

export default function MarkdownRender(props) {
  return <Markdown
    remarkPlugins={[remarkGfm]}
    components={{
      code(props) {
        const { children, className, node, ...rest } = props
        const match = /language-(\w+)/.exec(className || '')
        return match ? (
          <SyntaxHighlighter
            {...rest}
            PreTag="div"
            showLineNumbers
            language={match[1]}
            style={theme}
          >{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
        ) : (
          <code {...rest} className={className}>
            {children}
          </code>
        )
      }
    }}
  >{props.children}</Markdown>
}