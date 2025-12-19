import { CopilotContext } from "@/components/copilotProvider";
import { useContext } from "react";
import type { IChatItem } from '@/components/chatBox/ChatItem';

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
  const queryConversationList = async () => {
    const list = await window.agent.getConversationList();
    setConversationList(list);
  };
  const setMessagesByConversationID = async (id: number) => {
    const list = await window.agent.getMessagesByConversationID(id);
    setChatList(
      list.map((item) => ({
        id: item.id.toString(),
        role: item.role as IChatItem['role'],
        content: item.content,
      }))
    );
  };
  return {
    clearChatList,
    stopChat,
    chatList,
    setChatList,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    setIsLoading,
    conversationList,
    setConversationList,
    queryConversationList,
    setMessagesByConversationID
  }
}