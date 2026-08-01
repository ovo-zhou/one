import type { Metadata } from "next";
import getPostById from "../../actions/post/getPostById";
import getPosts from "../../actions/post/getPosts";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import dayjs from "dayjs";
import { Flex, Title, Text, Stack, Container } from "@mantine/core";

export const revalidate = 43200;

export async function generateStaticParams() {
  const { items } = await getPosts();
  return (items ?? []).map((post) => ({ postId: post.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId);
  return {
    title: post.title,
  };
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = await getPostById(postId);

  return (
    <main>
      <Flex justify="center">
        <Container w={{ base: "100%", sm: 600, lg: 900 }} px={{ base: "md", sm: 0 }} py={{ base: "lg", sm: "xl" }}>
          <Stack gap="md">
            <Title order={1}>{post.title}</Title>
            <Text size="sm" c="dimmed">
              {post.author.displayName} · {dayjs(post.published).format("YYYY/MM/DD HH:mm:ss")}
            </Text>
            <MarkdownRenderer content={post.content} />
          </Stack>
        </Container>
      </Flex>
    </main>
  );
}
