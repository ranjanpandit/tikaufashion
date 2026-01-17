"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 5;

  async function fetchOrders(p = 1, append = false) {
    try {
      const res = await fetch(`/api/orders/my?page=${p}&limit=${LIMIT}`, {
        cache: "no-store",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      const newOrders = data?.orders || [];
      const more = data?.pagination?.hasMore ?? false;

      setHasMore(more);

      if (append) {
        setOrders((prev) => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchOrders(1, false);
  }, []);

  async function loadMore() {
    if (!hasMore || loadingMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    await fetchOrders(nextPage, true);
    setPage(nextPage);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="border rounded-2xl bg-white p-8 text-center">
          <p className="text-sm text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="border rounded-2xl bg-white p-8 text-center">
          <h1 className="text-xl font-bold">My Orders</h1>
          <p className="text-sm text-gray-600 mt-2">
            You haven’t placed any orders yet.
          </p>

          <Link
            href="/"
            className="inline-block mt-5 px-6 py-3 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-gray-600">
            Track your purchases and order status
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Continue Shopping →
        </Link>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>

      {/* LOAD MORE */}
      <div className="flex justify-center mt-8">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 border rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Orders"}
          </button>
        ) : (
          <p className="text-gray-500 text-sm">No more orders</p>
        )}
      </div>
    </div>
  );
}

/* =========================
   ORDER CARD (ENTERPRISE)
========================= */
function OrderCard({ order }) {
  const createdAt = useMemo(() => {
    try {
      return new Date(order.createdAt).toDateString();
    } catch {
      return "";
    }
  }, [order.createdAt]);

  const statusUI = useMemo(() => {
    const s = (order.status || "PLACED").toUpperCase();

    if (s === "DELIVERED") {
      return {
        text: "DELIVERED",
        className: "bg-green-100 text-green-700 border-green-200",
      };
    }

    if (s === "SHIPPED") {
      return {
        text: "SHIPPED",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      };
    }

    if (s === "CANCELLED") {
      return {
        text: "CANCELLED",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    }

    if (s === "CONFIRMED") {
      return {
        text: "CONFIRMED",
        className: "bg-purple-100 text-purple-700 border-purple-200",
      };
    }

    return {
      text: "PLACED",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }, [order.status]);

  const paymentUI = useMemo(() => {
    const p = (order.paymentStatus || "PENDING").toUpperCase();

    if (p === "PAID") {
      return {
        text: "PAID",
        className: "bg-green-50 text-green-700 border-green-200",
      };
    }

    if (p === "FAILED") {
      return {
        text: "FAILED",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    }

    return {
      text: "PENDING",
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };
  }, [order.paymentStatus]);

  const previewItems = (order.items || []).slice(0, 2);

  return (
    <div className="border rounded-2xl bg-white p-5 shadow-sm">
      {/* TOP BAR */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Order #{String(order?._id || "").slice(-6)}
          </p>
          <p className="text-xs text-gray-500">{createdAt}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full border ${statusUI.className}`}
          >
            {statusUI.text}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded-full border ${paymentUI.className}`}
          >
            Payment: {paymentUI.text}
          </span>

          <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
            Total: ₹{order.total}
          </span>
        </div>
      </div>

      {/* ITEMS PREVIEW */}
      <div className="mt-4 space-y-3">
        {previewItems.map((item, i) => (
          <div
            key={item._id || `${order._id}-${i}`}
            className="flex gap-3 text-sm"
          >
            <img
              src={item.image || "/placeholder.png"}
              alt={item.name}
              className="w-12 h-12 object-cover border rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-1">{item.name}</p>
              <p className="text-xs text-gray-500">
                ₹{item.price} × {item.qty}
              </p>
            </div>

            <div className="text-sm font-semibold">
              ₹{item.price * item.qty}
            </div>
          </div>
        ))}
      </div>

      {/* MORE ITEMS */}
      {order.items?.length > 2 && (
        <p className="text-xs text-gray-500 mt-3">
          + {order.items.length - 2} more item(s)
        </p>
      )}

      {/* ACTIONS */}
      <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          Payment Method:{" "}
          <span className="font-medium text-gray-800">
            {order.paymentMethod === "COD" ? "COD" : "PREPAID"}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/orders/${order._id}`}
            className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
          >
            View Details
          </Link>
{/* 
          <Link
            href={`/order-success?orderId=${order._id}`}
            className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90"
          >
            View Summary
          </Link> */}
        </div>
      </div>
    </div>
  );
}
