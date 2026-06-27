import getPublicPageById from "../../../actions/page/getPublicPageById";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import dayjs from "dayjs";
import { Flex, Title, Text, Stack, Container } from "@mantine/core";
import { notFound } from "next/navigation";

export default async function PublicPageDetail({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const page = await getPublicPageById(pageId);

  if (!page || !page.title) {
    notFound();
  }

  return (
    <main>
      <Flex justify="center">
        <Container w={{ base: "100%", sm: 600, lg: 900 }} p={0}>
          <Stack gap="md">
            <Title order={1}>{page.title}</Title>
            {page.published && (
              <Text size="sm" c="dimmed">
                {dayjs(page.published).format("YYYY年MM月DD日 HH时mm分ss秒")}
              </Text>
            )}
            {page.content && <MarkdownRenderer content={page.content} />}
          </Stack>
        </Container>
      </Flex>
    </main>
  );
}
