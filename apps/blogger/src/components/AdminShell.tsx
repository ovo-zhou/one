"use client";

import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import {
  AppShell,
  Drawer,
  NavLink,
  Stack,
  Button,
  Group,
  Box,
  Menu,
  Modal,
  Text,
  Anchor,
  ActionIcon,
  em,
} from "@mantine/core";
import { usePathname, useRouter } from "next/navigation";
import {
  Newspaper,
  FileText,
  Package,
  Menu as MenuIcon,
  CircleUser,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  LogOut,
} from "lucide-react";

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const navClass = `admin-nav-link${collapsed ? " nav-collapsed" : ""}`;

  const handleClick = (path: string) => {
    router.push(path);
    onNavigate();
  };

  return (
    <Stack gap={2} px="xs">
      <NavLink
        className={navClass}
        label={collapsed ? undefined : "文章管理"}
        leftSection={<Newspaper size={18} />}
        active={pathname.startsWith("/admin/posts") || pathname === "/admin"}
        onClick={() => handleClick("/admin/posts")}
      />
      <NavLink
        className={navClass}
        label={collapsed ? undefined : "页面管理"}
        leftSection={<FileText size={18} />}
        active={pathname.startsWith("/admin/pages")}
        onClick={() => handleClick("/admin/pages")}
      />
      <NavLink
        className={navClass}
        label={collapsed ? undefined : "快递柜管理"}
        leftSection={<Package size={18} />}
        active={pathname.startsWith("/admin/locker")}
        onClick={() => handleClick("/admin/locker")}
      />
    </Stack>
  );
}

function TopBar({
  userName,
  _mobileOpened,
  desktopCollapsed,
  onMobileToggle,
  onDesktopToggle,
  isMobile,
}: {
  userName: string;
  _mobileOpened: boolean;
  desktopCollapsed: boolean;
  onMobileToggle: () => void;
  onDesktopToggle: () => void;
  isMobile: boolean | undefined;
}) {
  const router = useRouter();
  const [logoutModalOpened, setLogoutModalOpened] = useState(false);

  return (
    <>
      <Group justify="space-between" px="md" h="100%">
        <Group gap="xs">
          {isMobile ? (
            <ActionIcon variant="subtle" onClick={onMobileToggle} aria-label="打开导航菜单">
              <MenuIcon size={20} />
            </ActionIcon>
          ) : (
            <ActionIcon
              variant="subtle"
              onClick={onDesktopToggle}
              aria-label={desktopCollapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              {desktopCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </ActionIcon>
          )}
          <Anchor
            href="/admin"
            underline="never"
            c="inherit"
            fw={800}
            size="lg"
            className="flex-center"
          >
            <Text className="brand-text">博客后台</Text>
          </Anchor>
        </Group>

        <Menu trigger="click" position="bottom-end">
          <Menu.Target>
            <Group component="span" gap={6} className="cursor-pointer">
              <CircleUser size={18} />
              {userName}
              <ChevronDown size={14} />
            </Group>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<Home size={16} />} onClick={() => router.push("/")}>
              返回首页
            </Menu.Item>
            <Menu.Item color="red" leftSection={<LogOut size={16} />} onClick={() => setLogoutModalOpened(true)}>
              退出登陆
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Modal
        opened={logoutModalOpened}
        onClose={() => setLogoutModalOpened(false)}
        title="确认退出"
        centered
      >
        <Text mb="lg">确定要退出登陆吗？</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setLogoutModalOpened(false)}>
            取消
          </Button>
          <Button
            color="red"
            onClick={() => {
              router.push("/api/auth/logout");
            }}
          >
            退出登陆
          </Button>
        </Group>
      </Modal>
    </>
  );
}

export default function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const isMobile = useMediaQuery(`(max-width: ${em(768)})`);
  const [mobileOpened, setMobileOpened] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const navbarWidth = isMobile ? 0 : desktopCollapsed ? 60 : 200;

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: navbarWidth,
        breakpoint: "sm",
        collapsed: { desktop: false, mobile: true },
      }}
      padding={0}
    >
      <AppShell.Header className="app-header">
        <TopBar
          userName={userName}
          _mobileOpened={mobileOpened}
          desktopCollapsed={desktopCollapsed}
          onMobileToggle={() => setMobileOpened((o) => !o)}
          onDesktopToggle={() => setDesktopCollapsed((o) => !o)}
          isMobile={isMobile}
        />
      </AppShell.Header>

      {isMobile ? null : (
        <AppShell.Navbar p={0} className="app-navbar">
          <AppShell.Section grow mt="sm">
            <SidebarContent collapsed={desktopCollapsed} onNavigate={() => {}} />
          </AppShell.Section>
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        <Box px={{ base: "sm", sm: "md" }} py="md">
          {children}
        </Box>
      </AppShell.Main>

      <Drawer
        opened={mobileOpened}
        onClose={() => setMobileOpened(false)}
        size="xs"
        padding={0}
      >
        <SidebarContent collapsed={false} onNavigate={() => setMobileOpened(false)} />
      </Drawer>
    </AppShell>
  );
}
