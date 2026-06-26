"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput, Button, Group, Stack, Switch, TagsInput, Title, Text } from "@mantine/core";
import AdminEditor from "../../../../components/AdminEditor";
import { createPost } from "../../../../actions/post/createPost";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(true);
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
      await createPost({ title, content, labels, isDraft });
      router.push("/admin/posts");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSaving(false);
    }
  };

  return (
    <div>
      <Title order={2} mb="lg">新建文章</Title>
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
        <Switch
          label="保存为草稿"
          checked={isDraft}
          onChange={(e) => setIsDraft(e.currentTarget.checked)}
        />
        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}
        <Group>
          <Button onClick={handleSubmit} loading={saving}>
            {isDraft ? "保存草稿" : "立即发布"}
          </Button>
          <Button variant="default" onClick={() => router.back()}>
            取消
          </Button>
        </Group>
      </Stack>
    </div>
  );
}
