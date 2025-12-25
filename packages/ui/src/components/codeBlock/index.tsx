import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
export default function CodeBlock({
  code,
  lang,
}: {
  code: string;
  lang: string;
}) {
  const html = hljs.highlight(code, {
    language: lang,
    ignoreIllegals: true,
  }).value;
  return (
    <div className="flex-1 overflow-auto text-wrap break-all rounded-md bg-gray-100 p-4">
      <pre
        className="text-wrap break-all p-4 rounded-md"
        style={{ backgroundColor: '#f6f8fa' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
