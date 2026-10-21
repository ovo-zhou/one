import { createTheme, rem } from "@mantine/core";
import classes from "./theme.module.css";

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
    post: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.05)",
    glass: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.08)",
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
  components: {
    Button: {
      classNames: { root: classes.button },
    },
    Paper: {
      classNames: { root: classes.paper },
      styles: {
        root: {
          backdropFilter: "var(--paper-backdrop, none)",
          WebkitBackdropFilter: "var(--paper-backdrop, none)",
        },
      },
    },
    Divider: {
      classNames: { root: classes.divider },
    },
    Input: {
      classNames: { input: classes.input },
    },
    Modal: {
      styles: {
        content: {
          background: "color-mix(in srgb, var(--mantine-color-body) 82%, transparent)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.24)",
        },
      },
    },
    Table: {
      classNames: { tr: classes.tableRow },
      styles: {
        th: {
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--mantine-color-dimmed)",
          fontWeight: 700,
        },
        td: { background: "transparent" },
      },
    },
    AppShell: {
      styles: {
        header: {
          background: "color-mix(in srgb, var(--mantine-color-body) 72%, transparent)",
          backdropFilter: "blur(18px) saturate(1.4)",
          WebkitBackdropFilter: "blur(18px) saturate(1.4)",
          borderBottom: "1px solid color-mix(in srgb, var(--mantine-color-default-border) 70%, transparent)",
        },
        navbar: {
          background: "color-mix(in srgb, var(--mantine-color-body) 68%, transparent)",
          backdropFilter: "blur(18px) saturate(1.3)",
          WebkitBackdropFilter: "blur(18px) saturate(1.3)",
          borderRight: "1px solid color-mix(in srgb, var(--mantine-color-default-border) 70%, transparent)",
        },
      },
    },
  },
  other: brandColors,
});
