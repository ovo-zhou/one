import { Anchor, Avatar, Text, Flex } from "@mantine/core";

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

export default function UserMenu({ user }: { user: User | null }) {
  if (!user) {
    return (
      <Anchor href="/api/auth/login" underline="never" size="sm">
        登录
      </Anchor>
    );
  }
  return (
    <Flex align="center" gap="sm">
      {user.picture && <Avatar src={user.picture} size="sm" radius="xl" />}
      <Text size="sm">{user.name || user.email}</Text>
      <Anchor href="/api/auth/logout" underline="never" size="sm" c="dimmed">
        登出
      </Anchor>
    </Flex>
  );
}
