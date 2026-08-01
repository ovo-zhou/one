import type { Metadata } from "next";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "highlight.js/styles/github-dark.css";

import { MantineProvider, Container } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import ThemeToggle from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "A Next.js app in the monorepo",
};

const themeInitScript = `(function(){try{var c=document.cookie.match(/(?:^|; )mantine-color-scheme=([^;]*)/);var s=c?decodeURIComponent(c[1]):'';if(s!=='dark'&&s!=='light')s='light';document.documentElement.setAttribute('data-mantine-color-scheme',s);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <MantineProvider defaultColorScheme="light">
          <Notifications position="top-right" />
          <Container fluid p={0}>
            {children}
          </Container>
          <ThemeToggle />
        </MantineProvider>
      </body>
    </html>
  );
}
