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
  const sendMessage = (agentId: string, message: string) => {
    setChatList([
      ...chatList,
      {
        id: (+new Date() - 10).toString(),
        role: "user",
        content: message,
      },
      { id: (+new Date() + 10).toString(), role: "assistant", content: "..." },
    ]);
    window.agent.chat({ agentId, message });
  };
  // 这里接受其他页面传过来的值，直接发送消息，需要加入会话的概念
  // 从首页条状过来，新创建一个绘画，然后发送消息
  // 第一次对话完成后，更新绘画标题为用户输入的内容
  useEffect(() => {
    if (formValues && hasSend.current === false) {
      setChatList((pre) => [
        ...pre,
        {
          id: (+new Date() - 10).toString(),
          role: "user",
          content: formValues.message,
        },
        {
          id: (+new Date() + 10).toString(),
          role: "assistant",
          content: "...",
        },
      ]);
      sendMessage(formValues.agentId, formValues.message);
      hasSend.current = true;
      // 清空导航栏的 state
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []);
  useEffect(() => {
    const off = window.agent.onMessage((data) => {
      if (data.finish) {
        return;
      }
      setChatList((pre) => {
        const newChatList = [...pre];
        const lastChatItem = newChatList[newChatList.length - 1];
        lastChatItem.id = data.id;
        lastChatItem.role = data.role as IChatItem["role"];
        lastChatItem.content = data.content;
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
            initAgentId={formValues?.agentId}
            submit={(values) => {
              sendMessage(values.agentId, values.message);
            }}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
