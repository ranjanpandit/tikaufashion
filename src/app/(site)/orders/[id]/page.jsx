import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";


async function getOrder(id) {
  const h = await headers();
  const host = h.get("host");

  const protocol =
    process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/orders/${id}`, {
    cache: "no-store",
    headers: {
      cookie: h.get("cookie") || "",
    },
  });

  if (!res.ok) return null;
  return res.json();
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border";

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

function PaymentBadge({ paymentMethod, paymentStatus }) {
  const method =
    paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment";

  const status = (paymentStatus || "pending").toLowerCase();

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border";

  const statusClass =
    status === "paid"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "failed"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-white text-gray-800 border-gray-200">
        {method}
      </span>
      <span className={`${base} ${statusClass}`}>
        {status === "paid"
          ? "Paid"
          : status === "failed"
          ? "Payment Failed"
          : "Payment Pending"}
      </span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) return notFound();

  const placedOn = order?.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "-";

  const subtotal = order?.subtotal ?? 0;
  const discount = order?.discount ?? 0;
  const total = order?.total ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Order ID: <span className="font-medium">{order?._id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={order?.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* ITEMS */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Items</h2>
              <span className="text-sm text-gray-600">
                {order?.items?.length || 0} item(s)
              </span>
            </div>

            <div className="divide-y">
              {(order.items ?? []).map((item, i) => (
                <Link key={`${item.slug}`} href={`/product/${item.slug}`} >
                <div
                  key={item._id || `${item.productId}-${i}`}
                  className="p-4 md:p-5 flex gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 md:w-24 md:h-24 object-cover border rounded-lg shrink-0"
                  />

                  <div className="flex-1">
                    <p className="font-semibold leading-snug">
                      {item.name}
                    </p>

                    {/* OPTIONS */}
                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 && (
                        <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-2">
                          {Object.entries(item.selectedOptions).map(
                            ([k, v]) => (
                              <span
                                key={k}
                                className="px-2 py-1 rounded-full bg-gray-100"
                              >
                                {k}: {v}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Qty: <span className="font-medium">{item.qty}</span>
                      </span>

                      <span className="font-semibold">
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
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Customer</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">{order.customer?.name}</p>
                <p className="text-gray-600">{order.customer?.email}</p>
                <p className="text-gray-600">{order.customer?.phone}</p>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Delivery Address</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p>{order.address?.line1}</p>
                <p className="text-gray-600">
                  {order.address?.city}, {order.address?.state}{" "}
                  {order.address?.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (SUMMARY) */}
        <div className="space-y-6">
          {/* ORDER SUMMARY */}
          <div className="bg-white border rounded-xl p-5 lg:sticky lg:top-6">
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
          </div>

          {/* STATUS CARD */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Order Status</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Current Status
              </span>
              <StatusBadge status={order?.status} />
            </div>

            <p className="text-xs text-gray-500 mt-3">
              You’ll receive updates about shipping & delivery on your
              registered phone/email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
