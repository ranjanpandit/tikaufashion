"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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

  const [form, setForm] = useState({
    name: "",
    slug: "",
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

    await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        mrp: Number(form.mrp),
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
      }),
    });

    router.push("/admin/products");
  }

  if (loading) return <div className="p-6">Loading product…</div>;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <form onSubmit={saveProduct} className="space-y-6 bg-white p-6 border">
        {/* NAME */}
        <input
          className="border p-2 w-full"
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* SLUG */}
        <input
          className="border p-2 w-full"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />

        {/* PRICING */}
        <div className="grid grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="MRP"
            className="border p-2"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            className="border p-2"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Stock"
            className="border p-2"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <p className="font-medium mb-1">Description</p>
          <div className="border p-2">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* IMAGES */}
        <div>
          <p className="font-medium mb-1">Images</p>
          {form.images.map((img, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                className="border p-2 w-full"
                value={img}
                onChange={(e) => {
                  const images = [...form.images];
                  images[i] = e.target.value;
                  setForm({ ...form, images });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    images: form.images.filter((_, idx) => idx !== i),
                  })
                }
                className="text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, images: [...form.images, ""] })}
            className="text-blue-600 text-sm"
          >
            + Add image
          </button>
        </div>

        {/* CATEGORIES */}
        <div>
          <h3 className="font-semibold mb-2">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <label key={cat._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.categories.includes(cat._id)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...form.categories, cat._id]
                      : form.categories.filter((id) => id !== cat._id);
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
            <div key={i} className="border p-3 mb-3">
              <input
                className="border p-2 w-full mb-2"
                placeholder="Option name (Size, Color)"
                value={opt.name}
                onChange={(e) => {
                  const options = [...form.options];
                  options[i].name = e.target.value;
                  setForm({ ...form, options });
                }}
              />

              {opt.values.map((v, vi) => (
                <input
                  key={vi}
                  className="border p-2 w-full mb-1"
                  value={v}
                  onChange={(e) => {
                    const options = [...form.options];
                    options[i].values[vi] = e.target.value;
                    setForm({ ...form, options });
                  }}
                />
              ))}

              <button
                type="button"
                onClick={() => {
                  const options = [...form.options];
                  options[i].values.push("");
                  setForm({ ...form, options });
                }}
                className="text-blue-600 text-sm"
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
          <button
            type="button"
            className="border px-4 py-2 bg-gray-100"
            onClick={() =>
              setForm({ ...form, variants: generateVariants(form.options) })
            }
          >
            Generate Variants
          </button>

          {form.variants.length > 0 && (
            <div className="mt-4 space-y-3">
              {form.variants.map((v, i) => (
                <div key={i} className="border p-3 grid grid-cols-6 gap-2">
                  <div className="col-span-2 text-sm">
                    {Object.entries(v.options).map(([k, val]) => (
                      <div key={k}>
                        <b>{k}</b>: {val}
                      </div>
                    ))}
                  </div>
                  <input
                    placeholder="MRP"
                    value={v.mrp}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].mrp = e.target.value;
                      setForm({ ...form, variants });
                    }}
                  />
                  <input
                    placeholder="Price"
                    value={v.price}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].price = e.target.value;
                      setForm({ ...form, variants });
                    }}
                  />
                  <input
                    placeholder="Stock"
                    value={v.stock}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].stock = e.target.value;
                      setForm({ ...form, variants });
                    }}
                  />
                  <input
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i].sku = e.target.value;
                      setForm({ ...form, variants });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div>
          <h3 className="font-semibold mb-2">Filters</h3>
          {filterDefs.map((f) => (
            <div key={f._id}>
              <p className="text-sm font-medium">{f.name}</p>
              {f.values.map((v) => (
                <label key={v.value} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.filters?.[f.slug]?.includes(v.value) || false}
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
          ))}
        </div>

        {/* STATUS */}
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.checked })}
          />
          Active
        </label>

        <button className="bg-black text-white px-6 py-2">Save Product</button>
      </form>
    </div>
  );
}
