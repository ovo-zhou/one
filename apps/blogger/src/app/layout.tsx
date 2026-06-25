import type { Metadata } from "next";
import "./globals.css";
import "@mantine/core/styles.css";

import { ColorSchemeScript, MantineProvider, mantineHtmlProps, Container, Flex } from "@mantine/core";
import { getSession } from "../lib/session";
import UserMenu from "../components/UserMenu";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "A Next.js app in the monorepo",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session ? { name: session.name, email: session.email, picture: session.picture } : null;
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Container fluid p={0}>
            <Flex justify="flex-end" p="sm">
              <UserMenu user={user} />
            </Flex>
            {children}
          </Container>
        </MantineProvider>
      </body>
    </html>
  );
}
