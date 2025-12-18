import { createContext, useState } from 'react';
import type { IChatItem } from '@/components/chatBox/ChatItem';

export const CopilotContext = createContext<{
  currentConversationId: number | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<number | null>>;
  chatList: IChatItem[];
  setChatList: React.Dispatch<React.SetStateAction<IChatItem[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  currentConversationId: null,
  setCurrentConversationId: () => {},
  chatList: [],
  setChatList: () => {},
  isLoading: false,
  setIsLoading: () => {},
});

interface ICopilotProviderProps {
  children: React.ReactNode;
}

const CopilotProvider = (props: ICopilotProviderProps) => {
  const { children } = props;

  // 当前会话
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);

  // 聊天列表
  const [chatList, setChatList] = useState<IChatItem[]>([]);
  // 是否在流式输出中
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <CopilotContext.Provider
      value={{
        currentConversationId,
        setCurrentConversationId,
        chatList,
        setChatList,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};
export default CopilotProvider;
