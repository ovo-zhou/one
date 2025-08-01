import MarkdownIt from "markdown-it";
import hljs from 'highlight.js';
import 'highlight.js/styles/hybrid.css';
const md: MarkdownIt = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch (e) {
        console.error(e);
        return `<pre class="hljs"><code>${md.utils.escapeHtml('code render fail')}</code></pre>`;
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});
export default md;