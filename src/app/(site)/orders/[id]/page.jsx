import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

async function getOrder(id) {
  const h = await headers();
  const host = h.get("host");

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/orders/${id}`, {
    cache: "no-store",
    headers: {
      cookie: h.get("cookie") || "",
    },
  });

  if (!res.ok) return null;
  return res.json();
}

/* =========================
   BADGES
========================= */
function StatusBadge({ status }) {
  const s = (status || "PLACED").toUpperCase();

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border";

  if (s === "DELIVERED") {
    return (
      <span className={`${base} bg-green-50 text-green-700 border-green-200`}>
        Delivered
      </span>
    );
  }

  if (s === "SHIPPED") {
    return (
      <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>
        Shipped
      </span>
    );
  }

  if (s === "CANCELLED") {
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
        Cancelled
      </span>
    );
  }

  if (s === "CONFIRMED") {
    return (
      <span
        className={`${base} bg-purple-50 text-purple-700 border-purple-200`}
      >
        Confirmed
      </span>
    );
  }

  return (
    <span className={`${base} bg-yellow-50 text-yellow-800 border-yellow-200`}>
      Placed
    </span>
  );
}

function PaymentBadge({ paymentMethod, paymentStatus }) {
  const method =
    paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";

  const status = (paymentStatus || "PENDING").toUpperCase();

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border";

  const statusClass =
    status === "PAID"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "FAILED"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  const statusText =
    status === "PAID"
      ? "Paid"
      : status === "FAILED"
      ? "Payment Failed"
      : "Payment Pending";

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-white text-gray-800 border-gray-200">
        {method}
      </span>
      <span className={`${base} ${statusClass}`}>{statusText}</span>
    </div>
  );
}

/* =========================
   SMALL UI
========================= */
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right break-all text-gray-900">
        {value}
      </span>
    </div>
  );
}

function Card({ title, right, children }) {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) return notFound();

  // ✅ support both old & new address keys
  const address = order?.shippingAddress || order?.address || null;

  const placedOn = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "-";

  const subtotal = order?.subtotal ?? 0;
  const discount = order?.discount ?? 0;
  const total = order?.total ?? 0;

  // ✅ invoice endpoint (will return PDF)
  const invoiceUrl = `/api/orders/${order._id}/invoice`;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to My Orders
            </Link>
          </div>

          <h1 className="text-2xl font-bold mt-2">Order Details</h1>

          <p className="text-sm text-gray-600 mt-1">
            Order ID: <span className="font-medium">{order?._id}</span>
          </p>
        </div>

        {/* ✅ RIGHT ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={order?.status} />

          <a
            href={invoiceUrl}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl border bg-white text-sm font-semibold hover:bg-gray-50 transition"
          >
            Download Invoice
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* ITEMS */}
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Items</h2>
              <span className="text-sm text-gray-600">
                {order?.items?.length || 0} item(s)
              </span>
            </div>

            <div className="divide-y">
              {(order.items ?? []).map((item, i) => (
                <Link
                  key={item._id || `${item.productId}-${i}`}
                  href={`/product/${item.slug}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="p-4 md:p-5 flex gap-4">
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover border rounded-xl shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold leading-snug line-clamp-2">
                        {item.name}
                      </p>

                      {/* OPTIONS */}
                      {item.selectedOptions &&
                        Object.keys(item.selectedOptions).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-2">
                            {Object.entries(item.selectedOptions).map(
                              ([k, v]) => (
                                <span
                                  key={k}
                                  className="px-2 py-1 rounded-full bg-gray-100"
                                >
                                  {k}: {String(v)}
                                </span>
                              )
                            )}
                          </div>
                        )}

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Qty:{" "}
                          <span className="font-medium text-gray-900">
                            {item.qty}
                          </span>
                        </span>

                        <span className="font-semibold text-gray-900">
                          ₹{item.price * item.qty}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        ₹{item.price} × {item.qty}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* CUSTOMER + ADDRESS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CUSTOMER */}
            <Card title="Customer">
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">{order.customer?.name || "-"}</p>
                <p className="text-gray-600">{order.customer?.email || "-"}</p>
                <p className="text-gray-600">{order.customer?.phone || "-"}</p>
              </div>
            </Card>

            {/* ADDRESS */}
            <Card title="Delivery Address">
              {!address ? (
                <p className="text-sm text-gray-600">
                  Address not found in this order.
                </p>
              ) : (
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">
                    {address.fullName || order.customer?.name || "-"}
                  </p>

                  <p>
                    {address.line1 || address.address1 || "-"}
                    {address.line2 || address.address2
                      ? `, ${address.line2 || address.address2}`
                      : ""}
                  </p>

                  <p className="text-gray-600">
                    {address.city || "-"}, {address.state || "-"}{" "}
                    {address.pincode ? `- ${address.pincode}` : ""}
                  </p>

                  <p className="text-gray-600">
                    Phone: {address.phone || order.customer?.phone || "-"}
                  </p>

                  {(address.landmark || address.type) && (
                    <p className="text-xs text-gray-500 pt-2">
                      {address.type ? `Type: ${address.type}` : ""}
                      {address.type && address.landmark ? " • " : ""}
                      {address.landmark ? `Landmark: ${address.landmark}` : ""}
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* SUMMARY */}
          <div className="bg-white border rounded-2xl p-5 lg:sticky lg:top-6 shadow-sm">
            <h2 className="font-semibold mb-4">Order Summary</h2>

            <div className="space-y-2">
              <InfoRow label="Placed On" value={placedOn} />
              <div className="pt-2">
                <PaymentBadge
                  paymentMethod={order?.paymentMethod}
                  paymentStatus={order?.paymentStatus}
                />
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="space-y-2">
              <InfoRow label="Subtotal" value={`₹${subtotal}`} />

              {discount > 0 && (
                <InfoRow label="Discount" value={`-₹${discount}`} />
              )}

              {order?.coupon?.code && (
                <InfoRow label="Coupon" value={order.coupon.code} />
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Total</span>
                  <span className="font-bold text-lg">₹{total}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                href="/"
                className="flex-1 text-center px-4 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90"
              >
                Shop More
              </Link>
              <Link
                href="/orders"
                className="flex-1 text-center px-4 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50"
              >
                My Orders
              </Link>
            </div>
          </div>

          {/* STATUS CARD */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold mb-3">Order Status</h2>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Status</span>
              <StatusBadge status={order?.status} />
            </div>

            <p className="text-xs text-gray-500 mt-3">
              You will receive shipping and delivery updates on your registered
              phone/email.
            </p>

            {order?.razorpayOrderId && (
              <p className="text-xs text-gray-500 mt-2 break-all">
                Razorpay Order ID:{" "}
                <span className="font-medium">{order.razorpayOrderId}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
