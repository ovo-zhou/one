"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Anchor,
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Input,
  Modal,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ArrowLeft, Check, Copy, Download, FileText, Upload } from "lucide-react";
import { formatRemaining } from "../../lib/locker";

interface LockerCell {
  code: string;
  fileName: string;
  remainingMs: number;
}

function extractFileName(disposition: string): string {
  const star = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (star?.[1]) return decodeURIComponent(star[1]);
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain?.[1] ?? "文件";
}

export default function LockerPage() {
  const [cells, setCells] = useState<LockerCell[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resultCode, setResultCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupCode, setPickupCode] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const total = 36;
  const used = cells.length;

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/locker/stats");
      if (!res.ok) return;
      const data = (await res.json()) as {
        used: number;
        total: number;
        items: { code: string; fileName: string; remainingMs: number }[];
      };
      setCells(
        data.items
          .filter((c) => c.remainingMs > 0)
          .map((c) => ({ code: c.code, fileName: c.fileName, remainingMs: c.remainingMs }))
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (resultCode && expiresAt) {
      const ticker = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(ticker);
    }
  }, [resultCode, expiresAt]);

  const onFilePicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      notifications.show({ title: "文件过大", message: "单文件不能超过 4MB", color: "red" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/locker/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notifications.show({ title: "存件失败", message: data.error || "请稍后重试", color: "red" });
        return;
      }
      setResultCode(data.code);
      setExpiresAt(data.expiresAt);
      fetchStats();
    } catch {
      notifications.show({ title: "存件失败", message: "网络异常，请稍后重试", color: "red" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!/^\d{6}$/.test(pickupCode)) {
      notifications.show({ title: "取件码格式不正确", message: "请输入 6 位数字取件码", color: "yellow" });
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(`/api/locker/download?code=${pickupCode}`);
      if (!res.ok) {
        notifications.show({ title: "取件失败", message: "取件码无效或已过期", color: "red" });
        fetchStats();
        return;
      }
      const blob = await res.blob();
      const fileName = extractFileName(res.headers.get("Content-Disposition") || "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      notifications.show({
        title: "取件成功",
        message: `已开始下载「${fileName}」，文件取出后即被清除`,
        color: "green",
      });
      setPickupOpen(false);
      setPickupCode("");
    } catch {
      notifications.show({ title: "取件失败", message: "网络异常，请稍后重试", color: "red" });
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!resultCode) return;
    try {
      await navigator.clipboard.writeText(resultCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notifications.show({ title: "复制失败", message: "请手动复制取件码", color: "red" });
    }
  };

  const remainingMs = expiresAt ? expiresAt - now : 0;

  return (
    <Flex justify="center">
      <Box w={{ base: "100%", sm: 640, lg: 960 }} px={{ base: "md", sm: 0 }} py="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Anchor href="/" underline="never" c="dimmed" className="back-link">
              <ArrowLeft size={16} />
              返回首页
            </Anchor>
          </Group>

          <Stack gap="sm">
            <Group grow>
              <Button
                className="locker-btn"
                size="lg"
                leftSection={<Upload size={18} />}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                存入柜中
              </Button>
              <Button
                className="locker-btn"
                size="lg"
                leftSection={<Download size={18} />}
                onClick={() => {
                  setPickupCode("");
                  setPickupOpen(true);
                }}
              >
                取件
              </Button>
            </Group>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              aria-label="选择要存入的文件"
              onChange={onFilePicked}
            />

            {resultCode && expiresAt && (
              <Stack align="center" gap="xs" className="locker-code-box">
                <Text size="xs" c="dimmed">
                  存件成功，请凭取件码取件（2 小时内有效）
                </Text>
                <Group gap={6}>
                  <Text className="locker-code" fw={900}>
                    {resultCode}
                  </Text>
                  <ActionIcon variant="light" color="primary" onClick={handleCopy} aria-label="复制取件码">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </ActionIcon>
                </Group>
                <Text size="xs" c="dimmed">
                  剩余有效时间
                </Text>
                <Text
                  size="lg"
                  fw={800}
                  className={remainingMs <= 0 ? "" : "locker-accent"}
                  c={remainingMs <= 0 ? "red" : undefined}
                >
                  {remainingMs <= 0 ? "已过期" : formatRemaining(remainingMs)}
                </Text>
              </Stack>
            )}

            {pickupOpen && (
              <Modal
                opened={pickupOpen}
                onClose={() => setPickupOpen(false)}
                title="取件"
                centered
              >
                <Stack gap="md">
                  <Input
                    placeholder="请输入 6 位取件码"
                    inputMode="numeric"
                    maxLength={6}
                    value={pickupCode}
                    onChange={(e) => setPickupCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDownload();
                    }}
                    className="locker-code-input"
                    autoFocus
                  />
                  <Button
                    className="locker-btn"
                    leftSection={<Download size={16} />}
                    loading={downloading}
                    onClick={handleDownload}
                    disabled={!pickupCode}
                  >
                    下载
                  </Button>
                </Stack>
              </Modal>
            )}
          </Stack>

          <Text size="xs" c="dimmed" ta="center">
            单文件不超过 <Text component="span" fw={800} c="inherit">4MB</Text> · 取件码{" "}
            <Text component="span" fw={800} c="inherit">2</Text> 小时过期 · 成功取件后文件立即清除，仅可取一次
          </Text>

          <Box className="glass-card locker-grid-card">
            <Group justify="space-between" mb="sm">
              <Text size="sm" fw={700}>
                柜体状态
              </Text>
              <Text size="sm" c="dimmed">
                剩余 <Text component="span" fw={800} className="locker-accent">{total - used}</Text> / {total} 格
              </Text>
            </Group>
            <Box className="locker-grid">
              {Array.from({ length: total }).map((_, i) => {
                const cell = cells[i];
                return (
                  <Tooltip key={i} label={cell ? "已占用" : "空柜"} openDelay={300} withArrow>
                    <Box className={`locker-cell${cell ? " locker-cell-used" : ""}`}>
                      {cell ? (
                        <Stack align="center" justify="center" h="100%">
                          <FileText size={16} />
                        </Stack>
                      ) : (
                        <Text fz={10} c="dimmed">
                          {String(i + 1).padStart(2, "0")}
                        </Text>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </Box>
    </Flex>
  );
}