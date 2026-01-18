"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminPageCreate() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft",
    content: "",
    seo: { metaTitle: "", metaDescription: "", ogImage: "" },
    showInHeader: false,
    showInFooter: true,
    sortOrder: 0,
  });

  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const computedSlug = useMemo(() => slugify(form.title), [form.title]);
  const slugValue = autoSlug ? computedSlug : form.slug;

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;

    setErr("");
    setMsg("");

    if (!form.title.trim()) {
      setErr("Title is required");
      return;
    }

    if (!slugValue.trim()) {
      setErr("Slug is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug: slugValue }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(json?.message || "Failed to create page");
        return;
      }

      setMsg("✅ Page created successfully");
      router.replace("/admin/pages");
    } catch (e) {
      setErr("Network error while creating page.");
    } finally {
      setSaving(false);
    }
  };

  const preview = () => {
    if (!slugValue) return;
    window.open(`/page/${slugValue}`, "_blank");
  };

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Static Page</h1>
          <p className="text-sm text-gray-500">
            Create About Us / Privacy Policy / Terms and more.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/pages")}
            className="border px-4 py-2 rounded bg-white hover:bg-gray-50 text-sm"
          >
            Back
          </button>

          <button
            type="button"
            onClick={preview}
            disabled={!slugValue}
            className="border px-4 py-2 rounded bg-white hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Preview
          </button>

          <button
            type="submit"
            form="page-create-form"
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Page"}
          </button>
        </div>
      </div>

      {(msg || err) && (
        <div
          className={`border rounded p-3 text-sm ${
            err
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {err || msg}
        </div>
      )}

      <form id="page-create-form" onSubmit={save} className="space-y-5">
        {/* TOP FORM */}
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="border p-2 rounded w-full mt-1"
                placeholder="About Us"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={slugValue}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className="border p-2 rounded w-full"
                  disabled={autoSlug}
                  placeholder="about-us"
                />
                <button
                  type="button"
                  className="border px-3 rounded text-sm"
                  onClick={() => setAutoSlug((v) => !v)}
                >
                  {autoSlug ? "Manual" : "Auto"}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                URL: <span className="font-mono">/page/{slugValue}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="border p-2 rounded w-full mt-1"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                checked={form.showInHeader}
                onChange={(e) => setForm((p) => ({ ...p, showInHeader: e.target.checked }))}
              />
              Show in Header
            </label>

            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                checked={form.showInFooter}
                onChange={(e) => setForm((p) => ({ ...p, showInFooter: e.target.checked }))}
              />
              Show in Footer
            </label>

            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                className="border p-2 rounded w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* CONTENT */}
          <div className="lg:col-span-2 space-y-2">
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-base font-semibold mb-2">Page Content</h2>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((p) => ({ ...p, content: html }))}
              />
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h2 className="text-base font-semibold">SEO Settings</h2>

              <div>
                <label className="text-sm font-medium">Meta Title</label>
                <input
                  value={form.seo.metaTitle}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      seo: { ...p.seo, metaTitle: e.target.value },
                    }))
                  }
                  className="border p-2 rounded w-full mt-1"
                  placeholder="About TikauFashion"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <textarea
                  value={form.seo.metaDescription}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      seo: { ...p.seo, metaDescription: e.target.value },
                    }))
                  }
                  className="border p-2 rounded w-full mt-1 min-h-[110px]"
                  placeholder="Short SEO description..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">OG Image</label>
                <div className="mt-1">
                  <ImageUploader
                    folder="pages-og"
                    onUpload={(url) =>
                      setForm((p) => ({
                        ...p,
                        seo: { ...p.seo, ogImage: url },
                      }))
                    }
                  />
                </div>

                {form.seo.ogImage && (
                  <img
                    src={form.seo.ogImage}
                    alt="og"
                    className="h-24 w-full object-cover rounded border mt-2"
                  />
                )}
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-600">
              ✅ Tip: Keep meta description under ~160 characters for better SEO.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
