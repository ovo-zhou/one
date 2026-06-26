"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { Typography } from "@mantine/core";

const lowlight = createLowlight(common);

interface AdminEditorProps {
  content?: string;
  onChange?: (html: string) => void;
}

export default function AdminEditor({ content, onChange }: AdminEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: Typography.classes.root ?? "" },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  return (
    <div style={{ border: "1px solid var(--mantine-color-default-border)", borderRadius: "4px" }}>
      <div style={{ padding: "12px", minHeight: "300px" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
