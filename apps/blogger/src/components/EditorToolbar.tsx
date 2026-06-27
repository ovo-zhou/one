"use client";

import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { ActionIcon, Group, Tooltip, Divider, Popover, TextInput, Button, Stack } from "@mantine/core";
import {
  type LucideIcon,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Minus,
  Link as LinkIcon,
  ImagePlus,
  Table2,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
  onUploadImage: () => void;
}

function ToolButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} position="bottom" withArrow>
      <ActionIcon
        variant={active ? "filled" : "subtle"}
        size="md"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
      >
        <Icon size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

export default function EditorToolbar({ editor, onUploadImage }: EditorToolbarProps) {
  const [linkOpened, setLinkOpened] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      task: editor.isActive("taskList"),
      quote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      link: editor.isActive("link"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const run = (fn: () => void) => fn();

  const openLink = () => {
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkOpened(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkOpened(false);
  };

  return (
    <Group gap="xs" wrap="wrap" p="6px 8px" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
      <ToolButton icon={Undo2} label="撤销" disabled={!s.canUndo} onClick={() => run(() => editor.chain().focus().undo().run())} />
      <ToolButton icon={Redo2} label="重做" disabled={!s.canRedo} onClick={() => run(() => editor.chain().focus().redo().run())} />

      <Divider orientation="vertical" />

      <ToolButton icon={Bold} label="加粗" active={s.bold} onClick={() => run(() => editor.chain().focus().toggleBold().run())} />
      <ToolButton icon={Italic} label="斜体" active={s.italic} onClick={() => run(() => editor.chain().focus().toggleItalic().run())} />
      <ToolButton icon={Strikethrough} label="删除线" active={s.strike} onClick={() => run(() => editor.chain().focus().toggleStrike().run())} />
      <ToolButton icon={Code} label="行内代码" active={s.code} onClick={() => run(() => editor.chain().focus().toggleCode().run())} />

      <Divider orientation="vertical" />

      <ToolButton icon={Heading1} label="标题1" active={s.h1} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} />
      <ToolButton icon={Heading2} label="标题2" active={s.h2} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} />
      <ToolButton icon={Heading3} label="标题3" active={s.h3} onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} />

      <Divider orientation="vertical" />

      <ToolButton icon={List} label="无序列表" active={s.bullet} onClick={() => run(() => editor.chain().focus().toggleBulletList().run())} />
      <ToolButton icon={ListOrdered} label="有序列表" active={s.ordered} onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())} />
      <ToolButton icon={ListChecks} label="任务列表" active={s.task} onClick={() => run(() => editor.chain().focus().toggleTaskList().run())} />

      <Divider orientation="vertical" />

      <ToolButton icon={Quote} label="引用" active={s.quote} onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())} />
      <ToolButton icon={SquareCode} label="代码块" active={s.codeBlock} onClick={() => run(() => editor.chain().focus().toggleCodeBlock().run())} />
      <ToolButton icon={Minus} label="分割线" onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())} />

      <Divider orientation="vertical" />

      <Popover opened={linkOpened} onChange={setLinkOpened} width={260} position="bottom" shadow="md">
        <Popover.Target>
          <span>
            <ToolButton icon={LinkIcon} label="链接" active={s.link} onClick={openLink} />
          </span>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <TextInput
              placeholder="https://"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              size="xs"
              autoFocus
            />
            <Group justify="flex-end" gap="xs">
              <Button size="xs" variant="subtle" onClick={() => setLinkOpened(false)}>
                取消
              </Button>
              <Button size="xs" onClick={applyLink}>
                应用
              </Button>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>

      <ToolButton icon={ImagePlus} label="上传图片" onClick={onUploadImage} />
      <ToolButton icon={Table2} label="插入表格" onClick={() => run(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())} />
    </Group>
  );
}
