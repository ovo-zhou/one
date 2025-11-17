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
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEnabled = useRef<boolean>(false);
  const scrollToBottom = () => {
    const anchorNode = anchorRef.current;
    if (!anchorNode) {
      return;
    }
    anchorNode.scrollIntoView();
  };

  useEffect(() => {
    const chatBoxNode = chatBoxRef.current;
    const anchorNode = anchorRef.current;
    const scrollContainerNode = scrollContainerRef.current;
    if (!chatBoxNode || !anchorNode || !scrollContainerNode) {
      return;
    }

    const intersectObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scrollEnabled.current = true;
          } else {
            scrollEnabled.current = false;
          }
        });
      },
      {
        root: scrollContainerNode,
        threshold: 1,
      }
    );
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(() => {
        if (scrollEnabled.current) {
          scrollToBottom();
        }
      });
    });
    intersectObserver.observe(anchorNode);
    resizeObserver.observe(chatBoxNode);
    return () => {
      resizeObserver.unobserve(chatBoxNode);
      intersectObserver.unobserve(anchorNode);
    };
  }, []);

  return (
    <div
      className="overflow-y-auto flex-1 flex justify-center"
      style={{ scrollbarWidth: 'none' }}
      ref={scrollContainerRef}
    >
      <div className="w-3xl bg-white h-fit" ref={chatBoxRef}>
        {chatList.map((chatItem) => (
          <ChatItem
            role={chatItem.role}
            content={chatItem.content}
            key={chatItem.id}
          />
        ))}
        <div ref={anchorRef} className="h-5">
          123
        </div>
      </div>
    </div>
  );
}
