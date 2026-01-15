"use client";

import { useEffect, useState } from "react";
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
      const res = await fetch(`/api/orders/my?page=${p}&limit=${LIMIT}`);

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

  if (loading) return <div className="p-10">Loading…</div>;

  if (!orders.length) return <div className="p-10">No orders found</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order._id}
            className="border p-4 rounded-lg bg-white"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm mb-3">
              <span className="font-medium">
                Order #{order._id.slice(-6)}
              </span>
              <span className="text-gray-600">
                {new Date(order.createdAt).toDateString()}
              </span>
            </div>

            <div className="space-y-3">
              {(order.items || []).slice(0, 2).map((item, i) => (
                <div
                  key={item._id || `${order._id}-${i}`}
                  className="flex gap-3 text-sm"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover border rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-gray-600">
                      ₹{item.price} × {item.qty}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {order.items?.length > 2 && (
              <p className="text-xs text-gray-500 mt-3">
                + {order.items.length - 2} more item(s)
              </p>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4">
              <div className="font-semibold">
                Total: ₹{order.total}
              </div>

              <Link
                href={`/orders/${order._id}`}
                className="text-blue-600 text-sm"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* LOAD MORE */}
      <div className="flex justify-center mt-8">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 border rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        ) : (
          <p className="text-gray-500 text-sm">
            No more orders
          </p>
        )}
      </div>
    </div>
  );
}
