import getPostById from "../../actions/post/getPostById";
import { highlightHtml } from "../../lib/highlightHtml";
import dayjs from "dayjs";
import { Flex, Typography, Title, Text, Stack, Container } from "@mantine/core";

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await getPostById(postId);
  const content = await highlightHtml(post.content);

  return (
    <main>
      <Flex justify="center">
        <Container w={{ base: "100%", sm: 600, lg: 900 }} p={0}>
          <Stack gap="md">
            <Title order={1}>{post.title}</Title>
            <Text size="sm" c="dimmed">
              {post.author.displayName} · {dayjs(post.published).format("YYYY年MM月DD日 HH时mm分ss秒")}
            </Text>
            <Typography
              component="article"
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{ lineHeight: 1.8 }}
            />
          </Stack>
        </Container>
      </Flex>
    </main>
  );
}
