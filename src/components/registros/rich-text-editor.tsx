"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Highlighter,
  Undo,
  Redo,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { value: "var(--base-1)", label: "Azul-marinho" },
  { value: "var(--base-2)", label: "Cinza-azulado" },
  { value: "var(--base-3)", label: "Verde-acinzentado" },
  { value: "var(--status-concluido)", label: "Verde" },
  { value: "var(--prioridade-importante)", label: "Laranja" },
  { value: "var(--prioridade-medio)", label: "Amarelo" },
  { value: "var(--status-pendente)", label: "Vermelho" },
];

const TextColor = Mark.create({
  name: "textColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) =>
          attributes.color ? { style: `color: ${attributes.color}` } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*=color]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(active && "text-foreground")}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 bg-muted/40 p-1">
      <ToolbarButton
        label="Negrito"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Itálico"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Sublinhado"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Tachado"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Destaque"
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="size-4" />
      </ToolbarButton>
      <div className="flex items-center gap-0.5 px-1">
        <Palette className="size-4 text-muted-foreground" />
        {TEXT_COLORS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-label={`Cor ${label}`}
            className="size-5 rounded-sm border border-border"
            style={{ backgroundColor: value }}
            onClick={() =>
              editor
                .chain()
                .focus()
                .setMark("textColor", { color: value })
                .run()
            }
          />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Título 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Título 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Título 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Lista com marcadores"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Citação"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Código"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Alinhar à esquerda"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Centralizar"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Alinhar à direita"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Link"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("URL do link:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Inserir tabela"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        <TableIcon className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ToolbarButton
        label="Desfazer"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Refazer"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="size-4" />
      </ToolbarButton>
    </div>
  );
}

// Lê um arquivo de imagem (do clipboard ou de um drop) como data URI base64,
// para que o print colado fique embutido no próprio HTML — sem depender de
// upload/hospedagem externa.
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function imageFilesFrom(list: DataTransferItemList | FileList | null): File[] {
  if (!list) return [];
  const files: File[] = [];
  for (const entry of Array.from(list as ArrayLike<DataTransferItem | File>)) {
    if (entry instanceof File) {
      if (entry.type.startsWith("image/")) files.push(entry);
    } else if (entry.kind === "file" && entry.type.startsWith("image/")) {
      const file = entry.getAsFile();
      if (file) files.push(file);
    }
  }
  return files;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  // Ref sincronizada ao editor (via effect) para os handlers de paste/drop,
  // que são criados antes de o editor existir.
  const editorRef = useRef<Editor | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Highlight,
      TextColor,
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-48 rounded-b-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-ring/50",
      },
      // Colar um print (Ctrl/Cmd+V com imagem no clipboard) insere a imagem
      // direto no texto, sem precisar de botão ou campo dedicado.
      handlePaste: (view, event) => {
        const images = imageFilesFrom(event.clipboardData?.items ?? null);
        if (images.length === 0) return false;
        event.preventDefault();
        void Promise.all(images.map(fileToDataUri)).then((uris) => {
          for (const src of uris) {
            editorRef.current?.chain().focus().setImage({ src }).run();
          }
        });
        return true;
      },
      // Arrastar e soltar uma imagem também funciona.
      handleDrop: (view, event) => {
        const images = imageFilesFrom(event.dataTransfer?.files ?? null);
        if (images.length === 0) return false;
        event.preventDefault();
        void Promise.all(images.map(fileToDataUri)).then((uris) => {
          for (const src of uris) {
            editorRef.current?.chain().focus().setImage({ src }).run();
          }
        });
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
