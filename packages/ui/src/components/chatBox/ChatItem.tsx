import Markdown from '../markdown';
import CopyIcon from '../copy';
export interface IChatItem {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
}
/**
 * 聊天项
 * @param props
 * @returns
 */
export function ChatItem(
  props: Pick<IChatItem, 'role' | 'content'> & {
    openSandbox: (content: string) => void;
  }
) {
  const { role, content, openSandbox } = props;
  const renderMessage = () => {
    if (role === 'user') {
      return (
        <div className="flex justify-end py-2">
          <div className="p-2 rounded-tl-lg rounded-tr-none rounded-br-lg rounded-bl-lg">
            <pre>{content}</pre>
          </div>
        </div>
      );
    }
    return (
      <div className="py-2">
        <Markdown content={content} openSandbox={openSandbox} />
      </div>
    );
  };

  return (
    <div className="group">
      {renderMessage()}
      {/* 按钮组合 */}
      <div
        className={`flex gap-2 invisible group-hover:visible ${
          role === 'user' ? 'justify-end' : 'justify-start'
        }`}
      >
        <CopyIcon text={content} />
      </div>
    </div>
  );
}
