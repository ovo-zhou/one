"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput, Button, Group, Stack, Text } from "@mantine/core";
import AdminEditor from "../../../../../components/AdminEditor";
import { updatePage } from "../../../../../actions/page/updatePage";

interface EditPageFormProps {
  pageId: string;
  initialTitle: string;
  initialContent: string;
  initialStatus?: string;
}

export default function EditPageForm({
  pageId,
  initialTitle,
  initialContent,
  initialStatus,
}: EditPageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const isDraft = initialStatus === "DRAFT";
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
      await updatePage({ pageId, title, content, isDraft });
      router.push("/admin/pages");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" maw={900}>
      <TextInput
        label="标题"
        placeholder="输入页面标题"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        required
      />
      <div>
        <Text size="sm" fw={500} mb={4}>内容</Text>
        <AdminEditor content={content} onChange={setContent} />
      </div>
      {error && <Text c="red" size="sm">{error}</Text>}
      <Group>
        <Button onClick={handleSubmit} loading={saving}>保存更新</Button>
        <Button variant="default" onClick={() => router.back()}>取消</Button>
      </Group>
    </Stack>
  );
}
