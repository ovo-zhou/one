"use client";

import { useState } from "react";
import { Menu, Modal, Text, Button, Group } from "@mantine/core";

interface UserDropdownProps {
  name: string;
}

export default function UserDropdown({ name }: UserDropdownProps) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Menu trigger="click" position="bottom-start">
        <Menu.Target>
          <Text
            component="span"
            style={{ cursor: "pointer", textDecoration: "underline", display: "inline" }}
          >
            {name}
          </Text>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item color="red" onClick={() => setOpened(true)}>
            退出登陆
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="确认退出"
        centered
      >
        <Text mb="lg">确定要退出登陆吗？</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>
            取消
          </Button>
          <Button
            color="red"
            onClick={() => {
              window.location.href = "/api/auth/logout";
            }}
          >
            退出登陆
          </Button>
        </Group>
      </Modal>
    </>
  );
}
