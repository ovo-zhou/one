import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import "@mantine/core/styles.css";
import "highlight.js/styles/github-dark.css";

import { MantineProvider, Container } from "@mantine/core";
import ThemeToggle from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "A Next.js app in the monorepo",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const stored = cookieStore.get("mantine-color-scheme")?.value;
  const colorScheme = stored === "dark" || stored === "light" ? stored : "light";

  return (
    <html lang="en" data-mantine-color-scheme={colorScheme} suppressHydrationWarning>
      <body>
        <MantineProvider defaultColorScheme={colorScheme}>
          <Container fluid p={0}>
            {children}
          </Container>
          <ThemeToggle />
        </MantineProvider>
      </body>
    </html>
  );
}
