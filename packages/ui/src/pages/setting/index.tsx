import { useNavigate } from "react-router-dom";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
const menu = [
  {
    group: "agent",
    items: [
      {
        title: "首页",
        url: "/",
        icon: Home,
      },
      {
        title: "提示词配置",
        url: "/setting/agent",
        icon: Inbox,
      },
      {
        title: "Calendar",
        url: "#",
        icon: Calendar,
      },
      {
        title: "Search",
        url: "#",
        icon: Search,
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
      },
    ],
  },
];
export default function Setting() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div>管理控制台</div>
        </SidebarHeader>
        <SidebarContent>
          {menu.map(i=>{
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
        <SidebarFooter>ryan 出品必属精品</SidebarFooter>
      </Sidebar>
      <main className="p-4 flex-1">
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
