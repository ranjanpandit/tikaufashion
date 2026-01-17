"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ORDER
  ========================== */
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setOrder(null);
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error(err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const shippingAddress = useMemo(() => {
    // ✅ support old + new model
    return order?.shippingAddress || order?.address || null;
  }, [order]);

  const paymentMethodLabel = useMemo(() => {
    if (!order?.paymentMethod) return "-";
    return order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";
  }, [order]);

  const paymentStatusUI = useMemo(() => {
    const status = (order?.paymentStatus || "PENDING").toUpperCase();

    if (status === "PAID") {
      return {
        text: "PAID",
        className: "bg-green-100 text-green-700 border-green-200",
      };
    }

    if (status === "FAILED") {
      return {
        text: "FAILED",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    }

    return {
      text: "PENDING",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }, [order]);

  const orderDateText = useMemo(() => {
    if (!order?.createdAt) return "";
    try {
      return new Date(order.createdAt).toDateString();
    } catch {
      return "";
    }
  }, [order]);

  /* =========================
     UI STATES
  ========================== */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="border rounded-2xl bg-white p-8 text-center">
          <p className="text-sm text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="border rounded-2xl bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-red-600">
            Unable to load order details
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Please check your orders page.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/orders"
              className="px-6 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50"
            >
              View My Orders
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================== */
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* TOP SUCCESS HERO */}
      <div className="border rounded-2xl bg-white p-6 md:p-8 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 text-2xl">
              ✓
            </div>

            <div>
              <h1 className="text-2xl font-bold">Order Confirmed</h1>
              <p className="text-sm text-gray-600 mt-1">
                Thanks for shopping with TikauFashion. Your order has been placed.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                  Order #{String(order?._id || "").slice(-6)}
                </span>

                {orderDateText && (
                  <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-700">
                    {orderDateText}
                  </span>
                )}

                <span
                  className={`text-xs px-2 py-1 rounded-full border ${paymentStatusUI.className}`}
                >
                  Payment: {paymentStatusUI.text}
                </span>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="flex gap-2">
            <Link
              href="/orders"
              className="px-5 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
            >
              My Orders
            </Link>
            <Link
              href="/"
              className="px-5 py-2 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90"
            >
              Shop More
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT (Order + Items) */}
        <div className="lg:col-span-3 space-y-6">
          {/* ORDER SUMMARY */}
          <Card title="Order Summary">
            <div className="space-y-2 text-sm">
              <Row label="Order ID" value={order._id} />
              <Row label="Payment Method" value={paymentMethodLabel} />

              {order?.coupon?.code && (
                <Row
                  label="Coupon Applied"
                  value={order.coupon.code}
                  valueClass="text-green-700 font-semibold"
                />
              )}

              <div className="pt-3 mt-3 border-t">
                <Row
                  label={<span className="font-semibold">Total Paid</span>}
                  value={<span className="font-semibold">₹{order.total}</span>}
                />
              </div>
            </div>
          </Card>

          {/* ITEMS */}
          <Card title={`Items (${order?.items?.length || 0})`}>
            <div className="space-y-3">
              {(order.items || []).map((item, idx) => (
                <div
                  key={item._id || `${item.productId}-${idx}`}
                  className="flex gap-3 border rounded-xl p-3"
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg border object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                      {item.name}
                    </p>

                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Object.entries(item.selectedOptions)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" • ")}
                        </p>
                      )}

                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-600">
                        ₹{item.price} × {item.qty}
                      </span>

                      <span className="font-semibold">
                        ₹{item.price * item.qty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT (Delivery + Help) */}
        <div className="lg:col-span-2 lg:sticky lg:top-4 h-fit space-y-6">
          {/* DELIVERY ADDRESS */}
          <Card title="Delivery Address">
            {!shippingAddress ? (
              <p className="text-sm text-gray-600">
                Address info not found in this order.
              </p>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">
                  {shippingAddress.fullName || order?.customer?.name || "-"}
                </p>

                <p className="text-gray-600">
                  {shippingAddress.line1 ||
                    shippingAddress.address1 ||
                    "-"}
                  {shippingAddress.line2 || shippingAddress.address2
                    ? `, ${shippingAddress.line2 || shippingAddress.address2}`
                    : ""}
                </p>

                <p className="text-gray-600">
                  {shippingAddress.city || "-"}, {shippingAddress.state || "-"}{" "}
                  {shippingAddress.pincode ? `- ${shippingAddress.pincode}` : ""}
                </p>

                <p className="text-gray-600">
                  Phone: {shippingAddress.phone || order?.customer?.phone || "-"}
                </p>
              </div>
            )}
          </Card>

          {/* HELP BOX */}
          <div className="border rounded-2xl bg-black text-white p-5">
            <h3 className="font-semibold text-base">Need Help?</h3>
            <p className="text-sm text-white/80 mt-1">
              You can track your order from the orders page anytime.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/orders"
                className="text-center w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:opacity-90"
              >
                Track Order
              </Link>

              <Link
                href="/"
                className="text-center w-full py-3 rounded-xl border border-white/25 text-white text-sm font-medium hover:bg-white/10"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SMALL UI COMPONENTS
========================= */

function Card({ title, children }) {
  return (
    <div className="border rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, valueClass = "" }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-900 text-right break-all ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
