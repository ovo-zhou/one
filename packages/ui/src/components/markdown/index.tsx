import React from 'react';
import md from './markdown'
interface IMarkdown {
  content: string;
}
export default function Markdown(props: IMarkdown) {
  const { content } = props;
  return (
    <div
      dangerouslySetInnerHTML={{ __html: md.render(content) }}
    ></div>
  );
}
