"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import {
  Table,
  TextInput,
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
import { getAdminPosts } from "../actions/post/getAdminPosts";
import { deletePost } from "../actions/post/deletePost";
import { publishPost } from "../actions/post/publishPost";
import { revertPost } from "../actions/post/revertPost";
import dayjs from "dayjs";

interface PostItem {
  id?: string | null;
  title?: string | null;
  published?: string | null;
  updated?: string | null;
  status?: string | null;
  url?: string | null;
}

interface PostListData {
  items?: PostItem[];
  nextPageToken?: string | null;
  prevPageToken?: string | null;
}

export default function PostTable({ initialData }: { initialData: PostListData }) {
  const router = useRouter();
  const [data, setData] = useState<PostListData>(initialData);
  const [search, setSearch] = useState("");
  const [tokens, setTokens] = useState<string[]>([initialData.nextPageToken ? "" : "start"]);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PostItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    async (pageToken?: string, query?: string) => {
      const result = await getAdminPosts({
        pageToken: pageToken || undefined,
        search: query || undefined,
        maxResults: 10,
      });
      setData(result);
    },
    []
  );

  const handleSearch = useCallback(() => {
    startTransition(() => {
      fetchData(undefined, search);
    });
  }, [search, fetchData]);

  const handlePage = useCallback(
    (direction: "next" | "prev") => {
      const token = direction === "next" ? data.nextPageToken : data.prevPageToken;
      if (!token) return;
      startTransition(() => {
        fetchData(token, search || undefined);
        if (direction === "next") {
          setTokens((prev) => [...prev, token]);
          setCurrentPage((p) => p + 1);
        } else {
          setTokens((prev) => prev.slice(0, -1));
          setCurrentPage((p) => p - 1);
        }
      });
    },
    [data, search, fetchData]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return;
    await deletePost(deleteTarget.id);
    setDeleteTarget(null);
    fetchData(tokens[currentPage] || undefined, search || undefined);
  }, [deleteTarget, fetchData, tokens, currentPage, search]);

  const handlePublish = useCallback(
    async (postId: string) => {
      await publishPost(postId);
      fetchData(tokens[currentPage] || undefined, search || undefined);
    },
    [fetchData, tokens, currentPage, search]
  );

  const handleRevert = useCallback(
    async (postId: string) => {
      await revertPost(postId);
      fetchData(tokens[currentPage] || undefined, search || undefined);
    },
    [fetchData, tokens, currentPage, search]
  );

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Group>
          <TextInput
            placeholder="搜索标题..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button variant="light" onClick={handleSearch} loading={isPending}>
            搜索
          </Button>
        </Group>
        <Button onClick={() => router.push("/admin/posts/new")}>+ 新建文章</Button>
      </Group>

      <Box style={{ overflowX: "auto" }}>
      <Table striped highlightOnHover withTableBorder style={{ minWidth: 600 }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>标题</Table.Th>
            <Table.Th w={100}>状态</Table.Th>
            <Table.Th w={140}>发布时间</Table.Th>
            <Table.Th w={200}>操作</Table.Th>
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
                <Text ta="center" c="dimmed" py="md">
                  暂无文章
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            (data.items || []).map((post) => (
              <Table.Tr key={post.id}>
                <Table.Td>
                  <Text fw={500} lineClamp={1}>
                    {post.title || "(无标题)"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {post.status === "LIVE" || post.url ? (
                    <Badge color="green" variant="light">
                      已发布
                    </Badge>
                  ) : (
                    <Badge color="yellow" variant="light">
                      草稿
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {post.published ? dayjs(post.published).format("YYYY-MM-DD") : "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => router.push(`/admin/posts/${post.id}/edit`)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      color="red"
                      onClick={() => setDeleteTarget(post)}
                    >
                      删除
                    </Button>
                    {post.status === "LIVE" || post.url ? (
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        color="orange"
                        onClick={() => post.id && handleRevert(post.id)}
                      >
                        退回
                      </Button>
                    ) : (
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        color="green"
                        onClick={() => post.id && handlePublish(post.id)}
                      >
                        发布
                      </Button>
                    )}
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
          disabled={currentPage === 0 && !data.prevPageToken}
          onClick={() => handlePage("prev")}
        >
          ← 上一页
        </Button>
        <Text size="sm" c="dimmed">
          第 {currentPage + 1} 页
        </Text>
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
        <Text mb="lg">
          确定要删除文章「{deleteTarget?.title}」吗？此操作不可撤销。
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>
            取消
          </Button>
          <Button color="red" onClick={handleDelete}>
            确认删除
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
