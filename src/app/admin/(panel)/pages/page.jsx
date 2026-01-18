"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function formatDate(date) {
  try {
    return new Date(date).toLocaleString("en-IN");
  } catch {
    return "-";
  }
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();

  let cls = "bg-gray-100 text-gray-700 border-gray-200";
  if (s === "published") cls = "bg-green-50 text-green-700 border-green-200";
  if (s === "draft") cls = "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <span className={`px-2 py-1 rounded border text-xs ${cls}`}>
      {status || "-"}
    </span>
  );
}

export default function AdminPagesList() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPages = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/pages", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.message || "Failed to load pages");
        setPages([]);
        return;
      }

      setPages(Array.isArray(json) ? json : []);
    } catch (e) {
      setError("Network error while fetching pages.");
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const filtered = useMemo(() => {
    let list = pages;

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(query) ||
          (p.slug || "").toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }

    return list;
  }, [pages, q, statusFilter]);

  const handleDelete = async (id) => {
    const ok = confirm("Are you sure you want to delete this page?");
    if (!ok) return;

    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.message || "Failed to delete page");
        return;
      }

      setMessage("✅ Page deleted successfully");
      setPages((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      setError("Network error while deleting page.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Static Pages</h1>
          <p className="text-sm text-gray-500">
            Manage About, Privacy Policy, Terms, etc.
          </p>
        </div>

        <Link
          href="/admin/pages/new"
          className="bg-black text-white px-4 py-2 rounded text-sm inline-flex justify-center"
        >
          + Create Page
        </Link>
      </div>

      {(message || error) && (
        <div
          className={`border rounded p-3 text-sm ${
            error ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {error || message}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or slug..."
          className="border p-2 rounded w-full md:w-[360px]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded w-full md:w-[220px]"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

        <button
          type="button"
          onClick={loadPages}
          className="border px-4 py-2 rounded bg-white hover:bg-gray-50 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <p className="text-sm font-semibold">
            Total: {filtered.length}
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading pages...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No pages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium p-3">Title</th>
                  <th className="text-left font-medium p-3">Slug</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Updated</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.title}</td>
                    <td className="p-3 text-gray-600">/{p.slug}</td>
                    <td className="p-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="p-3 text-gray-600">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Link
                        href={`/admin/pages/${p._id}`}
                        className="border px-3 py-1 rounded text-xs bg-white hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="border px-3 py-1 rounded text-xs bg-white hover:bg-gray-50 text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
