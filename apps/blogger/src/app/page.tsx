import classes from "./page.module.css";
import type { Metadata } from "next";
import getBlog from "../actions/blog/getBlog";
import getPosts from "../actions/post/getPosts";
import getPublicPages from "../actions/page/getPublicPages";
import dayjs from "dayjs";
import { Flex, Box, Title, Stack, Anchor, Text, Group, Paper } from "@mantine/core";
import { Copyright } from "lucide-react";
import Greeting from "../components/Greeting";

export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const blog = await getBlog();
  return {
    title: blog.name,
    description: blog.description,
  };
}

export default async function Home() {
  const [blog, posts, pages] = await Promise.all([
    getBlog(),
    getPosts(),
    getPublicPages(),
  ]);

  return (
    <main>
      <Flex justify="center">
        <Box
          w={{ base: "100%", sm: 600, lg: 900 }}
          px={{ base: "md", sm: 0 }}
          pt={{ base: "xl", sm: 96 }}
          pb="lg"
        >
          <Stack align="center" gap="md">
            <Greeting blogName={blog.name} />
            <Text size="lg" c="dimmed" fw={400} ta="center" maw={560}>
              {blog.description}
            </Text>
            <Flex justify="center" mt="md" wrap="wrap" gap="sm">
              {(pages.items ?? []).map((page) => (
                <Anchor
                  key={page.id}
                  href={`/pages/${page.id}`}
                  underline="never"
                  c="inherit"
                  className={classes.pagePill}
                  display="block"
                  bd={0}
                  py={10}
                  px={24}
                  bdrs={999}
                  style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
                >
                  <Text size="sm" fw={600}>
                    {page.title}
                  </Text>
                </Anchor>
              ))}
            </Flex>
          </Stack>
        </Box>
      </Flex>

      <Flex justify="center" pt="xl" pb="lg">
        <Stack w={{ base: "100%", sm: 620, lg: 760 }} gap="lg" px={{ base: "md", sm: 0 }}>
          {posts.items.length === 0 ? (
            <Paper
              className={classes.postCard}
              p={24}
              radius="lg"
              shadow="post"
              withBorder
              pos="relative"
              bg="color-mix(in srgb, var(--mantine-color-body) 55%, transparent)"
              bd="1px solid color-mix(in srgb, var(--mantine-color-default-border) 60%, transparent)"
              ta="center"
              c="dimmed"
            >
              <Text>还没有文章，敬请期待</Text>
            </Paper>
          ) : (
            posts.items.map((post) => (
              <Paper
                key={post.id}
                className={classes.postCard}
                p={24}
                radius="lg"
                shadow="post"
                withBorder
                pos="relative"
                bg="color-mix(in srgb, var(--mantine-color-body) 55%, transparent)"
                bd="1px solid color-mix(in srgb, var(--mantine-color-default-border) 60%, transparent)"
              >
                <Group gap="xs" mb={10}>
                  <Text
                    size="xs"
                    fw={600}
                    c="primary"
                    py={3}
                    px={12}
                    bdrs="xl"
                    bg="color-mix(in srgb, var(--mantine-color-body) 55%, transparent)"
                    bd="1px solid color-mix(in srgb, var(--mantine-color-default-border) 60%, transparent)"
                    style={{ backdropFilter: "blur(14px) saturate(1.3)", WebkitBackdropFilter: "blur(14px) saturate(1.3)" }}
                  >
                    {dayjs(post.published).format("YYYY 年 M 月 D 日")}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {post.author.displayName}
                  </Text>
                </Group>
                <Anchor href={`/${post.id}`} underline="never" c="inherit">
                  <Title order={3} lineClamp={2} className={classes.postTitle}>
                    {post.title}
                  </Title>
                </Anchor>
                <Text size="sm" c="dimmed" mt="sm" lineClamp={3}>
                  {post.content.replace(/<[^>]*>/g, "").substring(0, 200)}
                </Text>
              </Paper>
            ))
          )}
        </Stack>
      </Flex>

      <Flex
        justify="center"
        py="xl"
        mt="xl"
        style={{
          backgroundImage:
            "linear-gradient(var(--mantine-color-body), var(--mantine-color-body)), var(--brand-gradient)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        <Group gap={4} c="dimmed">
          <Copyright size={14} />
          <Text size="sm">{dayjs().year()} {blog.name}</Text>
        </Group>
      </Flex>
    </main>
  );
}
