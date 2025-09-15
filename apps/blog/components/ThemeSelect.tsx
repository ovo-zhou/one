"use client";

import { useTheme, Theme } from "./ThemeProvider";
const options = [
  {
    label: "light",
    value: Theme.Light,
  },
  {
    label: "dark",
    value: Theme.Dark,
  },
  {
    label: "system",
    value: Theme.System,
  },
];
export default function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      {options.map(option=>{
        return (
          <div
            key={option.value}
            onClick={() =>
              setTheme(option.value)
            }
          >
            {option.label}
          </div>
        );
      })}
    </div>
  );
}
