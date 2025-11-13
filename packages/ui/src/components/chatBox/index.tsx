import { ChatItem, type IChatItem } from './ChatItem';
import { useEffect, useRef } from 'react';

interface IChatBox {
  className?: string;
  chatList: IChatItem[];
}

/**
 * 聊天盒子
 * @param props 聊天列表
 * @returns
 */
export default function ChatBox(props: IChatBox) {
  const { className, chatList } = props;
  // 聊天容器
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  /**
   * 自动滚动逻辑
   * 如果用户手动滚动到上面，流式输出时，不滚动
   * 如果用户手动滚动到下面，流式输出时，滚动到下面
   * 用户发送消息时，滚动到下面
   * @returns
   */
  const scrollToBottom = () => {
    const anchorNode = anchorRef.current;
    if (!anchorNode) {
      return;
    }
    anchorNode.scrollIntoView();
  };

  useEffect(() => {
    const chatBoxNode = chatBoxRef.current;
    if (!chatBoxNode) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        // const { height } = entry.contentRect;
        // console.log(`高度变化为: ${height}px`);
        scrollToBottom();
      });
    });
    resizeObserver.observe(chatBoxNode);
    return () => {
      resizeObserver.unobserve(chatBoxNode);
    };
  }, []);

  return (
    <div className={className} ref={chatBoxRef}>
      {chatList.map((chatItem) => (
        <ChatItem
          role={chatItem.role}
          content={chatItem.content}
          key={chatItem.id}
        />
      ))}
      <div ref={anchorRef} className="h-5"></div>
    </div>
  );
}
