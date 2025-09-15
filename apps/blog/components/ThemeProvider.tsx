"use client";
import { createContext, useContext, useEffect, useState } from "react";
export enum Theme {
  Dark = "dark",
  Light = "light",
  System = "system",
}
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};
const themeContext = createContext<ThemeContextType | null>(null);
const getInitialTheme = () => {
  if (typeof window === "undefined") return Theme.System;

  return (localStorage.getItem("theme") || Theme.System) as Theme;
};
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  useEffect(() => {
    const htmlElement = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // 跟随系统
    if (theme === Theme.System) {
      htmlElement.dataset.theme = mediaQuery.matches ? Theme.Dark : Theme.Light;
    } else {
      htmlElement.dataset.theme = theme;
    }
    localStorage.setItem("theme", theme);
    function handleChange(e: MediaQueryListEvent) {
      document.documentElement.dataset.theme = e.matches ? "dark" : "light";
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);
  return (
    <themeContext.Provider value={{ theme, setTheme }}>
      {children}
    </themeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(themeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
