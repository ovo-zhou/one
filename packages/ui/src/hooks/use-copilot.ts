import { useContext } from "react";
import { CopilotContext } from "@/components/copilotProvider";
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
  const updateConversationList = async () => {
    const list = await window.agent.getConversationList();
    setConversationList(list);
  };
  const updateMessagesByConversationID = async (id: number) => {
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
    updateConversationList,
    updateMessagesByConversationID
  }
}