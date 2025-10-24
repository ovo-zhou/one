"use client";

import { useMemo } from "react";
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
  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === theme) || options[0];
  }, [theme]);
  const handleSwitchTheme = () => {
    setTheme(selectedOption.value === Theme.Light ? Theme.Dark : Theme.Light);
  }
  return (
    <div
      onClick={handleSwitchTheme}
      className="cursor-pointer relative rounded-[11px] bg-gray-100 dark:bg-gray-700 w-[48px] h-[22px] p-0.5 border-1 border-transparent hover:border-amber-600"
    >
      <div
        className={`absolute rounded-[8px] w-[16px] h-[16px] bg-white dark:bg-black p-0.5 ${
          selectedOption.value === Theme.Light
            ? "top-0.5 left-0.5"
            : "top-0.5 right-0.5"
        }`}
      >
        <selectedOption.icon size={12} />
      </div>
    </div>
  );
}
