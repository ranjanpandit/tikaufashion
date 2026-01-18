"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();

  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border";

  if (s === "delivered") {
    return (
      <span className={`${base} bg-green-50 text-green-700 border-green-200`}>
        Delivered
      </span>
    );
  }

  if (s === "shipped") {
    return (
      <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>
        Shipped
      </span>
    );
  }

  return (
    <span className={`${base} bg-yellow-50 text-yellow-700 border-yellow-200`}>
      Pending
    </span>
  );
}

function PaymentPill({ paymentMethod, paymentStatus }) {
  const method =
    paymentMethod === "COD" ? "COD" : paymentMethod || "PREPAID";

  const status = (paymentStatus || "pending").toLowerCase();

  const base =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border";

  const statusClass =
    status === "paid"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "failed"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-white border-gray-200 text-gray-800">
        {method}
      </span>
      <span className={`${base} ${statusClass}`}>
        {status === "paid"
          ? "Paid"
          : status === "failed"
          ? "Failed"
          : "Pending"}
      </span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  // filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");

  async function loadOrders(p = 1) {
    setLoading(true);

    const qs = new URLSearchParams();
    qs.set("page", String(p));
    qs.set("limit", String(limit));

    if (status) qs.set("status", status);
    if (paymentMethod) qs.set("paymentMethod", paymentMethod);
    if (paymentStatus) qs.set("paymentStatus", paymentStatus);
    if (search.trim()) qs.set("search", search.trim());

    const res = await fetch(`/api/admin/orders?${qs.toString()}`);

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const data = await res.json();
    setOrders(data.orders || []);
    setPagination(data.pagination || null);
    setLoading(false);
  }

  async function updateStatus(orderId, newStatus) {
    setUpdatingId(orderId);

    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });

    await loadOrders(page);
    setUpdatingId("");
  }

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line
  }, []);

  function applyFilters() {
    setPage(1);
    loadOrders(1);
  }

  function resetFilters() {
    setStatus("");
    setPaymentMethod("");
    setPaymentStatus("");
    setSearch("");
    setPage(1);
    loadOrders(1);
  }

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage orders, status & payment updates
          </p>
        </div>

        <div className="text-sm text-gray-700">
          Total Orders:{" "}
          <b>{pagination?.total ?? orders.length}</b>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / phone / orderId"
            className="border rounded-md px-3 py-2 text-sm"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Payment Methods</option>
            <option value="COD">COD</option>
            <option value="PREPAID">PREPAID</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-black text-white rounded-md text-sm"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 border rounded-md text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="p-6">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-gray-600">No orders found</div>
      ) : (
        <>
          {/* LIST */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 border-b text-xs font-semibold text-gray-600">
              <div className="col-span-3">Order</div>
              <div className="col-span-3">Customer</div>
              <div className="col-span-2">Payment</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="divide-y">
              {orders.map((o) => (
                <div
                  key={o._id}
                  className="p-4 md:grid md:grid-cols-12 md:gap-3 md:items-center"
                >
                  {/* ORDER */}
                  <div className="md:col-span-3">
                    <p className="font-semibold">
                      #{o._id.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>

                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="text-blue-600 text-sm font-medium inline-block mt-2 md:hidden"
                    >
                      View Details →
                    </Link>
                  </div>

                  {/* CUSTOMER */}
                  <div className="md:col-span-3 mt-3 md:mt-0">
                    <p className="text-sm font-medium">
                      {o.customer?.name || "Guest"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {o.customer?.phone || "-"}
                    </p>
                  </div>

                  {/* PAYMENT */}
                  <div className="md:col-span-2 mt-3 md:mt-0">
                    <PaymentPill
                      paymentMethod={o.paymentMethod}
                      paymentStatus={o.paymentStatus}
                    />
                  </div>

                  {/* STATUS */}
                  <div className="md:col-span-2 mt-3 md:mt-0 flex items-center gap-2">
                    <StatusPill status={o.status} />

                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateStatus(o._id, e.target.value)
                      }
                      className="border rounded-md px-2 py-1 text-xs"
                      disabled={updatingId === o._id}
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {/* TOTAL */}
                  <div className="md:col-span-2 mt-3 md:mt-0 text-right">
                    <p className="font-semibold text-lg md:text-base">
                      ₹{o.total}
                    </p>

                    <Link
                      href={`/admin/orders/${o._id}`}
                      className="text-blue-600 text-sm font-medium hidden md:inline-block"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAGINATION */}
          {pagination && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-6">
              <p className="text-sm text-gray-600">
                Page <b>{pagination.page}</b> of{" "}
                <b>{pagination.totalPages}</b>
              </p>

              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    loadOrders(p);
                  }}
                  className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
                >
                  Prev
                </button>

                <button
                  disabled={!pagination.hasMore}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    loadOrders(p);
                  }}
                  className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
