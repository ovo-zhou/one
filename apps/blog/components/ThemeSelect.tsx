"use client";

import { useTheme, Theme } from "./ThemeProvider";
import { MoonStar, Sun } from "lucide-react";

const options = [
  {
    label: "light",
    value: Theme.Light,
    icon: Sun,
    bg: "#eee",
  },
  {
    label: "dark",
    value: Theme.Dark,
    icon: MoonStar,
    bg: "#3d3d3d",
  },
];

export default function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-2">
      {options.map(option=>{
        return (
          <div
            className="cursor-pointer p-1 rounded-md"
            key={option.value}
            onClick={() => setTheme(option.value)}
            style={{
              backgroundColor: theme === option.value ? option.bg : undefined,
            }}
          >
            <option.icon size={16} />
          </div>
        );
      })}
    </div>
  );
}
