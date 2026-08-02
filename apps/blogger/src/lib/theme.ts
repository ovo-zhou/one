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
  gradientFrom: "#228be6",
  gradientTo: "#7950f2",
};

export const theme = createTheme({
  primaryColor: "primary",
  primaryShade: 6,
  colors: {
    primary: [
      "#edf3ff",
      "#dce8ff",
      "#bdd3fd",
      "#9dbbfa",
      "#7ea3f7",
      "#6289f3",
      "#4a71ee",
      "#4059d6",
      "#3946b8",
      "#332f9e",
    ],
  },
  fontFamily: systemFontStack,
  fontFamilyMonospace: monospaceFontStack,
  defaultRadius: "sm",
  radius: {
    sm: rem(4),
    md: rem(6),
    lg: rem(10),
    xl: rem(999),
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
    md: "0 2px 8px rgba(0, 0, 0, 0.06)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.08)",
  },
  headings: {
    fontWeight: "700",
    sizes: {
      h1: { fontSize: rem(38), lineHeight: "1.25" },
      h2: { fontSize: rem(28), lineHeight: "1.3" },
      h3: { fontSize: rem(22), lineHeight: "1.35" },
      h4: { fontSize: rem(17), lineHeight: "1.4" },
    },
  },
  focusRing: "auto",
  other: brandColors,
});
