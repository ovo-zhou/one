import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ChatInput from '@/components/chatInput';
import ChatSidebar from '@/components/chatSidebar';
import ChatBox from '@/components/chatBox';
import type { IChatItem } from '@/components/chatBox/ChatItem';
import { v4 as uuidv4 } from 'uuid';
import CopilotProvider from '@/components/copilotProvider';
import { useCopilot } from '@/hooks/use-copilot';

function CopilotComponent() {
  const {
    currentConversationId,
    setCurrentConversationId,
    chatList,
    setChatList,
    setIsLoading,
    conversationList,
    updateConversationList,
    stopChat,
  } = useCopilot();

  const sendMessage = async (agentId: string, message: string) => {
    // 开启流式输出
    // 输出结束或者手动中断，结束流失输出
    setIsLoading(true);
    setChatList([
      ...chatList,
      {
        id: uuidv4(),
        role: 'user',
        content: message,
      },
      { id: uuidv4(), role: 'assistant', content: '...' },
    ]);
    let id = currentConversationId;
    // 没有会话ID，创建新会话
    if (!id) {
      id = await window.agent.createConversation('新会话');
      setCurrentConversationId(id);
      await updateConversationList();
    }
    window.agent.chat({
      agentId,
      message,
      conversationID: id,
    });
    if (chatList.length === 0) {
      await window.agent.updateConversationTitle(id, message);
      await updateConversationList();
    }
  };
  // 监听流式输出回调
  useEffect(() => {
    // 监听流式输出回调
    const off = window.agent.onMessage((data) => {
      if (data.finish) {
        // 关闭流式输出
        setIsLoading(false);
        return;
      }
      // 更新最新的一条消息
      setChatList((pre) => {
        const newChatList = [...pre];
        const lastChatItem = newChatList[newChatList.length - 1];
        lastChatItem.id = data.id;
        lastChatItem.role = data.role as IChatItem['role'];
        lastChatItem.content = data.content;
        return newChatList;
      });
    });
    return () => {
      off();
      stopChat();
    };
  }, []);
  return (
    <SidebarProvider>
      <ChatSidebar />
      <main
        className={`w-full h-screen flex flex-col ${
          currentConversationId ? '' : 'justify-center'
        }`}
      >
        {currentConversationId && (
          <>
            <div className="h-14 leading-14 text-center relative">
              <SidebarTrigger className="absolute left-4 top-1/2 -translate-y-1/2" />
              {conversationList.find(
                (item) => item.id === currentConversationId
              )?.title || '新会话'}
            </div>
            <ChatBox chatList={chatList} />
          </>
        )}
        <ChatInput
          submit={(values) => {
            sendMessage(values.agentId, values.message);
          }}
        />
      </main>
    </SidebarProvider>
  );
}
export default function Copilot() {
  return (
    <CopilotProvider>
      <CopilotComponent />
    </CopilotProvider>
  );
}
