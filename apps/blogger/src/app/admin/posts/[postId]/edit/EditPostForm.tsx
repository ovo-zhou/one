"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput, Button, Group, Stack, TagsInput, Title, Text } from "@mantine/core";
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
      router.push("/admin/posts");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" maw={900}>
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
      <div>
        <Text size="sm" fw={500} mb={4}>内容</Text>
        <AdminEditor content={content} onChange={setContent} />
      </div>
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
      <Group>
        <Button onClick={handleSubmit} loading={saving}>
          保存更新
        </Button>
        <Button variant="default" onClick={() => router.back()}>
          取消
        </Button>
      </Group>
    </Stack>
  );
}
