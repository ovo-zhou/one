import { Inbox } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
const menu = [
  {
    group: 'AI',
    items: [
      {
        title: '提示词配置',
        url: '/setting/agent',
        icon: Inbox,
      },
    ],
  },
];
export default function Setting() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    ryan
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">助手配置</span>
                    <span className="">v1.0.0</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {menu.map((i) => {
            return (
              <SidebarGroup key={i.group}>
                <SidebarGroupLabel>{i.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {i.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <a href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
      </Sidebar>
      <main className="p-4 flex-1">
        <header>
          <SidebarTrigger />
        </header>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
