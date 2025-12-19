import { useCopilot } from '@/hooks/use-copilot';
import { ChatItem } from './ChatItem';
import ScrollBox from '../scrollBox';

export default function ChatBox() {
  const { chatList, currentConversationId } = useCopilot();
  if (!currentConversationId) {
    return null;
  }
  return (
    <ScrollBox messageLength={chatList.length}>
      {chatList.map((chatItem) => (
        <ChatItem
          role={chatItem.role}
          content={chatItem.content}
          key={chatItem.id}
        />
      ))}
    </ScrollBox>
  );
}
