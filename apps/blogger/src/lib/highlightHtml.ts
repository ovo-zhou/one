import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export async function highlightHtml(html: string): Promise<string> {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify)
    .process(html);
  return String(file);
}
