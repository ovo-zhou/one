import type { Metadata } from "next";
import getPostById from "../../actions/post/getPostById";
import getPosts from "../../actions/post/getPosts";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import dayjs from "dayjs";
import { Flex, Title, Text, Stack, Container, Divider, Anchor } from "@mantine/core";
import { ArrowLeft } from "lucide-react";

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
        <Container size="md" px={{ base: "md", sm: 0 }} py={{ base: "lg", sm: 80 }}>
          <Stack gap="md">
            <Anchor
              href="/"
              underline="never"
              size="sm"
              c="dimmed"
              w="fit-content"
              className="flex-center"
            >
              <ArrowLeft size={14} />
              返回首页
            </Anchor>
            <Title order={1}>{post.title}</Title>
            <Text size="sm" c="dimmed" mb="md">
              {post.author.displayName} · {dayjs(post.published).format("YYYY 年 M 月 D 日")}
            </Text>
            <Divider />
            <MarkdownRenderer content={post.content} />
          </Stack>
        </Container>
      </Flex>
    </main>
  );
}
