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
  MessagesSquare,
  Menu as MenuIcon,
  CircleUser,
  ChevronDown,
  PanelLeftClose,
  Home,
  LogOut,
} from "lucide-react";

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (path: string) => {
    router.push(path);
    onNavigate();
  };

  return (
    <Stack gap={0}>
      <NavLink
        label={collapsed ? undefined : "文章管理"}
        leftSection={<Newspaper size={18} />}
        active={pathname.startsWith("/admin/posts") || pathname === "/admin"}
        onClick={() => handleClick("/admin/posts")}
        styles={{ root: { borderRadius: 0 } }}
      />
      <NavLink
        label={collapsed ? undefined : "页面管理"}
        leftSection={<FileText size={18} />}
        active={pathname.startsWith("/admin/pages")}
        onClick={() => handleClick("/admin/pages")}
        styles={{ root: { borderRadius: 0 } }}
      />
      <NavLink
        label={collapsed ? undefined : "评论管理"}
        leftSection={<MessagesSquare size={18} />}
        active={pathname.startsWith("/admin/comments")}
        onClick={() => handleClick("/admin/comments")}
        styles={{ root: { borderRadius: 0 } }}
      />
    </Stack>
  );
}

function TopBar({
  userName,
  mobileOpened,
  desktopCollapsed,
  onMobileToggle,
  onDesktopToggle,
  isMobile,
}: {
  userName: string;
  mobileOpened: boolean;
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
            <ActionIcon variant="subtle" onClick={onMobileToggle}>
              <MenuIcon size={20} />
            </ActionIcon>
          ) : (
            <ActionIcon variant="subtle" onClick={onDesktopToggle}>
              <MenuIcon size={20} />
            </ActionIcon>
          )}
          <Anchor href="/admin" underline="never" c="inherit" fw={700} size="lg">
            博客后台
          </Anchor>
        </Group>

        <Menu trigger="click" position="bottom-end">
          <Menu.Target>
            <Text
              component="span"
              size="sm"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <CircleUser size={18} />
              {userName}
              <ChevronDown size={14} />
            </Text>
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
      padding="md"
    >
      <AppShell.Header>
        <TopBar
          userName={userName}
          mobileOpened={mobileOpened}
          desktopCollapsed={desktopCollapsed}
          onMobileToggle={() => setMobileOpened((o) => !o)}
          onDesktopToggle={() => setDesktopCollapsed((o) => !o)}
          isMobile={isMobile}
        />
      </AppShell.Header>

      {isMobile ? null : (
        <AppShell.Navbar p="xs">
          <AppShell.Section grow>
            <SidebarContent collapsed={desktopCollapsed} onNavigate={() => {}} />
          </AppShell.Section>
          <AppShell.Section>
            {!desktopCollapsed && (
              <Button
                variant="subtle"
                size="compact-sm"
                fullWidth
                leftSection={<PanelLeftClose size={16} />}
                onClick={() => setDesktopCollapsed(true)}
              >
                收起
              </Button>
            )}
          </AppShell.Section>
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        <Box px={{ base: 0, sm: "md" }}>
          {children}
        </Box>
      </AppShell.Main>

      <Drawer
        opened={mobileOpened}
        onClose={() => setMobileOpened(false)}
        size="xs"
        title="导航菜单"
        padding={0}
      >
        <SidebarContent collapsed={false} onNavigate={() => setMobileOpened(false)} />
      </Drawer>
    </AppShell>
  );
}
