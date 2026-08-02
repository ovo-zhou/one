import type { Metadata } from "next";
import getPublicPageById from "../../../actions/page/getPublicPageById";
import getPublicPages from "../../../actions/page/getPublicPages";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import dayjs from "dayjs";
import { Title, Text, Stack, Divider, Anchor, Box } from "@mantine/core";
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
                {page.title}
              </Title>
              {page.published && (
                <Text size="sm" c="dimmed" mt="md">
                  {dayjs(page.published).format("YYYY 年 M 月 D 日")}
                </Text>
              )}
            </Box>
            <Divider className="divider-gradient" />
            {page.content && (
              <Box w="100%">
                <MarkdownRenderer content={page.content} />
              </Box>
            )}
        </Stack>
      </Box>
    </main>
  );
}
