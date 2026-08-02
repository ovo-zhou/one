import type { Metadata } from "next";
import getPublicPageById from "../../../actions/page/getPublicPageById";
import getPublicPages from "../../../actions/page/getPublicPages";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import dayjs from "dayjs";
import { Flex, Title, Text, Stack, Container, Divider, Anchor } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const revalidate = 43200;

export async function generateStaticParams() {
  const { items } = await getPublicPages();
  return (items ?? []).map((page) => ({ pageId: page.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}): Promise<Metadata> {
  const { pageId } = await params;
  const page = await getPublicPageById(pageId);
  return {
    title: page?.title,
  };
}

export default async function PublicPageDetail({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const page = await getPublicPageById(pageId);

  if (!page || !page.title) {
    notFound();
  }

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
            <Title order={1}>{page.title}</Title>
            {page.published && (
              <Text size="sm" c="dimmed" mb="md">
                {dayjs(page.published).format("YYYY 年 M 月 D 日")}
              </Text>
            )}
            <Divider />
            {page.content && <MarkdownRenderer content={page.content} />}
          </Stack>
        </Container>
      </Flex>
    </main>
  );
}
