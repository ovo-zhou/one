import type { Metadata } from "next";
import getBlog from "../actions/blog/getBlog";
import getPosts from "../actions/post/getPosts";
import getPublicPages from "../actions/page/getPublicPages";
import dayjs from "dayjs";
import { Flex, Box, Title, Stack, Anchor, Text, Divider, Group } from "@mantine/core";
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
        <Box w={{ base: "100%", sm: 600, lg: 900 }} px={{ base: "md", sm: 0 }} pt={{ base: "xl", sm: 80 }} pb="lg">
          <Stack align="stretch" gap="sm">
            <Greeting blogName={blog.name} />
            <Text size="lg" c="dimmed" fw={400}>
              {blog.description}
            </Text>
            {pages.items && pages.items.length > 0 && (
              <Flex justify="center" mt="lg">
                <Group gap="md">
                  {pages.items.map((page) => (
                    <Anchor
                      key={page.id}
                      href={`/pages/${page.id}`}
                      underline="never"
                      c="inherit"
                      className="page-pill"
                    >
                      <Text size="sm" fw={500}>
                        {page.title}
                      </Text>
                    </Anchor>
                  ))}
                </Group>
              </Flex>
            )}
          </Stack>
        </Box>
      </Flex>

      <Flex justify="center">
        <Stack
          w={{ base: "100%", sm: 600, lg: 720 }}
          gap="lg"
          px={{ base: "md", sm: 0 }}
          pb={{ base: "xl", sm: 80 }}
        >
          {posts.items.map((post) => (
            <Box key={post.id}>
              <Group gap="xs" mb={6}>
                <Text size="sm" c="dimmed">
                  {dayjs(post.published).format("YYYY 年 M 月 D 日")}
                </Text>
                <Text size="sm" c="dimmed">
                  · {post.author.displayName}
                </Text>
              </Group>
              <Anchor href={`/${post.id}`} underline="never" c="inherit" className="post-link">
                <Title order={3} lineClamp={2}>
                  {post.title}
                </Title>
              </Anchor>
              <Text size="sm" c="dimmed" mt="xs" lineClamp={3}>
                {post.content.replace(/<[^>]*>/g, "").substring(0, 200)}
              </Text>
              <Divider mt="xl" />
            </Box>
          ))}
        </Stack>
      </Flex>

      <Flex justify="center" py="xl" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
        <Group gap={4} c="dimmed">
          <Copyright size={14} />
          <Text size="sm">{dayjs().year()} {blog.name}</Text>
        </Group>
      </Flex>
    </main>
  );
}
