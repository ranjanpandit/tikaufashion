import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderDetailsActions from "@/components/admin/OrderDetailsActions";

async function getAdminOrder(id) {
  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/admin/orders/${id}`, {
    cache: "no-store",
    headers: {
      cookie: h.get("cookie") || "",
    },
  });

  if (!res.ok) return null;
  return res.json();
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function formatINR(value) {
  try {
    return Number(value || 0).toLocaleString("en-IN");
  } catch {
    return value;
  }
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

// ✅ Server component
export default async function AdminOrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) return notFound();

  const customer = order.customer || {};
  const address = order.shippingAddress || {}; // ✅ FIXED
  const items = order.items || [];

  // ✅ Badge colors
  const status = String(order.status || "").toUpperCase();
  const paymentStatus = String(order.paymentStatus || "").toUpperCase();
  const paymentMethod = String(order.paymentMethod || "").toUpperCase();

  const statusTone =
    status === "PLACED"
      ? "blue"
      : status === "PENDING"
      ? "yellow"
      : status === "SHIPPED"
      ? "purple"
      : status === "DELIVERED"
      ? "green"
      : status === "CANCELLED"
      ? "red"
      : "gray";

  const paymentTone =
    paymentStatus === "PAID"
      ? "green"
      : paymentStatus === "PENDING"
      ? "yellow"
      : paymentStatus === "FAILED"
      ? "red"
      : "gray";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={statusTone}>Status: {status || "-"}</Badge>
            <Badge tone={paymentTone}>Payment: {paymentStatus || "-"}</Badge>
            <Badge tone={paymentMethod === "COD" ? "yellow" : "green"}>
              {paymentMethod || "-"}
            </Badge>

            <span className="text-xs text-gray-500 ml-1">
              Placed: {formatDate(order.createdAt)}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Order ID: <span className="font-mono">{String(order._id)}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <OrderDetailsActions orderId={String(order._id)} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          {/* <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={customer.name || "-"} />
              <Info label="Phone" value={customer.phone || "-"} />
              <Info label="Email" value={customer.email || "-"} />
              <Info label="Customer ID" value={order.customerId || "-"} mono />
            </div>
          </div> */}

          {/* Address */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Shipping Address</h2>
              <Badge tone="gray">
                {(address.type || "home").toUpperCase()}
              </Badge>
            </div>

            <div className="mt-3 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold">
                {address.fullName || customer.name || "-"}
              </p>
              <p className="text-gray-600">
                {address.phone || customer.phone || "-"}
              </p>
              <p className="mt-2">
                {address.line1 || "-"}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-gray-600">
                {address.city || "-"}, {address.state || "-"} -{" "}
                {address.pincode || "-"}
              </p>
              {address.landmark && (
                <p className="text-gray-600">Landmark: {address.landmark}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Items</h2>
                <p className="text-xs text-gray-500">
                  {items.length} item(s) in this order
                </p>
              </div>

              <span className="text-xs text-gray-500">
                Subtotal: ₹{formatINR(order.subtotal || 0)}
              </span>
            </div>

            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={String(item._id || item.cartId)}
                  className="p-4 flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover border rounded-xl"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.slug ? `/product/${item.slug}` : ""}
                        </p>
                      </div>

                      <p className="text-sm font-semibold whitespace-nowrap">
                        ₹{formatINR((item.price || 0) * (item.qty || 0))}
                      </p>
                    </div>

                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 && (
                        <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-2">
                          {Object.entries(item.selectedOptions).map(
                            ([k, v]) => (
                              <span
                                key={`${k}-${v}`}
                                className="px-2 py-1 bg-gray-100 rounded-full"
                              >
                                {k}: {String(v)}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
                      <span>
                        ₹{formatINR(item.price || 0)} × {item.qty || 0}
                      </span>
                      <span className="text-xs text-gray-500">
                        Product ID:{" "}
                        <span className="font-mono">
                          {String(item.productId || "-")}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white border rounded-xl p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold mb-4">Summary</h2>

            <div className="space-y-2 text-sm">
              <Row
                label="Subtotal"
                value={`₹${formatINR(order.subtotal || 0)}`}
              />

              {Number(order.discount || 0) > 0 && (
                <Row
                  label="Discount"
                  value={`- ₹${formatINR(order.discount || 0)}`}
                  valueClass="text-green-700"
                />
              )}

              {order.coupon?.code && (
                <Row label="Coupon" value={order.coupon.code} />
              )}

              <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{formatINR(order.total || 0)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-5 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Payment Info</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <Row label="Method" value={paymentMethod || "-"} />
                <Row label="Status" value={paymentStatus || "-"} />
                {paymentMethod == "PREPAID" && (
                  <>
                    <Row
                      label="Razorpay Order"
                      value={order.razorpayOrderId || "-"}
                      mono
                    />
                    <Row
                      label="Razorpay Payment"
                      value={order.razorpayPaymentId || "-"}
                      mono
                    />{" "}
                  </>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="mt-5 border-t pt-4">
              <p className="text-xs text-gray-500">
                Updated: {formatDate(order.updatedAt)}
              </p>
            </div>

            {/* Actions Placeholder */}
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/orders`}
                className="flex-1 text-center border px-3 py-2 rounded bg-white hover:bg-gray-50 text-sm"
              >
                Orders
              </Link>

              <Link
                href={`/admin/orders/${order._id}`}
                className="flex-1 text-center bg-black text-white px-3 py-2 rounded text-sm"
              >
                Refresh
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- UI HELPERS ----------------------------- */

function Info({ label, value, mono = false }) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, valueClass = "", mono = false }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className={`${valueClass} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
