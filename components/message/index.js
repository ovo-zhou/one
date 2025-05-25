"use client";
import { useEffect, useRef, useState } from "react";

export default function Message(props) {
  const { content, duration = 3000, showIcon = true, type } = props;
  const [visibility, setVisibility] = useState(true);
  const timer = useRef(null);
  useEffect(() => {
    timer.current = setTimeout(() => {
      setVisibility(false);
    }, duration);
    return () => {
      clearTimeout(timer.current);
    };
  }, [duration]);

  if (!visibility) {
    return null;
  }

  return (
    <div className="flex flex-row leading-8 gap-2 border border-red-500">
      {showIcon && <div>图标</div>}
      <div>{content}</div>
      <div>{type}</div>
    </div>
  );
}
