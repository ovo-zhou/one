import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ChatInput from '@/components/chatInput';
import ChatSidebar from '@/components/chatSidebar';
import ChatBox from '@/components/chatBox';
import { useEffect, useState } from 'react';
import type { IChatItem } from '@/components/chatBox/ChatItem';
import { v4 as uuidv4 } from 'uuid';

export default function Chat() {
  const [conversationID, setConversationID] = useState<number | null>(null);
  // 会话列表
  const [conversationList, setConversationList] = useState<
    { id: number; title: string }[]
  >([]);
  const [chatList, setChatList] = useState<IChatItem[]>([]);
  // 是否正在流式输出
  const [isStreamResponse, setIsStreamResponse] = useState<boolean>(false);

  // 手动中断流式输出
  const stopChat = () => {
    window.agent.stopChat();
    setIsStreamResponse(false);
  };
  const sendMessage = async (agentId: string, message: string) => {
    // 开启流式输出
    // 输出结束或者手动中断，结束流失输出
    setIsStreamResponse(true);
    setChatList([
      ...chatList,
      {
        id: uuidv4(),
        role: 'user',
        content: message,
      },
      { id: uuidv4(), role: 'assistant', content: '...' },
    ]);

    if (conversationID === null) {
      const id = await window.agent.createConversation('新会话');
      setConversationID(id);
      await queryConversationList();
      window.agent.chat({ agentId, message, conversationID: id });
    } else {
      window.agent.chat({
        agentId,
        message,
        conversationID: Number(conversationID),
      });
    }
  };
  const queryConversationList = async () => {
    const list = await window.agent.getConversationList();
    setConversationList(list);
  };
  // 切换会话时，刷新聊天列表
  const queryMessagesByConversationID = async (id: number) => {
    const list = await window.agent.getMessagesByConversationID(id);
    setChatList(
      list.map((item) => ({
        id: item.id.toString(),
        role: item.role as IChatItem['role'],
        content: item.content,
      }))
    );
  };
  const clearChatList = () => {
    setChatList([]);
  };
  // 监听流式输出回调
  useEffect(() => {
    // 进页面查询会话列表
    queryConversationList();
    // 进页面查询聊天记录
    if (conversationID) {
      queryMessagesByConversationID(Number(conversationID));
    }
    const off = window.agent.onMessage((data) => {
      if (data.finish) {
        // 关闭流式输出
        setIsStreamResponse(false);
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
      // 组件卸载时,移除监听器，并且手动中断流式输出
      off();
      stopChat();
    };
  }, []);
  return (
    <SidebarProvider>
      <ChatSidebar
        stopChat={stopChat}
        conversationList={conversationList}
        conversationID={conversationID}
        setConversationID={setConversationID}
        queryConversationList={queryConversationList}
        queryMessagesByConversationID={queryMessagesByConversationID}
        clearChatList={clearChatList}
      />
      <main
        className={`w-full h-screen flex flex-col ${
          conversationID ? '' : 'justify-center'
        }`}
      >
        {conversationID && (
          <>
            <div className="h-14 leading-14 text-center relative">
              <SidebarTrigger className="absolute left-4 top-1/2 -translate-y-1/2" />
              {conversationList.find(
                (item) => item.id === Number(conversationID)
              )?.title || '新会话'}
            </div>

            <ChatBox chatList={chatList} />
          </>
        )}
        <div className="flex justify-center pb-8">
          <ChatInput
            stopChat={stopChat}
            isStreamResponse={isStreamResponse}
            submit={(values) => {
              sendMessage(values.agentId, values.message);
            }}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
