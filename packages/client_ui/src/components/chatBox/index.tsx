import Markdown from "../markdown";
interface IChatBox {
  className?: string;
  chatList: IChatItem[];
}
export interface IChatItem {
  id:string;
  role: "user" | "system" | "assistant";
  content: string;
}
/**
 * 聊天盒子
 * @param props 聊天列表
 * @returns 
 */
export default function ChatBox(props: IChatBox) {
  const { className, chatList } = props;
  return (
    <div className={className}>
      {chatList.map((chatItem) => (
        <ChatItem
          role={chatItem.role}
          content={chatItem.content}
          key={chatItem.id}
        />
      ))}
    </div>
  );
}
/**
 * 聊天项
 * @param props 
 * @returns 
 */
export function ChatItem(props: Pick<IChatItem,'role'|'content'>) {
  const { role, content } = props;
  const renderMessage = () => {
    if (role === "user") {
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
        <div className="p-2 rounded-tl-none rounded-tr-lg rounded-br-lg rounded-bl-lg">
          <Markdown content={content} />
        </div>
      </div>
    );
  };

  return (
    <div className="group">
      {renderMessage()}
      {/* 按钮组合 */}
      <div
        className={`flex gap-2 invisible group-hover:visible ${
          role === "user" ? "justify-end" : "justify-start"
        }`}
      >
        <svg
          className="cursor-pointer"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
          <path
            fillRule="evenodd"
            d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
          />
        </svg>
        <svg
          className="cursor-pointer"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
        </svg>
      </div>
    </div>
  );
}
