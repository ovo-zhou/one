"use client";

import { useState, useCallback, useTransition } from "react";
import {
  Table,
  Button,
  Group,
  Badge,
  Modal,
  Text,
  Flex,
  Loader,
  Box,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { getPages } from "../actions/page/getPages";
import { deletePage } from "../actions/page/deletePage";
import dayjs from "dayjs";

interface PageItem {
  id?: string | null;
  title?: string | null;
  status?: string | null;
  published?: string | null;
}

interface PageListData {
  items?: PageItem[];
  nextPageToken?: string | null;
  prevPageToken?: string | null;
}

export default function PageTable({ initialData }: { initialData: PageListData }) {
  const router = useRouter();
  const [data, setData] = useState<PageListData>(initialData);
  const [tokens, setTokens] = useState<string[]>([""]);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PageItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async (pageToken?: string) => {
    const result = await getPages({ pageToken: pageToken || undefined, maxResults: 10 });
    setData(result);
  }, []);

  const handlePage = useCallback(
    (direction: "next" | "prev") => {
      const token = direction === "next" ? data.nextPageToken : data.prevPageToken;
      if (!token) return;
      startTransition(() => {
        fetchData(token);
        if (direction === "next") {
          setTokens((prev) => [...prev, token]);
          setCurrentPage((p) => p + 1);
        } else {
          setTokens((prev) => prev.slice(0, -1));
          setCurrentPage((p) => p - 1);
        }
      });
    },
    [data, fetchData]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    await deletePage(deleteTarget.id);
    setDeleteTarget(null);
    fetchData(tokens[currentPage] || undefined);
  }, [deleteTarget, fetchData, tokens, currentPage]);

  return (
    <div>
      <Group justify="flex-end" mb="md">
        <Button onClick={() => router.push("/admin/pages/new")}>+ 新建页面</Button>
      </Group>

      <Box style={{ overflowX: "auto" }}>
        <Table striped highlightOnHover withTableBorder style={{ minWidth: 500 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>标题</Table.Th>
              <Table.Th w={100}>状态</Table.Th>
              <Table.Th w={140}>发布时间</Table.Th>
              <Table.Th w={140}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isPending ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Flex justify="center" py="xl">
                    <Loader size="sm" />
                  </Flex>
                </Table.Td>
              </Table.Tr>
            ) : (data.items || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="md">暂无页面</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              (data.items || []).map((page) => (
                <Table.Tr key={page.id}>
                  <Table.Td>
                    <Text fw={500} lineClamp={1}>{page.title || "(无标题)"}</Text>
                  </Table.Td>
                  <Table.Td>
                    {page.status === "LIVE" ? (
                      <Badge color="green" variant="light">已发布</Badge>
                    ) : (
                      <Badge color="yellow" variant="light">草稿</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {page.published ? dayjs(page.published).format("YYYY-MM-DD") : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        onClick={() => router.push(`/admin/pages/${page.id}/edit`)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        color="red"
                        onClick={() => setDeleteTarget(page)}
                      >
                        删除
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Box>

      <Group justify="flex-end" mt="md">
        <Button
          variant="default"
          size="sm"
          disabled={currentPage === 0}
          onClick={() => handlePage("prev")}
        >
          ← 上一页
        </Button>
        <Text size="sm" c="dimmed">第 {currentPage + 1} 页</Text>
        <Button
          variant="default"
          size="sm"
          disabled={!data.nextPageToken}
          onClick={() => handlePage("next")}
        >
          下一页 →
        </Button>
      </Group>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="确认删除" centered>
        <Text mb="lg">确定要删除页面「{deleteTarget?.title}」吗？此操作不可撤销。</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button color="red" onClick={handleDelete}>确认删除</Button>
        </Group>
      </Modal>
    </div>
  );
}
