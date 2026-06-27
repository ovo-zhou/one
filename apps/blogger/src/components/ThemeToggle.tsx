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
      variant="filled"
      color="gray"
      size="xl"
      radius="xl"
      aria-label="切换主题"
      onClick={handleToggle}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 999,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      }}
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </ActionIcon>
  );
}
