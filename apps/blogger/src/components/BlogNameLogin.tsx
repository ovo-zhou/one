"use client";

import { useRef } from "react";
import { UnstyledButton } from "@mantine/core";

export default function BlogNameLogin({ name }: { name: string }) {
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    countRef.current += 1;
    if (countRef.current >= 3) {
      window.location.href = "/api/auth/login";
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, 1500);
  };

  return (
    <UnstyledButton onClick={handleClick} className="brand-text">
      {name}
    </UnstyledButton>
  );
}
