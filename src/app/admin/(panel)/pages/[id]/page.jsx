"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";

export default function AdminPageEdit() {
  const router = useRouter();
  const { id } = useParams(); // ✅ FIXED

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    if (!id) return;

    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const res = await fetch(`/api/admin/pages/${id}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        setErr(json?.message || "Failed to load page");
        setForm(null);
        return;
      }

      setForm({
        ...json,
        seo: json.seo || { metaTitle: "", metaDescription: "", ogImage: "" },
      });
    } catch (e) {
      setErr("Network error while loading page.");
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    if (!id || saving) return;

    setSaving(true);
    setErr("");
    setMsg("");

    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(json?.message || "Failed to save page");
        return;
      }

      setMsg("✅ Page updated successfully");
    } catch (e) {
      setErr("Network error while saving page.");
    } finally {
      setSaving(false);
    }
  };

  const preview = () => {
    if (!form?.slug) return;
    window.open(`/page/${form.slug}`, "_blank");
  };

  if (loading) return <div className="p-6">Loading page...</div>;
  if (!form) return <div className="p-6 text-red-600">{err || "Not found"}</div>;

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Page</h1>
          <p className="text-sm text-gray-500">
            URL: <span className="font-mono">/page/{form.slug}</span>
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
            className="border px-4 py-2 rounded bg-white hover:bg-gray-50 text-sm"
          >
            Preview
          </button>

          <button
            type="submit"
            form="page-edit-form"
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
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

      <form id="page-edit-form" onSubmit={save} className="space-y-5">
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                value={form.title || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="border p-2 rounded w-full mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <input
                value={form.slug || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                className="border p-2 rounded w-full mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.status || "draft"}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
                className="border p-2 rounded w-full mt-1"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                checked={!!form.showInHeader}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    showInHeader: e.target.checked,
                  }))
                }
              />
              Show in Header
            </label>

            <label className="flex items-center gap-2 text-sm mt-6">
              <input
                type="checkbox"
                checked={!!form.showInFooter}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    showInFooter: e.target.checked,
                  }))
                }
              />
              Show in Footer
            </label>

            <div>
              <label className="text-sm font-medium">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder || 0}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sortOrder: Number(e.target.value),
                  }))
                }
                className="border p-2 rounded w-full mt-1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-4">
              <h2 className="text-base font-semibold mb-2">Page Content</h2>
              <RichTextEditor
                value={form.content || ""}
                onChange={(html) =>
                  setForm((p) => ({ ...p, content: html }))
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h2 className="text-base font-semibold">SEO Settings</h2>

              <div>
                <label className="text-sm font-medium">Meta Title</label>
                <input
                  value={form.seo?.metaTitle || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      seo: { ...(p.seo || {}), metaTitle: e.target.value },
                    }))
                  }
                  className="border p-2 rounded w-full mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <textarea
                  value={form.seo?.metaDescription || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      seo: {
                        ...(p.seo || {}),
                        metaDescription: e.target.value,
                      },
                    }))
                  }
                  className="border p-2 rounded w-full mt-1 min-h-[110px]"
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
                        seo: { ...(p.seo || {}), ogImage: url },
                      }))
                    }
                  />
                </div>

                {form.seo?.ogImage && (
                  <img
                    src={form.seo.ogImage}
                    alt="og"
                    className="h-24 w-full object-cover rounded border mt-2"
                  />
                )}
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-600">
              ✅ Tip: Keep SEO clean and consistent for better ranking.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
