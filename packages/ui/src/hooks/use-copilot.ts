import { CopilotContext } from "@/components/copilotProvider";
import { useContext } from "react";
export function useCopilot() {
  const context = useContext(CopilotContext);
  const { currentConversationId, setCurrentConversationId, chatList, setChatList, isLoading, setIsLoading } = context;
  return {
    chatList,
    setChatList,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    setIsLoading
  }
}