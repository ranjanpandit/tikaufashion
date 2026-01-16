"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function CustomerProfilePage() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    landmark: "",
    type: "home",
    isDefault: false,
  });

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await fetch("/api/customer/profile");

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to load profile");
        return;
      }

      setCustomer(data.customer);
    } catch (err) {
      console.log(err);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const defaultAddress = useMemo(() => {
    return (customer?.addresses || []).find((a) => a.isDefault) || null;
  }, [customer]);

  function resetForm() {
    setEditingId(null);
    setForm({
      fullName: "",
      phone: "",
      pincode: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      landmark: "",
      type: "home",
      isDefault: false,
    });
  }

  function startEdit(address) {
    setEditingId(address._id);
    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      pincode: address.pincode || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      state: address.state || "",
      landmark: address.landmark || "",
      type: address.type || "home",
      isDefault: !!address.isDefault,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // small validations
    if (!form.fullName || !form.phone || !form.pincode || !form.address1 || !form.city || !form.state) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `/api/customer/addresses/${editingId}`
        : `/api/customer/addresses`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Failed to save address");
        return;
      }

      await loadProfile();
      resetForm();

      alert(editingId ? "Address updated ✅" : "Address added ✅");
    } catch (err) {
      console.log(err);
      alert("Something went wrong!");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this address?")) return;

    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to delete");
        return;
      }

      await loadProfile();
    } catch (err) {
      console.log(err);
      alert("Something went wrong!");
    }
  }

  async function setDefault(id) {
    try {
      const res = await fetch(`/api/customer/addresses/${id}/default`, {
        method: "PATCH",
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to set default");
        return;
      }

      await loadProfile();
    } catch (err) {
      console.log(err);
      alert("Something went wrong!");
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-44 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-52 bg-gray-200 rounded-xl" />
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="text-xl font-semibold">My Profile</h2>
          <p className="text-gray-600 mt-1">Please login to view your account.</p>
          <Link
            href="/login"
            className="inline-block mt-4 px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm"
          >
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="text-gray-600 text-sm">
            Manage your profile and saved addresses
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/orders"
            className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
          >
            My Orders
          </Link>

          <Link
            href="/checkout"
            className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
          >
            Go to Checkout
          </Link>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Profile Card */}
        <div className="border rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold">
              {(customer.name || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{customer.name || "-"}</div>
              <div className="text-xs text-gray-600 truncate">{customer.email || "-"}</div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium">{customer.phone || "-"}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Addresses</span>
              <span className="font-medium">
                {(customer.addresses || []).length}
              </span>
            </div>
          </div>

          {/* Default Address */}
          <div className="mt-5 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Default Address</div>
              {defaultAddress ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  Not Set
                </span>
              )}
            </div>

            {defaultAddress ? (
              <div className="mt-2 text-sm text-gray-700 leading-5">
                <div className="font-medium">{defaultAddress.fullName}</div>
                <div className="text-gray-600 text-xs">
                  {defaultAddress.type?.toUpperCase()}
                </div>
                <div className="mt-1 text-gray-700">
                  {defaultAddress.address1}
                  {defaultAddress.address2 ? `, ${defaultAddress.address2}` : ""}
                  <br />
                  {defaultAddress.city}, {defaultAddress.state} -{" "}
                  {defaultAddress.pincode}
                </div>
                <div className="mt-1 text-gray-700">
                  <span className="text-gray-600">Phone:</span>{" "}
                  {defaultAddress.phone}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-600">
                Add an address and set it as default for faster checkout.
              </p>
            )}
          </div>

          {/* Quick tips */}
          <div className="mt-5 bg-gray-50 border rounded-xl p-4">
            <div className="text-sm font-semibold">Tip</div>
            <p className="text-xs text-gray-600 mt-1">
              Keep one default address to place orders quickly without selecting
              address every time.
            </p>
          </div>
        </div>

        {/* RIGHT: Address Management */}
        <div className="lg:col-span-2 space-y-4">
          {/* Address Form */}
          <div className="border rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>
                <p className="text-xs text-gray-600">
                  All fields marked with * are required
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Cancel Editing
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Full Name *"
                  value={form.fullName}
                  onChange={(v) => setForm({ ...form, fullName: v })}
                />
                <Input
                  label="Phone *"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />

                <Input
                  label="Pincode *"
                  value={form.pincode}
                  onChange={(v) => setForm({ ...form, pincode: v })}
                />
                <Select
                  label="Address Type"
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v })}
                  options={[
                    { label: "Home", value: "home" },
                    { label: "Office", value: "office" },
                  ]}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Address Line 1 *"
                    value={form.address1}
                    onChange={(v) => setForm({ ...form, address1: v })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Address Line 2 (Optional)"
                    value={form.address2}
                    onChange={(v) => setForm({ ...form, address2: v })}
                  />
                </div>

                <Input
                  label="City *"
                  value={form.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                />
                <Input
                  label="State *"
                  value={form.state}
                  onChange={(v) => setForm({ ...form, state: v })}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Landmark (Optional)"
                    value={form.landmark}
                    onChange={(v) => setForm({ ...form, landmark: v })}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-2 mt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) =>
                        setForm({ ...form, isDefault: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span>Set as default address</span>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                      ? "Update Address"
                      : "Save Address"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Address List */}
          <div className="border rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              <span className="text-xs text-gray-600">
                Total: {(customer.addresses || []).length}
              </span>
            </div>

            {(customer.addresses || []).length === 0 ? (
              <div className="mt-4 text-sm text-gray-600">
                No address found. Add your first address to checkout faster.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {customer.addresses.map((a) => (
                  <div
                    key={a._id}
                    className={`border rounded-xl p-4 ${
                      a.isDefault ? "border-green-400 bg-green-50/30" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">
                            {a.fullName}
                          </div>
                          {a.isDefault && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 mt-1">
                          {a.type?.toUpperCase()} • {a.phone}
                        </div>

                        <div className="text-sm text-gray-800 mt-2 leading-5">
                          {a.address1}
                          {a.address2 ? `, ${a.address2}` : ""}
                          <br />
                          {a.city}, {a.state} - {a.pincode}
                          {a.landmark ? (
                            <>
                              <br />
                              <span className="text-gray-600">
                                Landmark:
                              </span>{" "}
                              {a.landmark}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {!a.isDefault && (
                        <button
                          onClick={() => setDefault(a._id)}
                          className="px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50"
                        >
                          Set Default
                        </button>
                      )}

                      <button
                        onClick={() => startEdit(a)}
                        className="px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(a._id)}
                        className="px-3 py-1.5 rounded-lg border text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra Section */}
          <div className="border rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Account Shortcuts</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href="/orders"
                className="border rounded-xl p-4 hover:bg-gray-50"
              >
                <div className="font-medium">My Orders</div>
                <div className="text-xs text-gray-600 mt-1">
                  Track your purchases and invoices
                </div>
              </Link>

              <Link
                href="/checkout"
                className="border rounded-xl p-4 hover:bg-gray-50"
              >
                <div className="font-medium">Checkout</div>
                <div className="text-xs text-gray-600 mt-1">
                  Continue with your current cart
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reusable Small Input */
function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <select
        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
