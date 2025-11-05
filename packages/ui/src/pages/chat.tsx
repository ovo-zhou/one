import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import ChatInput from '@/components/chatInput';
import ChatSidebar from '@/components/chatSidebar';
import ChatBox from '@/components/chatBox';
import { useEffect, useRef, useState } from 'react';
import type { IChatItem } from '@/components/chatBox/ChatItem';
import { v4 as uuidv4 } from 'uuid';
export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const formValues = location.state;
  // 当前会话id
  const [conversationID, setConversationID] = useState<number | null>(null);
  // 会话列表
  const [conversationList, setConversationList] = useState<
    { id: number; title: string }[]
  >([]);
  const [chatList, setChatList] = useState<IChatItem[]>([]);
  const hasSend = useRef<boolean>(false);
  const sendMessage = (
    agentId: string,
    message: string,
    conversationID: number
  ) => {
    setChatList([
      ...chatList,
      {
        id: uuidv4(),
        role: 'user',
        content: message,
      },
      { id: uuidv4(), role: 'assistant', content: '...' },
    ]);
    window.agent.chat({ agentId, message, conversationID });
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
  // 这里接受其他页面传过来的值，直接发送消息，需要加入会话的概念
  // 从首页条状过来，新创建一个绘画，然后发送消息
  // 第一次对话完成后，更新绘画标题为用户输入的内容
  useEffect(() => {
    const handleSendMessageFromUrlState = async () => {
      // 避免重复触发调用
      hasSend.current = true;
      // 从首页跳转过来时创建会话
      const id = await window.agent.createConversation('新会话');
      setConversationID(id);
      // 更新会话列表
      await queryConversationList();
      // 更新聊天记录
      setChatList((pre) => [
        ...pre,
        {
          id: (+new Date() - 10).toString(),
          role: 'user',
          content: formValues.message,
        },
        {
          id: (+new Date() + 10).toString(),
          role: 'assistant',
          content: '...',
        },
      ]);
      // 发送消息
      sendMessage(formValues.agentId, formValues.message, id);
      // 清空导航栏的 state
      navigate(location.pathname, { replace: true, state: null });
    };
    if (formValues && hasSend.current === false) {
      handleSendMessageFromUrlState();
    }
  }, []);
  // 监听流式输出回调
  useEffect(() => {
    const off = window.agent.onMessage((data) => {
      console.log('data:', data.id);
      if (data.finish) {
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
    };
  }, []);
  useEffect(() => {
    queryConversationList();
  }, []);
  return (
    <SidebarProvider>
      <ChatSidebar
        conversationList={conversationList}
        conversationID={conversationID}
        setConversationID={setConversationID}
        queryConversationList={queryConversationList}
        queryMessagesByConversationID={queryMessagesByConversationID}
      />
      <main className="w-full bg-amber-300 h-screen flex flex-col">
        <div className="h-14 leading-14 text-center bg-amber-800 relative">
          <SidebarTrigger className="absolute left-4 top-1/2 -translate-y-1/2" />
          head
        </div>
        <div
          className="overflow-y-auto flex-1 scroll-smooth flex justify-center"
          style={{ scrollbarWidth: 'none' }}
        >
          <ChatBox chatList={chatList} className="w-3xl bg-white h-fit" />
        </div>
        <div className="bg-amber-200 flex justify-center">
          <ChatInput
            initAgentId={formValues?.agentId}
            submit={(values) => {
              sendMessage(values.agentId, values.message, conversationID!);
            }}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}
