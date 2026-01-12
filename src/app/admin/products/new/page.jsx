"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";

export default function AddProduct() {
  const router = useRouter();

  /* =========================
     STATE
  ========================== */
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    mrp: "",
    price: "",
    stock: "",
    images: [""],

    categories: [],
    filters: {},

    options: [{ name: "", values: [""] }],
    status: true,
  });

  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState([]);

  /* =========================
     LOAD CATEGORIES & FILTERS
  ========================== */
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setCategories);

    fetch("/api/admin/filters")
      .then((r) => r.json())
      .then(setFilters);
  }, []);

  /* =========================
     TipTap Editor
  ========================== */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      Image.configure({ allowBase64: true }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      setForm((prev) => ({
        ...prev,
        description: editor.getHTML(),
      }));
    },
  });

  /* =========================
     HELPERS
  ========================== */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        mrp: Number(form.mrp),
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
      }),
    });

    if (!res.ok) {
      alert("Failed to create product");
      return;
    }

    router.push("/admin/products");
  }

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 border">

        {/* NAME */}
        <div>
          <label className="text-sm">Product Name</label>
          <input
            value={form.name}
            onChange={(e) => {
              setForm({
                ...form,
                name: e.target.value,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-"),
              });
            }}
            className="w-full border p-2"
            required
          />
        </div>

        {/* SLUG */}
        <div>
          <label className="text-sm">Slug</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            className="w-full border p-2 bg-gray-50"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm">Description</label>
          <div className="border rounded">
            <EditorContent editor={editor} className="p-3 min-h-[180px]" />
          </div>
        </div>

        {/* PRICING */}
        <div className="grid grid-cols-3 gap-4">
          <input
            type="number"
            name="mrp"
            placeholder="MRP"
            value={form.mrp}
            onChange={handleChange}
            className="border p-2"
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Selling Price"
            value={form.price}
            onChange={handleChange}
            className="border p-2"
            required
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="border p-2"
            required
          />
        </div>

        {/* IMAGES */}
        <div>
          <label className="text-sm">Images</label>
          {form.images.map((img, i) => (
            <input
              key={i}
              value={img}
              onChange={(e) => {
                const images = [...form.images];
                images[i] = e.target.value;
                setForm({ ...form, images });
              }}
              className="border p-2 w-full mb-2"
            />
          ))}
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, images: [...form.images, ""] })
            }
            className="text-blue-600 text-sm"
          >
            + Add Image
          </button>
        </div>

        {/* CATEGORIES */}
        <div>
          <h3 className="font-semibold">Categories</h3>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((c) => (
              <label key={c._id} className="text-sm flex gap-2">
                <input
                  type="checkbox"
                  checked={form.categories.includes(c._id)}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      categories: prev.categories.includes(c._id)
                        ? prev.categories.filter((id) => id !== c._id)
                        : [...prev.categories, c._id],
                    }))
                  }
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {filters.map((f) => (
  <div key={f._id} className="mb-3">
    <p className="text-sm font-medium">{f.name}</p>

    <div className="flex gap-3 flex-wrap">
      {f.values.map((v, idx) => {
        const value =
          typeof v === "string" ? v : v.value || v.label;

        const active =
          form.filters[f.slug]?.includes(value) || false;

        return (
          <label
            key={`${f.slug}-${value}-${idx}`}
            className="text-sm flex gap-1"
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() =>
                setForm((prev) => {
                  const current =
                    prev.filters[f.slug] || [];

                  return {
                    ...prev,
                    filters: {
                      ...prev.filters,
                      [f.slug]: active
                        ? current.filter((x) => x !== value)
                        : [...current, value],
                    },
                  };
                })
              }
            />
            {value}
          </label>
        );
      })}
    </div>
  </div>
))}


        {/* OPTIONS */}
        <div>
          <h3 className="font-semibold">Product Options</h3>
          {form.options.map((opt, i) => (
            <div key={i} className="border p-3 mb-3">
              <input
                placeholder="Option Name"
                value={opt.name}
                onChange={(e) => {
                  const options = [...form.options];
                  options[i].name = e.target.value;
                  setForm({ ...form, options });
                }}
                className="border p-2 w-full mb-2"
              />

              {opt.values.map((v, vi) => (
                <input
                  key={vi}
                  value={v}
                  placeholder="Value"
                  onChange={(e) => {
                    const options = [...form.options];
                    options[i].values[vi] = e.target.value;
                    setForm({ ...form, options });
                  }}
                  className="border p-2 w-full mb-1"
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
                + Add Value
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
            + Add Option
          </button>
        </div>

        {/* STATUS */}
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={form.status}
            onChange={() =>
              setForm({ ...form, status: !form.status })
            }
          />
          Active
        </label>

        <button className="bg-black text-white px-6 py-2">
          Save Product
        </button>
      </form>
    </div>
  );
}
