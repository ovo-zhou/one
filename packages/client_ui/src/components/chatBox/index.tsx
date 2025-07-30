import { ChatItem, type IChatItem } from "./ChatItem";
import { useEffect, useRef } from "react";
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
  const chatBoxRef= useRef<HTMLDivElement>(null)
  const anchorRef=useRef<HTMLDivElement>(null)
  const scrollToBottom=()=>{
    const anchorNode=anchorRef.current;
    if(!anchorNode){
      return;
    }
    console.log('滚动进入视图')
    anchorNode.scrollIntoView()
  }
  useEffect(() => {
    const chatBoxNode = chatBoxRef.current;
    if (!chatBoxNode) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { height } = entry.contentRect;
        console.log(`高度变化为: ${height}px`);
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
      <div ref={anchorRef}>这个div做滚动进入视图</div>
    </div>
  );
}

