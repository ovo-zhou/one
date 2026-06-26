"use client";

import { useEffect, useState } from "react";
import { ActionIcon, useMantineColorScheme } from "@mantine/core";

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
      {isDark ? <SunIcon /> : <MoonIcon />}
    </ActionIcon>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
