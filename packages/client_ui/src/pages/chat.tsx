import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatInput from "@/components/chatInput";
import ChatSidebar from "@/components/chatSidebar";
import ChatBox from "@/components/chatBox";
import { use, useEffect, useRef, useState } from "react";
import type { IChatItem } from "@/components/chatBox";
export default function Chat() {
  const location = useLocation();
  const formValues = location.state;
  const [chatList, setChatList] = useState<IChatItem[]>([]);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const hasSend = useRef<boolean>(false);
  const sendMessage = (agent: string, message: string) => {
    setChatList([
      ...chatList,
      {
        id: (+new Date() - 10).toString(),
        role: "user",
        content: message,
      },
      { id: (+new Date() + 10).toString(), role: "assistant", content: "..." },
    ]);
    window.agent.sendMessage(agent, message);
  };
  useEffect(() => {
    const chatBoxElement = chatBoxRef.current;
    if (chatBoxElement) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          console.log("新高度:", entry.contentRect.height);
          // 在这里处理高度变化
        }
      });
      resizeObserver.observe(chatBoxElement);
      return () => {
        resizeObserver.unobserve(chatBoxElement);
      };
    }
  }, []);
  // 这里接受其他页面传过来的值，直接发送消息
  useEffect(() => {
    if (formValues && hasSend.current === false) {
      setChatList([
        ...chatList,
        { id: "1", role: "user", content: formValues.message },
        { id: "2", role: "assistant", content: "..." },
      ]);
      sendMessage(formValues.agentType, formValues.message);
      hasSend.current = true;
    }
  }, []);
  useEffect(() => {
    let content = "";
    const off = window.agent.onMessage((data: string) => {
      const message: IChatItem = JSON.parse(data);
      // 空字符串意味发送结束
      if (!message) {
        content = "";
        return;
      }
      content += message.content;
      setChatList((pre) => {
        const newChatList = [...pre];
        const lastChatItem = newChatList[newChatList.length - 1];
        lastChatItem.id = message.id;
        lastChatItem.role = message.role;
        lastChatItem.content = content;
        return newChatList;
      });
    });
    return () => {
      off();
    };
  }, []);
  return (
    <SidebarProvider>
      <ChatSidebar />
      <main className="w-full">
        <div className="w-full h-14 leading-14 text-center bg-amber-800">
          head
        </div>
        <div
          className="w-full overflow-x-scroll flex justify-center"
          style={{height:"calc(100vh - 216px)"}}
          ref={chatBoxRef}
        >
          <ChatBox chatList={chatList} className="w-3xl max-w-3xl"/>
        </div>
        <div className="w-full bg-amber-200 flex justify-center">
          <ChatInput
            submit={(values) => {
              sendMessage(values.type, values.message);
            }}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
