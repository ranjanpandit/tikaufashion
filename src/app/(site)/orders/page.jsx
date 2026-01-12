"use client";

import { useEffect, useState } from "react";
import Link from "next/link"

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/my")
      .then((r) => {
        if (r.status === 401) {
          window.location.href = "/login";
          return [];
        }
        return r.json();
      })
      .then((data) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10">Loading…</div>;

  if (!orders.length) return <div className="p-10">No orders found</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.map((order) => (
        <div key={order._id} className="border p-4 mb-4 rounded">
          <div className="flex justify-between text-sm mb-2">
            <span>Order #{order._id.slice(-6)}</span>
            <span>{new Date(order.createdAt).toDateString()}</span>
          </div>

          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 text-sm mb-2">
              <img src={item.image} className="w-12 h-12 object-cover border" />
              <div>
                <p>{item.name}</p>
                <p className="text-gray-600">
                  ₹{item.price} × {item.qty}
                </p>
              </div>
            </div>
          ))}

          <div className="font-semibold mt-2">Total: ₹{order.total}</div>
          <Link href={`/orders/${order._id}`} className="text-blue-600 text-sm">
            View Details →
          </Link>
        </div>
      ))}
    </div>
  );
}
