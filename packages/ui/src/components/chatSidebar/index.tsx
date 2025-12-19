import {
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
import { useState, useRef, useEffect } from 'react';
import { MessageCirclePlus } from 'lucide-react';
import { useCopilot } from '@/hooks/use-copilot';

export default function ChatSidebar() {
  const {
    stopChat,
    currentConversationId,
    setCurrentConversationId,
    clearChatList,
    conversationList,
    queryConversationList,
    setMessagesByConversationID,
  } = useCopilot();
  const [open, setOpen] = useState(false);
  const selectedConversation = useRef<number | null>(null);
  const handleDelete = async () => {
    // 删除的时候，当前选中的会话id为空，直接返回，关闭弹窗
    if (!selectedConversation.current) {
      setOpen(false);
      return;
    }
    // 删除的时候，删除的并不是当前选中的会话id，直接返回，关闭弹窗
    if (selectedConversation.current !== Number(currentConversationId)) {
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
      setCurrentConversationId(null);
      // 清空聊天记录
      clearChatList();
      // 更新会话列表
      await queryConversationList();
      setOpen(false);
    }
  };
  const handleOpenNewConversation = async () => {
    // 开启新会话时，先关闭当前选中的会话id
    setCurrentConversationId(null);
    // 开启新会话时，先清空聊天记录
    clearChatList();
  };
  useEffect(() => {
    queryConversationList();
  }, []);
  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link to={'/'}>
            <div className="text-xl font-bold text-center">
              AI 助手{' '}
              <span className="text-sm text-gray-500 font-light">
                deepseek驱动
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div
                    className="flex cursor-pointer justify-center items-center rounded-4xl bg-blue-300 py-2"
                    onClick={handleOpenNewConversation}
                  >
                    <MessageCirclePlus className="mr-2" />
                    开启新会话
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>历史记录</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {conversationList.map((item) => (
                  <SidebarMenuItem className="truncate" key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className={`cursor-pointer ${
                        currentConversationId === item.id
                          ? 'bg-amber-200 hover:bg-amber-200'
                          : ''
                      }`}
                    >
                      <span
                        onClick={() => {
                          setCurrentConversationId(item.id);
                          stopChat?.();
                          // 更新聊天记录
                          setMessagesByConversationID(item.id);
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
