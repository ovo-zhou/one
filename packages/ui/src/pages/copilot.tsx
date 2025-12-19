import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import ChatInput from '@/components/chatInput';
import ChatSidebar from '@/components/chatSidebar';
import ChatBox from '@/components/chatBox';
import CopilotProvider from '@/components/copilotProvider';
import { useCopilot } from '@/hooks/use-copilot';
import Header from '@/components/header';

function CopilotComponent() {
  const { stopChat, onMessage } = useCopilot();

  useEffect(() => {
    const off = onMessage();
    return () => {
      off();
      stopChat();
    };
  }, []);

  return (
    <SidebarProvider>
      <ChatSidebar />
      <main className="w-full h-screen flex flex-col justify-center">
        <Header />
        <ChatBox />
        <ChatInput />
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
