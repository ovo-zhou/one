import classes from "./layout.module.css";
import type { Metadata } from "next";
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "highlight.js/styles/github-dark.css";

import { MantineProvider, Container, Box } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Analytics } from "@vercel/analytics/next";
import ThemeToggle from "../components/ThemeToggle";
import { theme } from "../lib/theme";

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
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Box
            pos="fixed"
            inset={0}
            bg="var(--mantine-color-body)"
            style={{ zIndex: -1, overflow: "hidden", pointerEvents: "none" }}
            aria-hidden="true"
          >
            <Box
              className={classes.blob}
              pos="absolute"
              bdrs="50%"
              w="44vw"
              h="44vw"
              left="-12vw"
              top="-14vw"
              bg="radial-gradient(circle at 30% 30%, var(--aurora-1), transparent 65%)"
            />
            <Box
              className={`${classes.blob} ${classes.blob2}`}
              pos="absolute"
              bdrs="50%"
              w="38vw"
              h="38vw"
              right="-10vw"
              top="8vh"
              bg="radial-gradient(circle at 60% 40%, var(--aurora-2), transparent 65%)"
            />
            <Box
              className={`${classes.blob} ${classes.blob3}`}
              pos="absolute"
              bdrs="50%"
              w="42vw"
              h="42vw"
              left="22vw"
              bottom="-16vw"
              bg="radial-gradient(circle at 50% 50%, var(--aurora-3), transparent 65%)"
            />
          </Box>
          <Notifications position="top-right" />
          <Container fluid p={0}>
            {children}
          </Container>
          <ThemeToggle />
        </MantineProvider>
        <Analytics />
      </body>
    </html>
  );
}
