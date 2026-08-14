"use client";

import { useCallback, useEffect, useState } from "react";
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
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Copy, Check, Trash2, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { formatBytes } from "../lib/locker";

export interface LockerItem {
  code: string;
  fileName: string;
  size: number;
  uploadedAt: number;
  remainingMs: number;
}

export default function LockerTable({ initialItems }: { initialItems: LockerItem[] }) {
  const [items, setItems] = useState<LockerItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LockerItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locker/list");
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as { items: LockerItem[] };
      setItems(data.items);
    } catch {
      notifications.show({ title: "加载失败", message: "请稍后重试", color: "red" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/locker/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deleteTarget.code }),
      });
      if (!res.ok) throw new Error("删除失败");
      notifications.show({
        title: "已删除",
        message: `取件码 ${deleteTarget.code} 的文件已删除`,
        color: "green",
      });
      setDeleteTarget(null);
      fetchData();
    } catch {
      notifications.show({ title: "删除失败", message: "请稍后重试", color: "red" });
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      notifications.show({ title: "复制失败", message: "请手动复制取件码", color: "red" });
    }
  };

  const hours = Math.floor(items.reduce((sum, i) => sum + i.remainingMs, 0) / 3600000);

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Badge color="primary" variant="light" className="badge-dot">
            占用 {items.length} / 36 格
          </Badge>
          <Badge color="gray" variant="light">
            累计剩余有效时长约 {hours} 小时
          </Badge>
        </Group>
        <Button
          variant="default"
          size="sm"
          leftSection={<RefreshCw size={14} />}
          onClick={fetchData}
          loading={loading}
        >
          刷新
        </Button>
      </Group>

      <Box className="scroll-x">
        <Table striped highlightOnHover withTableBorder miw={640} className="admin-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={120}>取件码</Table.Th>
              <Table.Th>文件名</Table.Th>
              <Table.Th w={100}>大小</Table.Th>
              <Table.Th w={150}>存件时间</Table.Th>
              <Table.Th w={120}>剩余时间</Table.Th>
              <Table.Th w={130}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading && items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Flex justify="center" py="xl">
                    <Loader size="sm" />
                  </Flex>
                </Table.Td>
              </Table.Tr>
            ) : items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md">
                    柜子是空的，暂无文件
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item) => (
                <Table.Tr key={item.code}>
                  <Table.Td>
                    <Text fw={800} className="locker-code" size="lg">
                      {item.code}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text lineClamp={1} fw={600}>
                      {item.fileName}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatBytes(item.size)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {dayjs(item.uploadedAt).format("MM-DD HH:mm")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={item.remainingMs < 3600000 ? "orange" : undefined}>
                      {Math.floor(item.remainingMs / 3600000)} 小时 {Math.floor((item.remainingMs % 3600000) / 60000)} 分
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="复制取件码" withArrow>
                        <ActionIcon variant="subtle" onClick={() => handleCopy(item.code)}>
                          {copiedCode === item.code ? <Check size={16} /> : <Copy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="删除文件" withArrow>
                        <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(item)}>
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Box>

      <Modal opened={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="确认删除" centered>
        <Text mb="lg">
          确定要删除取件码 <Text component="span" fw={800}>{deleteTarget?.code}</Text> 对应的文件「
          {deleteTarget?.fileName}」吗？此操作不可撤销。
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>
            取消
          </Button>
          <Button color="red" loading={deleting} onClick={handleDelete}>
            确认删除
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}