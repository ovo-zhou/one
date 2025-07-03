import { useLocation } from "react-router-dom"
import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import ChatInput from "@/components/chatInput";
import ChatSidebar from "@/components/chatSidebar";
import ChatBox from "@/components/chatBox";

export default function Chat(){
  const location= useLocation()
  const formValues=location.state;
  return (
    <SidebarProvider>
      <ChatSidebar />
      <main className="w-full bg-amber-100 flex flex-col box-border px-2">
        <div className="h-14 leading-14 text-center">head</div>
        <ChatBox className='flex-1'/>
        <div className="py-4 flex justify-center">
          <ChatInput
            submit={(values) => {
              console.log(values);
            }}
          />
        </div>
      </main>
    </SidebarProvider>
  );
}