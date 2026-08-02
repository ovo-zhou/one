import type { Metadata } from "next";
import getPostById from "../../actions/post/getPostById";
import getPosts from "../../actions/post/getPosts";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import dayjs from "dayjs";
import { Title, Text, Stack, Divider, Anchor, Box } from "@mantine/core";
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
      <Box w={{ base: "100%", sm: 620, lg: 760 }} mx="auto" px={{ base: "md", sm: 0 }} py={{ base: "lg", sm: 72 }}>
        <Stack gap="lg">
            <Anchor
              href="/"
              underline="never"
              size="sm"
              c="dimmed"
              w="fit-content"
              className="flex-center back-link"
            >
              <ArrowLeft size={14} />
              返回首页
            </Anchor>
            <Box>
              <Title
                order={1}
                className="brand-text"
                style={{ fontSize: "clamp(30px, 5vw, 46px)", letterSpacing: "-0.03em" }}
              >
                {post.title}
              </Title>
              <Text size="sm" c="dimmed" mt="md">
                <Text component="span" fw={600} c="primary">
                  {post.author.displayName}
                </Text>
                {" · "}
                {dayjs(post.published).format("YYYY 年 M 月 D 日")}
              </Text>
            </Box>
            <Divider className="divider-gradient" />
            <Box w="100%">
              <MarkdownRenderer content={post.content} />
            </Box>
        </Stack>
      </Box>
    </main>
  );
}
