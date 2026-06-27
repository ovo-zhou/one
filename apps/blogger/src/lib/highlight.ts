import hljs from "highlight.js/lib/core";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";

const languages = {
  javascript,
  typescript,
  xml,
  css,
  json,
  bash,
  markdown,
  plaintext,
};

export const lowlight = createLowlight(languages);

Object.entries(languages).forEach(([name, def]) => {
  hljs.registerLanguage(name, def);
});

hljs.registerAliases(["js", "jsx"], { languageName: "javascript" });
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["html", "xhtml", "vue", "svg"], { languageName: "xml" });
hljs.registerAliases(["sh", "shell"], { languageName: "bash" });
hljs.registerAliases(["md"], { languageName: "markdown" });
hljs.registerAliases(["text", "txt"], { languageName: "plaintext" });

export function highlightCode(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language }).value;
  }
  return hljs.highlightAuto(code).value;
}

export { hljs };
