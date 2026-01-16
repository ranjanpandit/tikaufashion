"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import ImageUploader from "@/components/admin/ImageUploader";

// ✅ correct resize extension
import ResizeImage from "tiptap-extension-resize-image";

function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-3 py-1 text-sm border rounded-md transition ${
        active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * ✅ Upload helper used for paste image
 */
async function uploadFileToCloudinary(file, folder = "tikaufashion/editor") {
  const signRes = await fetch(
    `/api/admin/cloudinary-sign?folder=${encodeURIComponent(folder)}`
  );
  const signData = await signRes.json();

  if (!signRes.ok) {
    alert(signData?.message || "Not authorized");
    return;
  }

  // Upload to Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", signData.timestamp);
  formData.append("signature", signData.signature);
  formData.append("folder", signData.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await uploadRes.json();

  return data.secure_url;
}

export default function RichTextEditor({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),

      // ✅ image + resize
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      ResizeImage,

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Placeholder.configure({
        placeholder:
          "Write product description here... (Emoji ✅ | Paste image Ctrl+V 📸 | Resize image ↔️)",
      }),
    ],

    content: value || "",
    immediatelyRender: false,

    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[200px] p-3",
      },

      // ✅ Paste image support
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items?.length) return false;

        const imageItem = Array.from(items).find(
          (i) => i.kind === "file" && i.type.startsWith("image/")
        );

        if (!imageItem) return false;

        event.preventDefault();

        const file = imageItem.getAsFile();
        if (!file) return true;

        (async () => {
          try {
            setUploading(true);
            const url = await uploadFileToCloudinary(
              file,
              "tikaufashion/editor"
            );
            editor.chain().focus().setImage({ src: url }).run();
          } catch (err) {
            console.error(err);
            alert("Paste image upload failed");
          } finally {
            setUploading(false);
          }
        })();

        return true;
      },
    },
  });

  // ✅ Sync external value into editor
  useEffect(() => {
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

        <ToolbarButton
          title="Add image URL"
          active={false}
          onClick={addImageByUrl}
        >
          🖼 URL
        </ToolbarButton>

        {/* ✅ Upload using your existing ImageUploader */}
        <ImageUploader
          folder="editor"
          onUpload={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
          }}
        />

        <ToolbarButton
          title="Undo"
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↩ Undo
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↪ Redo
        </ToolbarButton>

        {uploading && (
          <span className="text-xs text-gray-500 ml-auto">
            Uploading image...
          </span>
        )}
      </div>

      {/* EDITOR */}
      <div className="min-h-[220px]">
        <EditorContent editor={editor} />
      </div>

      <div className="px-3 py-2 border-t text-xs text-gray-500">
        ✅ Emoji supported | 📌 Paste image Ctrl+V | ↔️ Resize image by dragging
        corners
      </div>
    </div>
  );
}
