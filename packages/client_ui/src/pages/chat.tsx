import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatInput from "@/components/chatInput";
import ChatSidebar from "@/components/chatSidebar";
import ChatBox from "@/components/chatBox";
import { useEffect, useRef, useState } from "react";
import type { IChatItem } from "@/components/chatBox";

export default function Chat() {
  const location = useLocation();
  const formValues = location.state;
  const [chatList, setChatList] = useState<IChatItem[]>([]);
  const hasSend = useRef<boolean>(false);
  const sendMessage = (agent: string, message: string) => {
    window.agent.sendMessage(agent, message);
  };
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
      <main className="w-full flex flex-col box-border px-2">
        <div className="h-14 leading-14 text-center">head</div>
        <ChatBox className="flex-1" chatList={chatList} />
        <div className="py-4 flex justify-center">
          <ChatInput
            submit={(values) => {
              console.log(values);
            }}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
