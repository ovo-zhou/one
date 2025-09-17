"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { setTheme as setThemeAction } from "@/actions/setTheme";

export enum Theme {
  Dark = "dark",
  Light = "light",
}

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const themeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({
  children,
  initTheme,
}: {
  children: React.ReactNode;
  initTheme: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initTheme);
  useEffect(() => {
    const htmlElement = document.documentElement;
    // 跟随系统
    htmlElement.dataset.theme = theme;
    setThemeAction(theme);
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
