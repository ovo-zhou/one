import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatInput from "@/components/chatInput";
import ChatSidebar from "@/components/chatSidebar";
import ChatBox from "@/components/chatBox";
import { useEffect, useRef, useState } from "react";
import type { IChatItem } from "@/components/chatBox/ChatItem";
export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const formValues = location.state;
  const [chatList, setChatList] = useState<IChatItem[]>([]);
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
  // 这里接受其他页面传过来的值，直接发送消息
  useEffect(() => {
    if (formValues && hasSend.current===false) {
      setChatList([
        ...chatList,
        { id: "1", role: "user", content: formValues.message },
        { id: "2", role: "assistant", content: "..." },
      ]);
      sendMessage(formValues.agentType, formValues.message);
      hasSend.current=true
      navigate(location.pathname, { replace: true, state: null });
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
      <main className="w-full bg-amber-300 h-screen flex flex-col">
        <div className="h-14 leading-14 text-center bg-amber-800">head</div>
        <div
          className="overflow-y-auto flex-1 scroll-smooth flex justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          <ChatBox chatList={chatList} className="w-3xl bg-white h-fit" />
        </div>
        <div className="bg-amber-200 flex justify-center">
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
