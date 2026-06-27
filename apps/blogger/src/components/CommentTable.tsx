"use client";

import { useState, useCallback, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  Avatar,
} from "@mantine/core";
import { getAdminComments } from "../actions/comment/getAdminComments";
import { deleteComment } from "../actions/comment/deleteComment";
import { approveComment } from "../actions/comment/approveComment";
import { markCommentAsSpam } from "../actions/comment/markCommentAsSpam";
import dayjs from "dayjs";

interface CommentItem {
  id?: string | null;
  content?: string | null;
  status?: string | null;
  published?: string | null;
  author?: {
    displayName?: string;
    image?: { url?: string };
  } | null;
  post?: { id?: string } | null;
}

interface CommentListData {
  items?: CommentItem[];
  nextPageToken?: string | null;
  prevPageToken?: string | null;
}

function stripHtml(html: string, maxLen: number): string {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > maxLen ? text.substring(0, maxLen) + "…" : text;
}

export default function CommentTable({ initialData }: { initialData: CommentListData }) {
  const [data, setData] = useState<CommentListData>(initialData);
  const [tokens, setTokens] = useState<string[]>([""]);
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async (pageToken?: string) => {
    const result = await getAdminComments({ pageToken: pageToken || undefined, maxResults: 20 });
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
    if (!deleteTarget?.id || !deleteTarget?.post?.id) return;
    await deleteComment({ postId: deleteTarget.post.id, commentId: deleteTarget.id });
    setDeleteTarget(null);
    fetchData(tokens[currentPage] || undefined);
  }, [deleteTarget, fetchData, tokens, currentPage]);

  const handleApprove = useCallback(
    async (comment: CommentItem) => {
      if (!comment.id || !comment.post?.id) return;
      await approveComment({ postId: comment.post.id, commentId: comment.id });
      fetchData(tokens[currentPage] || undefined);
    },
    [fetchData, tokens, currentPage]
  );

  const handleSpam = useCallback(
    async (comment: CommentItem) => {
      if (!comment.id || !comment.post?.id) return;
      await markCommentAsSpam({ postId: comment.post.id, commentId: comment.id });
      fetchData(tokens[currentPage] || undefined);
    },
    [fetchData, tokens, currentPage]
  );

  const statusBadge = (status?: string | null) => {
    switch (status) {
      case "LIVE":
        return <Badge color="green" variant="light">已批准</Badge>;
      case "SPAM":
        return <Badge color="red" variant="light">垃圾</Badge>;
      case "REMOVED_BY_AUTHOR":
        return <Badge color="gray" variant="light">已删除</Badge>;
      default:
        return <Badge color="yellow" variant="light">{status || "未知"}</Badge>;
    }
  };

  return (
    <div>
      <Box style={{ overflowX: "auto" }}>
        <Table striped highlightOnHover withTableBorder style={{ minWidth: 700 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={140}>作者</Table.Th>
              <Table.Th>内容</Table.Th>
              <Table.Th w={160}>所属文章</Table.Th>
              <Table.Th w={90}>状态</Table.Th>
              <Table.Th w={110}>时间</Table.Th>
              <Table.Th w={160}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isPending ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Flex justify="center" py="xl"><Loader size="sm" /></Flex>
                </Table.Td>
              </Table.Tr>
            ) : (data.items || []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md">暂无评论</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              (data.items || []).map((comment) => (
                <Table.Tr key={comment.id}>
                  <Table.Td>
                    <Group gap="xs">
                      {comment.author?.image?.url && (
                        <Avatar src={comment.author.image.url} size="sm" radius="xl" />
                      )}
                      <Text size="sm">{comment.author?.displayName || "匿名"}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={2}>
                      {comment.content ? stripHtml(comment.content, 80) : "(无内容)"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
                      {comment.post?.id ? comment.post.id.substring(0, 12) + "…" : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>{statusBadge(comment.status)}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {comment.published ? dayjs(comment.published).format("MM-DD HH:mm") : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {comment.status !== "LIVE" && (
                        <Button
                          variant="subtle"
                          size="compact-sm"
                          color="green"
                          onClick={() => handleApprove(comment)}
                        >
                          批准
                        </Button>
                      )}
                      {comment.status !== "SPAM" && (
                        <Button
                          variant="subtle"
                          size="compact-sm"
                          color="orange"
                          onClick={() => handleSpam(comment)}
                        >
                          垃圾
                        </Button>
                      )}
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        color="red"
                        onClick={() => setDeleteTarget(comment)}
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
          leftSection={<ChevronLeft size={16} />}
          disabled={currentPage === 0}
          onClick={() => handlePage("prev")}
        >
          上一页
        </Button>
        <Text size="sm" c="dimmed">第 {currentPage + 1} 页</Text>
        <Button
          variant="default"
          size="sm"
          rightSection={<ChevronRight size={16} />}
          disabled={!data.nextPageToken}
          onClick={() => handlePage("next")}
        >
          下一页
        </Button>
      </Group>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="确认删除" centered>
        <Text mb="lg">确定要删除此评论吗？此操作不可撤销。</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button color="red" onClick={handleDelete}>确认删除</Button>
        </Group>
      </Modal>
    </div>
  );
}
