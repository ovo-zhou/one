"use client";

import { Box, Container, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { usePathname } from "next/navigation";
import classes from "../app/layout.module.css";
import ThemeToggle from "./ThemeToggle";
import { theme } from "../lib/theme";

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <MantineProvider theme={isAdmin ? undefined : theme} defaultColorScheme="light">
      <div className={isAdmin ? "admin-theme" : "brand-theme"}>
        {!isAdmin && (
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
        )}
        <Notifications position="top-right" />
        <Container fluid p={0}>
          {children}
        </Container>
        <ThemeToggle />
      </div>
    </MantineProvider>
  );
}
