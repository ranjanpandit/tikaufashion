"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageUploader from "@/components/admin/ImageUploader";

/* =========================
   VARIANT GENERATOR
========================= */
function generateVariants(options) {
  if (!options.length) return [];

  const combine = (opts, index = 0, current = {}) => {
    if (index === opts.length) return [current];

    return opts[index].values.flatMap((v) =>
      combine(opts, index + 1, {
        ...current,
        [opts[index].name]: v,
      })
    );
  };

  return combine(options).map((combo) => ({
    options: combo,
    mrp: "",
    price: "",
    stock: "",
    sku: "",
    image: "",
  }));
}

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [filterDefs, setFilterDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    mrp: "",
    price: "",
    stock: "",
    images: [],
    categories: [],
    options: [],
    variants: [],
    filters: {},
    status: true,
  });

  /* =========================
     EDITOR
  ========================== */
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    onUpdate({ editor }) {
      setForm((p) => ({ ...p, description: editor.getHTML() }));
    },
  });

  /* =========================
     LOAD META
  ========================== */
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories);

    fetch("/api/admin/filters")
      .then((r) => r.json())
      .then(setFilterDefs);
  }, []);

  /* =========================
     LOAD PRODUCT
  ========================== */
  useEffect(() => {
    if (!editor) return;

    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          sku: data?.sku || "",
          description: data.description || "",
          mrp: data.mrp || "",
          price: data.price || "",
          stock: data.stock || "",
          images: data.images || [],
          categories: (data.categories || []).map((c) => c._id),
          options: (data.options || []).map((o) => ({
            name: o.name || "",
            values: (o.values || []).map((v) =>
              typeof v === "object" ? v.code ?? "" : v
            ),
          })),
          variants: data.variants || [],
          filters: data.filters || {},
          status: Boolean(data.status),
        });

        editor.commands.setContent(data.description || "");
        setLoading(false);
      });
  }, [id, editor]);

  /* =========================
     SAVE
  ========================== */
  async function saveProduct(e) {
    e.preventDefault();
    setMsg("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mrp: Number(form.mrp),
          price: Number(form.price),
          stock: Number(form.stock),
          images: (form.images || []).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.message || "Failed to update product");
        setSaving(false);
        return;
      }

      setMsg("Product updated ✅");
      setTimeout(() => setMsg(""), 2000);

      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      setMsg("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading product…</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>

        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-sm border px-4 py-2 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>

      <form
        onSubmit={saveProduct}
        className="space-y-6 bg-white p-5 md:p-6 border rounded-xl"
      >
        {/* MESSAGE */}
        {msg && (
          <div className="border rounded-md px-4 py-3 text-sm bg-gray-50">
            {msg}
          </div>
        )}

        {/* NAME */}
        <div>
          <p className="text-sm font-medium mb-1">Product name</p>
          <input
            className="border p-2 w-full rounded-md"
            placeholder="Product name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </div>

        {/* SLUG */}
        <div>
          <p className="text-sm font-medium mb-1">SKU</p>
          <input
            className="border p-2 w-full rounded-md"
            placeholder="sku"
            value={form.sku}
            onChange={(e) =>
              setForm({ ...form, sku: e.target.value })
            }
          />
        </div>
        {/* SLUG */}
        <div>
          <p className="text-sm font-medium mb-1">Slug</p>
          <input
            className="border p-2 w-full rounded-md"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) =>
              setForm({ ...form, slug: e.target.value })
            }
          />
        </div>

        {/* PRICING */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="MRP"
            className="border p-2 rounded-md"
            value={form.mrp}
            onChange={(e) =>
              setForm({ ...form, mrp: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Price"
            className="border p-2 rounded-md"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Stock"
            className="border p-2 rounded-md"
            value={form.stock}
            onChange={(e) =>
              setForm({ ...form, stock: e.target.value })
            }
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <p className="font-medium mb-1">Description</p>
          <div className="border rounded-md p-3 min-h-[120px]">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* ✅ IMAGES UPLOAD + GRID */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <p className="text-sm font-semibold">Images</p>

            <ImageUploader
              folder="products"
              onUpload={(url) => {
                setForm((p) => ({
                  ...p,
                  images: [...(p.images || []), url],
                }));
              }}
            />
          </div>

          {form.images.length === 0 ? (
            <p className="text-sm text-gray-500">
              No images uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {form.images.map((img, i) => (
                <div
                  key={`${img}-${i}`}
                  className="border rounded-lg overflow-hidden bg-white"
                >
                  <div className="aspect-square bg-gray-50">
                    <img
                      src={img}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-2 flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      {i === 0 ? "Main" : `#${i + 1}`}
                    </p>

                    <button
                      type="button"
                      className="text-red-600 text-xs font-medium"
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          images: p.images.filter((x) => x !== img),
                        }));
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  {i !== 0 && (
                    <button
                      type="button"
                      className="w-full text-xs py-2 border-t hover:bg-gray-50"
                      onClick={() => {
                        setForm((p) => {
                          const imgs = [...p.images];
                          const picked = imgs[i];
                          imgs.splice(i, 1);
                          imgs.unshift(picked); // ✅ make main
                          return { ...p, images: imgs };
                        });
                      }}
                    >
                      Set as Main
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CATEGORIES */}
        <div>
          <h3 className="font-semibold mb-2">Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((cat) => (
              <label
                key={cat._id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.categories.includes(cat._id)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...form.categories, cat._id]
                      : form.categories.filter((cid) => cid !== cat._id);
                    setForm({ ...form, categories: updated });
                  }}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        {/* OPTIONS */}
        <div>
          <h3 className="font-semibold mb-2">Options</h3>

          {form.options.map((opt, i) => (
            <div key={i} className="border rounded-lg p-3 mb-3">
              <input
                className="border p-2 w-full mb-2 rounded-md"
                placeholder="Option name (Size, Color)"
                value={opt.name}
                onChange={(e) => {
                  const options = [...form.options];
                  options[i].name = e.target.value;
                  setForm({ ...form, options });
                }}
              />

              <div className="space-y-2">
                {opt.values.map((v, vi) => (
                  <input
                    key={vi}
                    className="border p-2 w-full rounded-md"
                    value={v}
                    placeholder="Option value"
                    onChange={(e) => {
                      const options = [...form.options];
                      options[i].values[vi] = e.target.value;
                      setForm({ ...form, options });
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const options = [...form.options];
                  options[i].values.push("");
                  setForm({ ...form, options });
                }}
                className="text-blue-600 text-sm mt-2"
              >
                + Add value
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                options: [...form.options, { name: "", values: [""] }],
              })
            }
            className="text-blue-600 text-sm"
          >
            + Add option
          </button>
        </div>

        {/* VARIANTS */}
<div>
  <div className="flex flex-col md:flex-row md:items-center gap-2">
    <button
      type="button"
      className="border px-4 py-2 rounded-md bg-gray-50 hover:bg-gray-100 text-sm"
      onClick={() =>
        setForm({ ...form, variants: generateVariants(form.options) })
      }
    >
      Generate Variants
    </button>

    <p className="text-xs text-gray-500">
      Create SKU-wise price/stock for all option combinations
    </p>
  </div>

  {form.variants.length > 0 && (
    <div className="mt-4 space-y-3">
      {form.variants.map((v, i) => (
        <div
          key={i}
          className="border rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          {/* OPTIONS */}
          <div className="md:col-span-3 text-sm bg-gray-50 rounded-md p-2">
            {Object.entries(v.options || {}).map(([k, val]) => (
              <div key={k}>
                <b>{k}</b>: {val}
              </div>
            ))}
          </div>

          {/* PRICING */}
          <div className="md:col-span-2">
            <input
              className="border p-2 rounded-md w-full"
              placeholder="MRP"
              value={v.mrp}
              onChange={(e) => {
                const variants = [...form.variants];
                variants[i].mrp = e.target.value;
                setForm({ ...form, variants });
              }}
            />
          </div>

          <div className="md:col-span-2">
            <input
              className="border p-2 rounded-md w-full"
              placeholder="Price"
              value={v.price}
              onChange={(e) => {
                const variants = [...form.variants];
                variants[i].price = e.target.value;
                setForm({ ...form, variants });
              }}
            />
          </div>

          <div className="md:col-span-2">
            <input
              className="border p-2 rounded-md w-full"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => {
                const variants = [...form.variants];
                variants[i].stock = e.target.value;
                setForm({ ...form, variants });
              }}
            />
          </div>

          <div className="md:col-span-3">
            <input
              className="border p-2 rounded-md w-full"
              placeholder="SKU"
              value={v.sku}
              onChange={(e) => {
                const variants = [...form.variants];
                variants[i].sku = e.target.value;
                setForm({ ...form, variants });
              }}
            />
          </div>

          {/* ✅ VARIANT IMAGE */}
          <div className="md:col-span-12 flex flex-col md:flex-row md:items-center gap-3 border-t pt-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                {v.image ? (
                  <img
                    src={v.image}
                    alt="Variant"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <ImageUploader
                  folder="products/variants"
                  onUpload={(url) => {
                    const variants = [...form.variants];
                    variants[i].image = url;
                    setForm({ ...form, variants });
                  }}
                />

                {v.image && (
                  <button
                    type="button"
                    className="text-xs text-red-600 text-left"
                    onClick={() => {
                      const variants = [...form.variants];
                      variants[i].image = "";
                      setForm({ ...form, variants });
                    }}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>

            {/* ✅ OPTIONAL NOTE */}
            <p className="text-xs text-gray-500 md:ml-auto">
              Variant image will override main product image on store (if you enable it)
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>


        {/* FILTERS */}
        <div>
          <h3 className="font-semibold mb-2">Filters</h3>

          {filterDefs.map((f) => (
            <div key={f._id} className="border rounded-lg p-3 mb-3">
              <p className="text-sm font-medium mb-2">{f.name}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {f.values.map((v) => (
                  <label key={v.value} className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        form.filters?.[f.slug]?.includes(v.value) || false
                      }
                      onChange={(e) => {
                        const current = form.filters?.[f.slug] || [];
                        const updated = e.target.checked
                          ? [...current, v.value]
                          : current.filter((x) => x !== v.value);

                        setForm({
                          ...form,
                          filters: { ...form.filters, [f.slug]: updated },
                        });
                      }}
                    />
                    {v.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* STATUS */}
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.checked })
            }
          />
          Active
        </label>

        <button
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-md disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
