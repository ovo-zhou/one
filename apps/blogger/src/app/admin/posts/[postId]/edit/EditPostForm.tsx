"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput, Button, Group, Stack, TagsInput, Text, Box } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import AdminEditor from "../../../../../components/AdminEditor";
import { updatePost } from "../../../../../actions/post/updatePost";

interface EditPostFormProps {
  postId: string;
  initialTitle: string;
  initialContent: string;
  initialLabels: string[];
  initialStatus?: string;
}

export default function EditPostForm({
  postId,
  initialTitle,
  initialContent,
  initialLabels,
  initialStatus,
}: EditPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("请输入标题");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updatePost({
        postId,
        title,
        content,
        labels,
        isDraft: initialStatus === "DRAFT",
      });
      notifications.show({ title: "保存成功", message: "文章已更新", color: "green" });
      router.push("/admin/posts");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      notifications.show({ title: "保存失败", message: e instanceof Error ? e.message : "请稍后重试", color: "red" });
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" maw={900} className="glass-card" p="xl">
      <TextInput
        label="标题"
        placeholder="输入文章标题"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        required
      />
      <TagsInput
        label="标签"
        placeholder="输入后按回车添加"
        value={labels}
        onChange={setLabels}
        clearable
      />
      <Box>
        <Text size="sm" fw={500} mb={4}>内容</Text>
        <AdminEditor content={content} onChange={setContent} />
      </Box>
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
      <Group>
        <Button className="btn-glow" onClick={handleSubmit} loading={saving}>
          保存更新
        </Button>
        <Button variant="default" onClick={() => router.back()}>
          取消
        </Button>
      </Group>
    </Stack>
  );
}
