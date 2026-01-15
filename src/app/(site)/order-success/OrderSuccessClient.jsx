"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="p-10 text-center">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="p-10 text-center text-red-600">
        Unable to load order details.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Order Placed 🎉</h1>
        <p className="text-gray-600 mt-1">
          Thank you for shopping with TikauFashion
        </p>
      </div>

      {/* ORDER INFO */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Order ID</span>
          <span className="font-medium">{order._id}</span>
        </div>

        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-600">Payment Method</span>
          <span className="font-medium">
            {order.paymentMethod === "COD"
              ? "Cash on Delivery"
              : "Online Payment"}
          </span>
        </div>

        {order?.coupon && (
          <div className="flex justify-between text-green-600 mt-2">
            <span>Coupon Applied</span>
            <span>{order.coupon.code}</span>
          </div>
        )}

        <div className="flex justify-between font-semibold mt-3">
          <span>Total Paid</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      {/* ITEMS */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h3 className="font-semibold mb-4">Items</h3>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div
              key={item._id || `${item.productId}-${idx}`}
              className="flex justify-between text-sm"
            >
              <span>
                {item.name} × {item.qty}
              </span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ADDRESS */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h3 className="font-semibold mb-3">Delivery Address</h3>

        <p className="text-sm text-gray-700">
          {order.customer.name}
          <br />
          {order.address.line1}
          <br />
          {order.address.city}, {order.address.state} -{" "}
          {order.address.pincode}
          <br />
          Phone: {order.customer.phone}
        </p>
      </div>

      {/* ACTION */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-md"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
