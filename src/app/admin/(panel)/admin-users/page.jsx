"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ROLE_OPTIONS = [
  { label: "Super Admin", value: "super_admin" },
  { label: "Manager", value: "manager" },
  { label: "Support", value: "support" },
];

const DEFAULT_PERMISSIONS = {
  orders: true,
  products: true,
  store: true,
  coupons: true,
  pages: true,
  adminUsers: false,
};

function Badge({ children, tone = "gray" }) {
  const map = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span className={`px-2 py-1 rounded border text-xs ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleString("en-IN");
  } catch {
    return "-";
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ✅ Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    permissions: DEFAULT_PERMISSIONS,
    isActive: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/admin-users", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to load admin users");
        setUsers([]);
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Network error while loading admin users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    let list = users;

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }

    return list;
  }, [users, q, roleFilter]);

  const createAdmin = async (e) => {
    e.preventDefault();
    if (creating) return;

    setError("");
    setMessage("");

    if (!form.name.trim()) return setError("Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (!form.password.trim()) return setError("Password is required");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to create admin");
        return;
      }

      setMessage("✅ Admin created successfully");
      setCreateOpen(false);

      setForm({
        name: "",
        email: "",
        password: "",
        role: "manager",
        permissions: DEFAULT_PERMISSIONS,
        isActive: true,
      });

      await loadUsers();
    } catch (e) {
      setError("Network error while creating admin.");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (user) => {
    const ok = confirm(
      `Are you sure you want to ${user.isActive ? "disable" : "enable"} this admin?`
    );
    if (!ok) return;

    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/admin-users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to update admin");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );

      setMessage("✅ Status updated");
    } catch (e) {
      setError("Network error while updating admin.");
    }
  };

  const deleteAdmin = async (id) => {
    const ok = confirm("Delete this admin permanently?");
    if (!ok) return;

    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Failed to delete admin");
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== id));
      setMessage("✅ Admin deleted");
    } catch (e) {
      setError("Network error while deleting admin.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-sm text-gray-500">
            Create and manage admin accounts with role-based permissions.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadUsers}
            className="border px-4 py-2 rounded bg-white hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            + Add Admin
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`border rounded p-3 text-sm ${
            error
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
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
          placeholder="Search name / email..."
          className="border p-2 rounded w-full md:w-[360px]"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border p-2 rounded w-full md:w-[220px]"
        >
          <option value="all">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="manager">Manager</option>
          <option value="support">Support</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <p className="text-sm font-semibold">Total: {filtered.length}</p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading admin users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No admin users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium p-3">Name</th>
                  <th className="text-left font-medium p-3">Email</th>
                  <th className="text-left font-medium p-3">Role</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Last Login</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                      <Badge tone={u.role === "super_admin" ? "blue" : "gray"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {u.isActive ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="red">Disabled</Badge>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "-"}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Link
                        href={`/admin/admin-users/${u._id}`}
                        className="border px-3 py-1 rounded text-xs bg-white hover:bg-gray-50"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => toggleActive(u)}
                        className="border px-3 py-1 rounded text-xs bg-white hover:bg-gray-50"
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => deleteAdmin(u._id)}
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

      {/* ✅ Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <p className="text-base font-semibold">Create Admin User</p>
                <p className="text-xs text-gray-500">
                  Add a new admin with permissions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-sm border px-3 py-1 rounded bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={createAdmin} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="border p-2 rounded w-full mt-1"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Admin Name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="border p-2 rounded w-full mt-1"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="admin@email.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="border p-2 rounded w-full mt-1"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="********"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    className="border p-2 rounded w-full mt-1"
                    value={form.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      setForm((p) => ({
                        ...p,
                        role,
                        permissions:
                          role === "super_admin"
                            ? {
                                orders: true,
                                products: true,
                                store: true,
                                coupons: true,
                                pages: true,
                                adminUsers: true,
                              }
                            : p.permissions,
                      }));
                    }}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-sm font-semibold mb-2">Permissions</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.keys(DEFAULT_PERMISSIONS).map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!form.permissions?.[key]}
                        disabled={form.role === "super_admin"}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            permissions: {
                              ...(p.permissions || {}),
                              [key]: e.target.checked,
                            },
                          }))
                        }
                      />
                      {key}
                    </label>
                  ))}
                </div>

                {form.role === "super_admin" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Super Admin automatically has all permissions.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                Active Account
              </label>

              <button
                type="submit"
                disabled={creating}
                className="bg-black text-white w-full py-2 rounded text-sm disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
