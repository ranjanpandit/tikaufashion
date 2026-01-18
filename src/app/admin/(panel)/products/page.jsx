"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    status: "",
    category: "",
  });

  async function loadProducts() {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`/api/admin/products?${query}`);
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, [filters]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  async function toggleStatus(id, status) {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: id,
        status: !status,
      }),
    });

    loadProducts();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      {/* FILTER BAR */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Search product..."
          className="border p-2"
          value={filters.q}
          onChange={(e) =>
            setFilters({ ...filters, q: e.target.value })
          }
        />

        <select
          className="border p-2"
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="border p-2"
          value={filters.category}
          onChange={(e) =>
            setFilters({ ...filters, category: e.target.value })
          }
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <Link
          href="/admin/products/new"
          className="ml-auto bg-black text-white px-4 py-2"
        >
          + Add Product
        </Link>
      </div>

      {/* TABLE */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Image</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Categories</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products?.map((p) => (
            <tr key={p._id}>
              <td className="border p-2">
                <img
                  src={p.images?.[0] || "/placeholder.png"}
                  className="h-10 w-10 object-cover"
                />
              </td>

              <td className="border p-2">{p.name}</td>

              <td className="border p-2">
                {p.categories?.map((c) => c.name).join(", ")}
              </td>

              <td className="border p-2">₹{p.price}</td>

              <td className="border p-2">
                {p.status ? "Active" : "Inactive"}
              </td>

              <td className="border p-2 space-x-2">
                <Link
                  href={`/admin/products/${p._id}`}
                  className="underline"
                >
                  Edit
                </Link>

                <button
                  onClick={() => toggleStatus(p._id, p.status)}
                  className="text-blue-600"
                >
                  {p.status ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
