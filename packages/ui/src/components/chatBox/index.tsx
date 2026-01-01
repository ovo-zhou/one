import { ChatItem, type IChatItem } from './ChatItem';
import { useEffect, useRef } from 'react';

interface IChatBox {
  chatList: IChatItem[];
}

/**
 * 聊天盒子
 * @param props 聊天列表
 * @returns
 */
export default function ChatBox(props: IChatBox) {
  const { chatList } = props;
  // 聊天容器
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) {
      return;
    }
    const isAtBottom =
      chatContainer.scrollHeight - chatContainer.scrollTop <=
      chatContainer.clientHeight + 10;
    console.log(isAtBottom);
    if (isAtBottom) {
      chatContainer.scrollTop =
        chatContainer.scrollHeight - chatContainer.clientHeight;
    }
  };

  useEffect(() => {
    const chatBoxNode = chatBoxRef.current;
    if (!chatBoxNode) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(() => {
        scrollToBottom();
      });
    });
    resizeObserver.observe(chatBoxNode);
    return () => {
      resizeObserver.unobserve(chatBoxNode);
    };
  }, []);

  return (
    <div
      className="overflow-y-auto flex-1 flex flex-col mx-auto"
      style={{ scrollbarWidth: 'none' }}
      ref={chatContainerRef}
    >
      <div className="w-3xl bg-white" ref={chatBoxRef}>
        {chatList.map((chatItem) => (
          <ChatItem
            role={chatItem.role}
            content={chatItem.content}
            key={chatItem.id}
          />
        ))}
      </div>
    </div>
  );
}
