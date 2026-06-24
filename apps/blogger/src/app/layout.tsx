import type { Metadata } from "next";
import "./globals.css";
import "@mantine/core/styles.css";

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "A Next.js app in the monorepo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
