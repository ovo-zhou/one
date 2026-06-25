import getBlog from "../actions/blog/getBlog";
import getPosts from "../actions/blog/getPosts";
import dayjs from "dayjs";
import { Flex, Box, Title, Stack, Anchor, Text, Divider } from "@mantine/core";

export default async function Home() {
  const [blog, posts] = await Promise.all([getBlog(), getPosts()]);
  console.log("blog", blog, posts);
  return (
    <main>
      <Flex justify="center">
        <Box w={{ base: "100%", sm: 600, lg: 900 }}>
          <Stack align="stretch" justify="center" gap="xl" h={{ base:300,sm: 350, lg: 400 }}>
            <Title order={1}>你好，我是 {blog.name}</Title>
            <Title order={4}>{blog.description}</Title>
          </Stack>
        </Box>
      </Flex>
      <Flex justify="center">
        <Stack w={{ base: "100%", sm: 600, lg: 900 }} gap="lg">
          {posts.items.map((post) => (
            <Box key={post.id}>
              <Anchor href={`/${post.id}`} underline="never" c="dark">
                <Title order={3}>{post.title}</Title>
              </Anchor>
              <Text size="sm" c="dimmed" mt={4}>
                {post.author.displayName} · {dayjs(post.published).format("YYYY年MM月DD日 HH:mm:ss")}
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
        <Text size="sm" c="dimmed">© {dayjs().year()} {blog.name}</Text>
      </Flex>
    </main>
  );
}
