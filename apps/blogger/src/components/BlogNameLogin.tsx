"use client";

import { useRef } from "react";

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
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      {name}
    </button>
  );
}
