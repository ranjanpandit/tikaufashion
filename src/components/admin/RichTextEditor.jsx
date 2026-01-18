"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import ResizeImage from "tiptap-extension-resize-image";
import ImageUploader from "@/components/admin/ImageUploader";

function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-3 py-1 text-sm border rounded-md transition ${
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  // ✅ Mode Toggle
  const [mode, setMode] = useState("visual"); // "visual" | "html"
  const [htmlDraft, setHtmlDraft] = useState(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      ResizeImage,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder:
          "Write content here... (Emoji ✅ | Paste image Ctrl+V 📸 | Resize image ↔️)",
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange?.(html);
      if (mode === "visual") setHtmlDraft(html);
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[200px] p-3",
      },
    },
  });

  // ✅ Sync external value into editor / html draft
  useEffect(() => {
    setHtmlDraft(value || "");
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") === current) return;
    editor.commands.setContent(value || "");
  }, [value, editor]);

  function addLink() {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImageByUrl() {
    const url = window.prompt("Enter image URL:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  // ✅ Switch mode safely
  function switchToHTML() {
    // Take current editor HTML and show in textarea
    if (editor) {
      const html = editor.getHTML();
      setHtmlDraft(html);
    }
    setMode("html");
  }

  function switchToVisual() {
    // Push textarea HTML back into editor
    if (editor) {
      editor.commands.setContent(htmlDraft || "");
    }
    onChange?.(htmlDraft || "");
    setMode("visual");
  }

  if (!editor) {
    return (
      <div className="border rounded-md p-4 text-sm text-gray-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-gray-50">
        {/* ✅ Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            if (mode === "visual") switchToHTML();
            else switchToVisual();
          }}
          className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-50"
        >
          {mode === "visual" ? "<> HTML" : "📝 Visual"}
        </button>

        <span className="h-5 w-px bg-gray-300" />

        {/* Visual mode buttons */}
        {mode === "visual" && (
          <>
            <ToolbarButton
              title="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </ToolbarButton>

            <ToolbarButton
              title="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              I
            </ToolbarButton>

            <ToolbarButton
              title="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              U
            </ToolbarButton>

            <ToolbarButton
              title="Bullet List"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              • List
            </ToolbarButton>

            <ToolbarButton
              title="Number List"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1. List
            </ToolbarButton>

            <ToolbarButton
              title="Add Link"
              active={editor.isActive("link")}
              onClick={addLink}
            >
              🔗 Link
            </ToolbarButton>

            <ToolbarButton title="Add image URL" active={false} onClick={addImageByUrl}>
              🖼 URL
            </ToolbarButton>

            <ImageUploader
              folder="editor"
              onUpload={(url) => editor.chain().focus().setImage({ src: url }).run()}
            />

            <ToolbarButton title="Undo" active={false} onClick={() => editor.chain().focus().undo().run()}>
              ↩ Undo
            </ToolbarButton>

            <ToolbarButton title="Redo" active={false} onClick={() => editor.chain().focus().redo().run()}>
              ↪ Redo
            </ToolbarButton>
          </>
        )}

        {uploading && (
          <span className="text-xs text-gray-500 ml-auto">Uploading image...</span>
        )}

        {mode === "html" && (
          <span className="text-xs text-gray-500 ml-auto">
            HTML mode: write raw HTML here
          </span>
        )}
      </div>

      {/* CONTENT */}
      {mode === "visual" ? (
        <div className="min-h-[220px]">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div className="p-3">
          <textarea
            value={htmlDraft}
            onChange={(e) => {
              setHtmlDraft(e.target.value);
              onChange?.(e.target.value); // ✅ save HTML immediately
            }}
            className="border rounded w-full min-h-[260px] p-3 font-mono text-sm"
            placeholder="Write raw HTML here..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: Switch back to Visual to see rendered content.
          </p>
        </div>
      )}
    </div>
  );
}
