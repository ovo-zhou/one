import Markdown from 'react-markdown'
import remarkGfm from "remark-gfm"
import { components } from './config'

export default function MarkdownRender(props) {
  return <Markdown
    remarkPlugins={[remarkGfm]}
    components={components}
  >{props.children}</Markdown>
}