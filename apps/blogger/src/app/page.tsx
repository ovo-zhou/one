import type { Metadata } from "next";
import getBlog from "../actions/blog/getBlog";
import getPosts from "../actions/post/getPosts";
import getPublicPages from "../actions/page/getPublicPages";
import dayjs from "dayjs";
import { Flex, Box, Title, Stack, Anchor, Text, Divider, Group } from "@mantine/core";
import { Copyright } from "lucide-react";
import Greeting from "../components/Greeting";

export const revalidate = 60 * 60 * 12;

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
        <Box w={{ base: "100%", sm: 600, lg: 900 }} px={{ base: "md", sm: 0 }}>
          <Stack align="stretch" justify="center" gap="xl" h={{ base: 300, sm: 350, lg: 400 }}>
            <Greeting blogName={blog.name} />
            <Title order={4}>{blog.description}</Title>
            {pages.items && pages.items.length > 0 && (
              <Flex justify="center" mt="lg">
                <Group w={{ base: "100%", sm: 600, lg: 900 }} gap="md">
                  {pages.items.map((page) => (
                    <Anchor key={page.id} href={`/pages/${page.id}`} underline="never" c="inherit">
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
        <Stack w={{ base: "100%", sm: 600, lg: 900 }} gap="lg" px={{ base: "md", sm: 0 }}>
          {posts.items.map((post) => (
            <Box key={post.id}>
              <Anchor href={`/${post.id}`} underline="never" c="inherit">
                <Title order={3}>{post.title}</Title>
              </Anchor>
              <Text size="sm" c="dimmed" mt={4}>
                {post.author.displayName} ·{" "}
                {dayjs(post.published).format("YYYY/MM/DD HH:mm:ss")}
              </Text>
              <Text size="sm" mt="xs" lineClamp={3}>
                {post.content.replace(/<[^>]*>/g, "").substring(0, 200)}
              </Text>
              <Divider mt="md" />
            </Box>
          ))}
        </Stack>
      </Flex>
      <Flex justify="center" mt="xl">
        <Text size="sm" c="dimmed" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Copyright size={14} />
          {dayjs().year()} {blog.name}
        </Text>
      </Flex>
    </main>
  );
}
