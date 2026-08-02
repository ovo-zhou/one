import { createTheme, rem } from "@mantine/core";

export const systemFontStack = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  '"PingFang SC"',
  '"Hiragino Sans GB"',
  '"Microsoft YaHei"',
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(", ");

export const monospaceFontStack = [
  "ui-monospace",
  "SFMono-Regular",
  "Menlo",
  "Monaco",
  "Consolas",
  '"Liberation Mono"',
  '"Courier New"',
  "monospace",
].join(", ");

export const brandColors = {
  gradientFrom: "#6366f1",
  gradientMid: "#a855f7",
  gradientTo: "#ec4899",
  glow: "rgba(139, 92, 246, 0.35)",
};

export const theme = createTheme({
  primaryColor: "primary",
  primaryShade: 6,
  colors: {
    primary: [
      "#f4f0ff",
      "#e9e0ff",
      "#d4c3ff",
      "#bea6fd",
      "#a98af9",
      "#9671f5",
      "#8b5cf6",
      "#6f44d1",
      "#5533a9",
      "#3e2683",
    ],
  },
  fontFamily: systemFontStack,
  fontFamilyMonospace: monospaceFontStack,
  defaultRadius: "sm",
  radius: {
    sm: rem(8),
    md: rem(14),
    lg: rem(20),
    xl: rem(999),
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 16px rgba(0, 0, 0, 0.08)",
    lg: "0 8px 32px rgba(0, 0, 0, 0.12)",
    xl: "0 0 40px rgba(139, 92, 246, 0.28)",
  },
  headings: {
    fontWeight: "800",
    sizes: {
      h1: { fontSize: rem(42), lineHeight: "1.2" },
      h2: { fontSize: rem(30), lineHeight: "1.28" },
      h3: { fontSize: rem(23), lineHeight: "1.35" },
      h4: { fontSize: rem(18), lineHeight: "1.4" },
    },
  },
  focusRing: "auto",
  other: brandColors,
});
