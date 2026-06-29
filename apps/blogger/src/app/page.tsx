import type { Metadata } from "next";
import getBlog from "../actions/blog/getBlog";
import getPosts from "../actions/post/getPosts";
import getPublicPages from "../actions/page/getPublicPages";
import dayjs from "dayjs";
import { Flex, Box, Title, Stack, Anchor, Text, Divider, Group } from "@mantine/core";
import { Copyright } from "lucide-react";
import { getSession } from "../lib/session";
import UserDropdown from "../components/UserDropdown";
import BlogNameLogin from "../components/BlogNameLogin";

export async function generateMetadata(): Promise<Metadata> {
  const blog = await getBlog();
  return {
    title: blog.name,
    description: blog.description,
  };
}

export default async function Home() {
  const [blog, posts, pages, session] = await Promise.all([
    getBlog(),
    getPosts(),
    getPublicPages(),
    getSession(),
  ]);
  const isAdmin = session?.email === process.env.admin_email;

  return (
    <main>
      <Flex justify="center">
        <Box w={{ base: "100%", sm: 600, lg: 900 }} px={{ base: "md", sm: 0 }}>
          <Stack align="stretch" justify="center" gap="xl" h={{ base: 300, sm: 350, lg: 400 }}>
            {session ? (
              isAdmin ? (
                <Title order={1}>
                  你好，我是{" "}
                  <a href="/admin" style={{ color: "inherit", textDecoration: "none" }}>
                    {blog.name}
                  </a>
                </Title>
              ) : (
                <Title order={1}>
                  你好
                  <UserDropdown name={session.name || session.email || ""} />
                  ，我是 {blog.name}
                </Title>
              )
            ) : (
              <Title order={1}>
                你好，我是 <BlogNameLogin name={blog.name} />
              </Title>
            )}
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
                {dayjs(post.published).format("YYYY年MM月DD日 HH:mm:ss")}
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
