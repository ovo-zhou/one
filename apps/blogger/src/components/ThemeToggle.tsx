"use client";

import { useEffect, useState } from "react";
import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && colorScheme === "dark";

  const handleToggle = () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(next);
    document.cookie = `mantine-color-scheme=${next};path=/;max-age=31536000;SameSite=Lax`;
  };

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      radius="xl"
      aria-label="切换主题"
      onClick={handleToggle}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 999,
      }}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </ActionIcon>
  );
}
