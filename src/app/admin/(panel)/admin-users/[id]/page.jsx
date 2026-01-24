"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const DEFAULT_PERMISSIONS = {
  orders: true,
  products: true,
  store: true,
  coupons: true,
  pages: true,
  adminUsers: false,
};

export default function AdminUserEditPage() {
  const router = useRouter();
  const { id } = useParams();

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
      const res = await fetch("/api/admin/admin-users", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setErr(data?.message || "Failed to load admin users");
        setForm(null);
        return;
      }

      const user = (data || []).find((x) => x._id === id);

      if (!user) {
        setErr("Admin user not found");
        setForm(null);
        return;
      }

      setForm({
        ...user,
        permissions: { ...DEFAULT_PERMISSIONS, ...(user.permissions || {}) },
        password: "",
      });
    } catch (e) {
      setErr("Network error while loading admin.");
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

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      isActive: form.isActive,
      permissions: form.permissions,
    };

    // ✅ if password entered -> reset
    if (form.password?.trim()) {
      payload.password = form.password.trim();
    }

    try {
      const res = await fetch(`/api/admin/admin-users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.message || "Failed to update admin");
        return;
      }

      setMsg("✅ Admin updated successfully");
    } catch (e) {
      setErr("Network error while saving admin.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading admin...</div>;
  if (!form) return <div className="p-6 text-red-600">{err || "Not found"}</div>;

  const isSuper = form.role === "super_admin";

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Admin User</h1>
          <p className="text-sm text-gray-500">{form.email}</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/admin-users")}
          className="border px-4 py-2 rounded bg-white hover:bg-gray-50 text-sm"
        >
          Back
        </button>
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

      <form onSubmit={save} className="space-y-5">
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="border p-2 rounded w-full mt-1"
                value={form.name || ""}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                className="border p-2 rounded w-full mt-1"
                value={form.email || ""}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="border p-2 rounded w-full mt-1"
                value={form.role || "manager"}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="super_admin">Super Admin</option>
                <option value="manager">Manager</option>
                <option value="support">Support</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {isSuper ? "Super Admin has all permissions." : "Permissions can be configured below."}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-7">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <span className="text-sm">Active Account</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-4">
          <h2 className="text-base font-semibold">Permissions</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.keys(DEFAULT_PERMISSIONS).map((key) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.permissions?.[key]}
                  disabled={isSuper}
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
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-base font-semibold">Reset Password</h2>
          <p className="text-sm text-gray-500">
            Leave blank if you don’t want to change password.
          </p>

          <input
            type="password"
            className="border p-2 rounded w-full"
            value={form.password || ""}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="New password"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
