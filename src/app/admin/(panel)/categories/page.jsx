"use client";

import { useEffect, useState } from "react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function loadCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
  }

  async function addCategory(e) {
    e.preventDefault();

    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });

    setName("");
    setSlug("");
    loadCategories();
  }

  async function toggleStatus(id, status) {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: !status }),
    });

    loadCategories();
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* ADD CATEGORY */}
      <form onSubmit={addCategory} className="flex gap-2 mb-6">
        <input
          placeholder="Category name"
          className="border p-2 flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Slug"
          className="border p-2 flex-1"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <button className="bg-black text-white px-4">
          Add
        </button>
      </form>

      {/* CATEGORY LIST */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Slug</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((c) => (
            <tr key={c._id}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.slug}</td>
              <td className="border p-2">
                {c.status ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </td>
              <td className="border p-2">
                <button
                  onClick={() => toggleStatus(c._id, c.status)}
                  className="text-blue-600"
                >
                  {c.status ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
