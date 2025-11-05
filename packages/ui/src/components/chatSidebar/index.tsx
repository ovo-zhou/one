import {
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import { Ellipsis } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useRef } from 'react';

interface IProps {
  conversationList: { id: number; title: string }[];
  conversationID: number | null;
  setConversationID: (id: number | null) => void;
  queryConversationList: () => Promise<void>;
  queryMessagesByConversationID: (id: number) => Promise<void>;
  clearChatList: () => void;
}

export default function ChatSidebar(props: IProps) {
  const {
    conversationList,
    conversationID,
    setConversationID,
    queryConversationList,
    queryMessagesByConversationID,
    clearChatList,
  } = props;
  const [open, setOpen] = useState(false);
  const selectedConversation = useRef<number | null>(null);
  const handleDelete = async () => {
    // 删除的时候，当前选中的会话id为空，直接返回，关闭弹窗
    if (!selectedConversation.current) {
      setOpen(false);
      return;
    }
    // 删除的时候，删除的并不是当前选中的会话id，直接返回，关闭弹窗
    if (selectedConversation.current !== conversationID) {
      await window.agent.deleteConversation(selectedConversation.current);
      selectedConversation.current = null;
      // 更新会话列表
      await queryConversationList();
      setOpen(false);
    } else {
      // 删除的时候，删除的是当前选中的会话id，删除会话并更新会话列表
      await window.agent.deleteConversation(selectedConversation.current);
      selectedConversation.current = null;
      // 清空当前选中的会话id
      setConversationID(null);
      // 清空聊天记录
      clearChatList();
      // 更新会话列表
      await queryConversationList();
      setOpen(false);
    }
  };
  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link to={'/'}>首页</Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversationList.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className={`cursor-pointer ${
                        conversationID === item.id
                          ? 'bg-amber-200 hover:bg-amber-200'
                          : ''
                      }`}
                    >
                      <span
                        onClick={() => {
                          setConversationID(item.id);
                          // 更新聊天记录
                          queryMessagesByConversationID(item.id);
                        }}
                      >
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                    <SidebarMenuAction>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Ellipsis className="cursor-pointer" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-20" align="start">
                          <DropdownMenuItem
                            onClick={() => {
                              selectedConversation.current = item.id;
                              setOpen(true);
                            }}
                          >
                            <span className="text-red-500">删除</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除会话吗?</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除当前会话吗? 这将永久删除会话记录和相关数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
