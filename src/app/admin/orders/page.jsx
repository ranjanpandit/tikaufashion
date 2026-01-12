"use client";

import { useEffect, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const res = await fetch("/api/admin/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  async function updateStatus(orderId, status) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="space-y-6">
        {orders.map((o) => (
          <div key={o._id} className="border p-4">
            {/* HEADER */}
            <div className="flex justify-between mb-2">
              <div>
                <p className="font-semibold">
                  Order #{o._id.slice(-6)}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">₹{o.total}</p>
                <p className="text-sm">
                  {o.paymentMethod} / {o.paymentStatus}
                </p>
              </div>
            </div>

            {/* CUSTOMER */}
            <div className="text-sm mb-2">
              <p>
                <strong>{o.customer.name}</strong> — {o.customer.phone}
              </p>
              <p>
                {o.address.line1}, {o.address.city},{" "}
                {o.address.state} - {o.address.pincode}
              </p>
            </div>

            {/* ITEMS */}
            <div className="border-t pt-2 space-y-2">
              {o.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {i.name} × {i.qty}
                  </span>
                  <span>₹{i.price * i.qty}</span>
                </div>
              ))}
            </div>

            {/* STATUS */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-medium">
                Status:
              </span>

              <select
                value={o.status}
                onChange={(e) =>
                  updateStatus(o._id, e.target.value)
                }
                className="border p-1 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
