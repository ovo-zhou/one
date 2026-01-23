import { useCopilot } from '@/hooks/use-copilot';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useMemo } from 'react';
export default function Header() {
  const { conversationList, currentConversationId } = useCopilot();
  const currentConversation = useMemo(() => {
    return conversationList.find((item) => item.id === currentConversationId);
  }, [currentConversationId, conversationList]);
  if (!currentConversationId) {
    return null;
  }
  return (
    <div className="h-14 leading-14 text-center relative">
      <SidebarTrigger className="absolute left-4 top-1/2 -translate-y-1/2" />
      {currentConversation?.title || '新会话'}
    </div>
  );
}
