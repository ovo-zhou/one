import type MarkdownIt from 'markdown-it';
import markdownit from 'markdown-it';
import hljs from 'highlight.js';
import { useMemo } from 'react';
import 'highlight.js/styles/github.css';
import './index.css';

// full options list (defaults)
const md: MarkdownIt = markdownit({
  // Enable HTML tags in source
  html: true,

  // Use '/' to close single tags (<br />).
  // This is only for full CommonMark compatibility.
  xhtmlOut: false,

  // Convert '\n' in paragraphs into <br>
  breaks: true,

  // CSS language prefix for fenced blocks. Can be
  // useful for external highlighters.
  langPrefix: 'language-',

  // Autoconvert URL-like text to links
  linkify: false,

  // Enable some language-neutral replacement + quotes beautification
  // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.mjs
  typographer: true,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: '“”‘’',

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externally.
  // If result starts with <pre... internal wrapper is skipped.
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre data-lang="${lang}" style="background-color: #f6f8fa;overflow-x: auto;padding: 16px;border-radius: 10px;font-size:0.9em; margin-bottom: 16px;">${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</pre>`;
      } catch (e) {
        console.error('Error highlighting code:', e);
      }
    }

    return (
      '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>'
    );
  },
});

interface IMarkdown {
  content: string;
}
export default function Markdown(props: IMarkdown) {
  const { content } = props;
  const useMarkdown = useMemo(() => md.render(content), [content]);
  const handleDelegatedItemClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.action === 'run') {
      const code = decodeURIComponent(target.dataset.code || '');
      console.log(code);
    }
  };
  return (
    <div
      onClick={handleDelegatedItemClick}
      className="origin-markdown"
      dangerouslySetInnerHTML={{ __html: useMarkdown }}
    />
  );
}
