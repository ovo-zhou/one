import { useContext } from "react";
import { CopilotContext } from "@/components/copilotProvider";
import type { IChatItem } from '@/components/chatBox/ChatItem';
import { v4 as uuidv4 } from 'uuid';

export function useCopilot() {
  const context = useContext(CopilotContext);
  const { currentConversationId, setCurrentConversationId, chatList, setChatList, isLoading, setIsLoading, conversationList, setConversationList } = context;
  const stopChat = () => {
    window.agent.stopChat();
    setIsLoading(false);
  }
  const clearChatList = () => {
    setChatList([]);
  }
  const updateConversationList = async () => {
    const list = await window.agent.getConversationList();
    setConversationList(list);
  };
  const updateMessagesByConversationID = async (id: string) => {
    const list = await window.agent.getMessagesByConversationID(id);
    setChatList(
      list.map((item) => ({
        id: item.id.toString(),
        role: item.role as IChatItem['role'],
        content: item.content,
      }))
    );
  };
  const sendMessage = async (agentId: string, message: string) => {
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
      id = await window.agent.createConversation(message.slice(0, 40));
      setCurrentConversationId(id);
      await updateConversationList();
    }
    window.agent.chat({
      agentId,
      message,
      conversationID: id,
    });
  };
  const onMessage = () => {
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
    return off;
  }
  return {
    clearChatList,
    stopChat,
    chatList,
    setChatList,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    conversationList,
    setConversationList,
    updateConversationList,
    updateMessagesByConversationID,
    sendMessage,
    onMessage
  }
}